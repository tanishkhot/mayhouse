const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MayhouseBooking contract...");
  console.log("Network:", hre.network.name);

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Platform wallet (can be changed later via updatePlatformWallet)
  const platformWallet = deployer.address; // Use deployer as platform wallet for now

  // Deploy the contract
  const MayhouseBooking = await hre.ethers.getContractFactory(
    "MayhouseBooking"
  );
  const contract = await MayhouseBooking.deploy(platformWallet);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ MayhouseBooking deployed to:", contractAddress);
  console.log("");
  console.log("📋 Contract Details:");
  console.log("   - Platform Wallet:", await contract.platformWallet());
  console.log(
    "   - Platform Fee:",
    await contract.platformFeePercentage(),
    "%"
  );
  console.log("   - Stake Percentage:", await contract.stakePercentage(), "%");
  console.log("   - Owner:", await contract.owner());
  console.log("");
  console.log("🔍 Verify contract on Etherscan:");
  console.log(
    `   npx hardhat verify --network ${hre.network.name} ${contractAddress} ${platformWallet}`
  );
  console.log("");
  console.log("📝 Save this address to your frontend .env:");
  console.log(`   NEXT_PUBLIC_BOOKING_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("");
  console.log("💡 Key Features:");
  console.log("   - No on-chain event runs needed");
  console.log("   - Uses off-chain event run UUIDs as references");
  console.log("   - Handles payment + 20% refundable stake");
  console.log("   - Host can mark attended/no-show after event");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
