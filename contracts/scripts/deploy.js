const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying MayhouseExperience contract...");
  console.log("Network:", hre.network.name);
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  // Deploy the contract
  const MayhouseExperience = await hre.ethers.getContractFactory("MayhouseExperience");
  const contract = await MayhouseExperience.deploy();
  
  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  
  console.log("✅ MayhouseExperience deployed to:", contractAddress);
  console.log(""); 
  console.log("📋 Contract Details:");
  console.log("   - Platform Fee:", await contract.platformFeePercentage(), "%");
  console.log("   - Stake Percentage:", await contract.stakePercentage(), "%");
  console.log("   - Owner:", await contract.owner());
  console.log("");
  console.log("🔍 Verify contract on Etherscan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${contractAddress}`);
  console.log("");
  console.log("📝 Save this address to your frontend .env:");
  console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

