import { ethers } from "ethers";
import TelegramBot from "node-telegram-bot-api";
import cron from "node-cron";
import { DateTime } from "luxon";
import { createClient } from '@vercel/kv';
import * as dotenv from "dotenv";
dotenv.config();

// --- 1. INITIAL SETUP & CONNECTIONS ---
const provider = new ethers.WebSocketProvider(process.env.POLYGON_WSS);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const tgBot = new TelegramBot(process.env.TELEGRAM_TOKEN);
const CHAT_ID = process.env.CHAT_ID;

// Vercel KV Setup
const kv = createClient({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

// --- 2. ADDRESS BOOK ---
const ROUTERS = {
    QuickSwap: "0xa5E0829CaCED8fFDD4De3c43696c57F7D7A678ff",
    SushiSwap: "0x1b02dA8CB0D097eb8D57A175b88c7d8b47997506"
};

const TOKENS = {
    USDC: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    WPOL: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    WETH: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    WBTC: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    LINK: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39"
};

const routerAbi = ["function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)"];
const quickContract = new ethers.Contract(ROUTERS.QuickSwap, routerAbi, provider);
const sushiContract = new ethers.Contract(ROUTERS.SushiSwap, routerAbi, provider);

// --- 3. TRACKING VARIABLES ---
let blocksScanned = 0;
let totalProfits = 0;

// --- 4. UTILITY FUNCTIONS ---
const sendAlert = (msg) => {
    tgBot.sendMessage(CHAT_ID, msg, { parse_mode: 'Markdown' });
};

async function updateVercel(block, status) {
    try {
        await kv.hset('zablon_stats', {
            last_block: block,
            status: status,
            total_profit: totalProfits,
            last_update: DateTime.now().setZone("Africa/Nairobi").toFormat("HH:mm:ss")
        });
    } catch (e) { console.error("KV Error:", e.message); }
}

// --- 5. SCHEDULING (KENYAN TIME) ---

// Heartbeat every 4 hours
cron.schedule("0 */4 * * *", () => {
    const time = DateTime.now().setZone("Africa/Nairobi").toFormat("HH:mm");
    sendAlert(`💓 *Heartbeat (${time} EAT)*\nStatus: Active\nBlocks Scanned: ${blocksScanned}`);
});

// Daily Report at 8:00 AM Kenyan Time
cron.schedule("0 8 * * *", () => {
    const date = DateTime.now().setZone("Africa/Nairobi").toFormat("dd LLL yyyy");
    sendAlert(`📅 *Daily Report: ${date}*\nTotal Blocks: ${blocksScanned}\nProfit Taken: ${totalProfits} POL\nStatus: Hunting...`);
    blocksScanned = 0; // Reset daily counter
}, { timezone: "Africa/Nairobi" });

// --- 6. CORE SCANNING LOGIC ---
console.log("🚀 Zablon Master Bot Starting...");
sendAlert("🚀 *Zablon Master Bot Online*\nMonitoring: LINK, WBTC, WETH, WPOL\nSchedule: 8AM EAT Reports Active.");

provider.on("block", async (blockNumber) => {
    blocksScanned++;
    const assets = [
        { name: "WPOL", addr: TOKENS.WPOL },
        { name: "WETH", addr: TOKENS.WETH },
        { name: "WBTC", addr: TOKENS.WBTC },
        { name: "LINK", addr: TOKENS.LINK }
    ];

    for (const asset of assets) {
        try {
            const amountIn = ethers.parseUnits("2000", 6); // 2000 USDC Flash Loan
            const path = [TOKENS.USDC, asset.addr];

            const [outQuick, outSushi] = await Promise.all([
                quickContract.getAmountsOut(amountIn, path),
                sushiContract.getAmountsOut(amountIn, path)
            ]);

            // Profit threshold: 0.5% (1005 / 1000)
            if (outSushi[1] > (outQuick[1] * 1005n) / 1000n) {
                const msg = `💰 *PROFIT OPPORTUNITY!* \nAsset: ${asset.name}\nBuy: QuickSwap\nSell: SushiSwap`;
                console.log(msg);
                sendAlert(msg);
                // Flash Loan Trigger would go here
            }
        } catch (err) { /* Pool might not exist, skipping silently */ }
    }

    // Update Vercel Dashboard every block
    updateVercel(blockNumber, "Scanning Assets...");
});

// Error handling for WSS disconnection
provider._websocket.on("close", () => {
    console.error("WSS Disconnected! Restarting...");
    process.exit(1); // PM2 will restart the process automatically
});