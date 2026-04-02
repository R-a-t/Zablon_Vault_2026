import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const contractAddress = "0x676E24707b17fd077dB7DBADc329D8eeE52f3ede";
  const amount = hre.ethers.parseEther("13.0");

  console.log(`⛽ Sending 13 POL from ${deployer.address} to Bot...`);
  
  const tx = await deployer.sendTransaction({
    to: contractAddress,
    value: amount,
  });

  await tx.wait();
  console.log("✅ Bot Funded! Fees are now covered.");
}

main().catch(console.error);