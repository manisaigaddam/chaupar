const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  // Faucet USDT0 on Conflux eSpace Testnet (6 decimals)
  const USDT_ADDRESS = "0x4d1beb67e8f0102d5c983c26fdf0b7c6fff37a0c";
  const USDT_DECIMALS = 6;
  const INITIAL_LIQUIDITY = 100n * 10n ** 6n; // 100 USDT0

  console.log(`\n🚀 Deploying ChauparGameUSDT to ${network}...`);
  console.log(`📍 Deployer: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 CFX Balance: ${hre.ethers.formatEther(balance)} CFX`);

  // Check USDT balance
  const usdtAbi = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];
  const usdtContract = new hre.ethers.Contract(USDT_ADDRESS, usdtAbi, deployer);
  const usdtBalance = await usdtContract.balanceOf(deployer.address);
  console.log(`💵 USDT0 Balance: ${Number(usdtBalance) / 1e6} USDT0`);

  if (usdtBalance < INITIAL_LIQUIDITY) {
    console.error(`❌ Deployer needs at least ${Number(INITIAL_LIQUIDITY) / 1e6} USDT0. Current: ${Number(usdtBalance) / 1e6}`);
    process.exit(1);
  }

  // Deploy ChauparGameUSDT
  const ChauparGameUSDT = await hre.ethers.getContractFactory("ChauparGameUSDT");
  const game = await ChauparGameUSDT.deploy(USDT_ADDRESS, USDT_DECIMALS);
  await game.waitForDeployment();

  const gameAddress = await game.getAddress();
  console.log(`\n✅ ChauparGameUSDT deployed to: ${gameAddress}`);

  // Approve USDT0 for the game contract
  console.log(`\n🔐 Approving USDT0 for game contract...`);
  const approveTx = await usdtContract.approve(gameAddress, hre.ethers.MaxUint256);
  await approveTx.wait();
  console.log(`✅ USDT0 approved!`);

  // Deposit initial liquidity to house pool
  console.log(`\n💰 Depositing ${Number(INITIAL_LIQUIDITY) / 1e6} USDT0 to house pool...`);
  const depositTx = await game.depositLiquidity(INITIAL_LIQUIDITY);
  await depositTx.wait();
  console.log(`✅ House pool funded!`);

  // Set exposure limit
  const exposureLimit = 500n * 10n ** 6n; // 500 USDT0
  const exposureTx = await game.setExposureLimit(exposureLimit);
  await exposureTx.wait();
  console.log(`✅ Exposure limit set to ${Number(exposureLimit) / 1e6} USDT0`);

  // Verify deployment
  const treasury = await game.treasuryBalance();
  const shares = await game.totalLpShares();
  console.log(`\n📊 Treasury: ${Number(treasury) / 1e6} USDT0`);
  console.log(`📊 Total LP Shares: ${Number(shares)}`);

  const explorerBase = network === "confluxEspace"
    ? "https://evm.confluxscan.io"
    : "https://evmtestnet.confluxscan.io";

  console.log(`\n📋 Game Contract: ${explorerBase}/address/${gameAddress}`);
  console.log(`📋 USDT0 Token: ${explorerBase}/address/${USDT_ADDRESS}`);
  console.log(`\n📝 Add to your frontend/.env:`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${gameAddress}`);
  console.log(`NEXT_PUBLIC_USDT_ADDRESS=${USDT_ADDRESS}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
