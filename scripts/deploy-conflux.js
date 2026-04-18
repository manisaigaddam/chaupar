const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  
  console.log(`\n🚀 Deploying ChauparGame to ${network}...`);
  console.log(`📍 Deployer: ${deployer.address}`);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} CFX\n`);

  const ChauparGame = await hre.ethers.getContractFactory("ChauparGame");
  const game = await ChauparGame.deploy();
  await game.waitForDeployment();
  
  const gameAddress = await game.getAddress();
  console.log(`✅ ChauparGame deployed to: ${gameAddress}`);

  // Fund treasury with 1 CFX for testing
  const treasuryAmount = hre.ethers.parseEther("10");
  console.log(`\n💰 Funding treasury with 10 CFX...`);
  const fundTx = await game.fundTreasury({ value: treasuryAmount });
  await fundTx.wait();
  console.log(`✅ Treasury funded!`);

  // Set exposure limit
  const exposureTx = await game.setExposureLimit(hre.ethers.parseEther("50"));
  await exposureTx.wait();
  console.log(`✅ Exposure limit set to 50 CFX`);

  const explorerBase = network === "confluxEspace" 
    ? "https://evm.confluxscan.io" 
    : "https://evmtestnet.confluxscan.io";

  console.log(`\n📋 Contract: ${explorerBase}/address/${gameAddress}`);
  console.log(`\n📝 Add to your .env:`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${gameAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
