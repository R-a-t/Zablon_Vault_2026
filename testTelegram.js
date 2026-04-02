import 'dotenv/config';
import axios from 'axios';

const TELEGRAM_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;

async function sendTelegram(message) {
    try {
        await axios.post(TELEGRAM_URL, {
            chat_id: process.env.TELEGRAM_CHAT_ID,
            text: message
        });
        console.log("✅ Telegram test message sent!");
    } catch (err) {
        console.log("❌ Telegram error:", err.message);
    }
}

sendTelegram("🤖 ZABLON BOT TEST ALERT: Telegram is working! 🚀, You are the BEST Zablon");