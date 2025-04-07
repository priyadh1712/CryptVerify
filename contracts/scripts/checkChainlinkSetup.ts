import { ethers } from "hardhat";
import { JWKSAutomatedOracle } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Checking Chainlink setup with account:", signer.address);

  // Get the deployed JWKSAutomatedOracle contract
  const oracleAddress = "0x7986bA7Feb5EAE2A7Cf4D5d86DD777d6F16b372c";
  const oracle = await ethers.getContractAt("JWKSAutomatedOracle", oracleAddress) as JWKSAutomatedOracle;

  try {
    // Check contract state
    const subscriptionId = await oracle.subscriptionId();
    const donID = await oracle.donID();
    const gasLimit = await oracle.gasLimit();

    console.log("\nContract Configuration:");
    console.log("Subscription ID:", subscriptionId.toString());
    console.log("DON ID:", donID);
    console.log("Gas Limit:", gasLimit.toString());

    // Check if we can read the source code
    const kidSource = await oracle.kidSource();
    const modulusSource = await oracle.modulusSource();
    console.log("\nSource Code Lengths:");
    console.log("Kid Source Length:", kidSource.length);
    console.log("Modulus Source Length:", modulusSource.length);

    // Try to estimate gas for a simple function
    console.log("\nTesting gas estimation...");
    try {
      const gasEstimate = await oracle.owner.estimateGas();
      console.log("Gas estimate for owner() call:", gasEstimate.toString());
    } catch (error) {
      console.error("Error estimating gas:", error);
    }

  } catch (error) {
    console.error("Error checking Chainlink setup:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 