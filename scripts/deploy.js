const hre = require("hardhat");

async function main() {
  console.log("Deploying SonicIPToken contract...");

  // Deploy the contract
  const SonicIPToken = await hre.ethers.deployContract("SonicIPToken");
  await SonicIPToken.waitForDeployment();

  const address = await SonicIPToken.getAddress();
  console.log(`SonicIPToken deployed to: ${address}`);

  console.log("Waiting for confirmations...");
  // Wait for confirmations to ensure contract is deployed
  // Only for testnet/mainnet, not needed for local networks
  if (network.name !== "hardhat" && network.name !== "localhost") {
    await SonicIPToken.deploymentTransaction().wait(5); // Wait for 5 confirmations
    console.log("Confirmed. Contract deployed successfully!");
    
    // Verify on block explorer (e.g. Etherscan) if not on a local network
    try {
      console.log("Verifying contract on block explorer...");
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.error("Error verifying contract:", error.message);
    }
  }

  // Save the contract address to a file for easy reference
  const fs = require("fs");
  fs.writeFileSync(
    "contract-address.json",
    JSON.stringify({ SonicIPToken: address }, null, 2)
  );
  console.log("Contract address saved to contract-address.json");

  return address;
}

// Execute deployment
main()
  .then((address) => {
    console.log("Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error during deployment:", error);
    process.exit(1);
  });