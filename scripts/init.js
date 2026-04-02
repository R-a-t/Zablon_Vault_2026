import hre from "hardhat";

async function main() {
  const contractAddress = "0x676E24707b17fd077dB7DBADc329D8eeE52f3ede";
  const bot = await hre.ethers.getContractAt("ZablonFlashBot", contractAddress);

  const TOKENS = [
    "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", // WPOL
    "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", // WETH
    "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", // WBTC
    "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", // LINK
    "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"  // USDC
  ];

  const ROUTERS = [
    "0xa5E0829CaCED8fFDD4De3c43696c57F7D7A678ff", // QuickSwap
    "0x1b02dA8CB0d097eb8D57A175b88c7d8b47997506", // SushiSwap
    "0xedf6066a2b290C185783862C7F4776A2C8077AD1"  // PancakeSwap (Fixed Checksum)
  ];

  console.log("⚙️ Finalizing permissions for contract...");

  for (const t of TOKENS) {
    for (const r of ROUTERS) {
      try {
        const tx = await bot.setAllowances(t, r, { gasLimit: 100000 });
        await tx.wait();
        console.log(`✔️ Permission Set: Token ${t.substring(0,6)} on Router ${r.substring(0,6)}`);
      } catch (e) {
        console.log(`⚠️ Skip: Already set or error for ${t.substring(0,6)}`);
      }
    }
  }
  console.log("🚀 ALL SYSTEMS GO!");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});