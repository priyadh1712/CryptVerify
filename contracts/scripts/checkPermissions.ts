import { ethers } from "hardhat";
import { JWKSAutomatedOracle } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Checking permissions with account:", signer.address);

  // Get the deployed JWKSAutomatedOracle contract
  const oracleAddress = "0x7986bA7Feb5EAE2A7Cf4D5d86DD777d6F16b372c";
  const oracle = await ethers.getContractAt("JWKSAutomatedOracle", oracleAddress) as JWKSAutomatedOracle;

  try {
    // Check if we can read the contract
    console.log("\nChecking contract state...");
    const subscriptionId = await oracle.subscriptionId();
    const donID = await oracle.donID();
    const gasLimit = await oracle.gasLimit();

    console.log("Subscription ID:", subscriptionId.toString());
    console.log("DON ID:", donID);
    console.log("Gas Limit:", gasLimit.toString());

    // Try to estimate gas for triggerJWKSFetch
    console.log("\nEstimating gas for triggerJWKSFetch...");
    try {
      const gasEstimate = await oracle.triggerJWKSFetch.estimateGas();
      console.log("Gas estimate:", gasEstimate.toString());
    } catch (error) {
      console.error("Error estimating gas:", error);
    }

    // Check if we can call the function
    console.log("\nChecking if we can call triggerJWKSFetch...");
    try {
      const tx = await oracle.triggerJWKSFetch.populateTransaction();
      console.log("Transaction data:", tx.data);
    } catch (error) {
      console.error("Error preparing transaction:", error);
    }

  } catch (error) {
    console.error("Error checking permissions:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 