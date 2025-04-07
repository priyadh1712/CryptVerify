import { ethers } from "hardhat";
import { JWKSAutomatedOracle } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Updating subscription with account:", signer.address);

  // Get the deployed JWKSAutomatedOracle contract
  const oracleAddress = "0x3022202E91Be6bcBda210Be43a222B48CEBa2B95";
  const oracle = await ethers.getContractAt("JWKSAutomatedOracle", oracleAddress) as JWKSAutomatedOracle;

  // Update subscription ID to 301
  const newSubscriptionId = 301;
  console.log("Updating subscription ID to:", newSubscriptionId);
  
  try {
    // First, let's check if we're the owner
    const owner = await oracle.owner();
    console.log("Current owner:", owner);
    console.log("Our address:", signer.address);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error("Error: You are not the owner of the contract");
      process.exit(1);
    }

    // Update the subscription ID
    const tx = await oracle.setSubscriptionId(newSubscriptionId);
    console.log("Transaction sent:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt.blockNumber);
    
    // Verify the update
    const updatedSubscriptionId = await oracle.subscriptionId();
    console.log("Updated subscription ID:", updatedSubscriptionId.toString());
    
  } catch (error) {
    console.error("Error updating subscription ID:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 