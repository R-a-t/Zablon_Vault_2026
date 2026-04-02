import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("🚀 DEPLOYING TO POLYGON...");
  console.log("Account:", deployer.address);

  const Factory = await hre.ethers.getContractFactory("ZablonFlashBot");
  
  // We no longer pass POOL_PROVIDER here, making it impossible to revert on that variable
  const contract = await Factory.deploy({
    gasLimit: 3000000,
    maxPriorityFeePerGas: hre.ethers.parseUnits("40", "gwei"),
    maxFeePerGas: hre.ethers.parseUnits("180", "gwei")
  });

  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("✅ DEPLOYED SUCCESSFULLY AT:", address);

  const TOKENS = ["0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270", "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6", "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39", "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359"];
  const ROUTERS = ["0xa5E0829CaCED8fFDD4De3c43696c57F7D7A678ff", "0x1b02da8cb0d097eb8d57a175b88c7d8b47997506", "0x1b02dA8CB0D097eb8D57A175b88c7d8b47997506"];

  console.log("⚙️ Setting permissions...");
  for (const t of TOKENS) {
    for (const r of ROUTERS) {
      const tx = await contract.setAllowances(t, r);
      await tx.wait();
      console.log(`✔️ Done: ${t.substring(0,6)}`);
    }
  }
  console.log("✨ SYSTEM READY.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});