import { ethers } from "hardhat";
import { JWKSAutomatedOracle } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Checking subscription with account:", signer.address);

  // Get the deployed JWKSAutomatedOracle contract
  const oracleAddress = "0x7986bA7Feb5EAE2A7Cf4D5d86DD777d6F16b372c";
  const oracle = await ethers.getContractAt("JWKSAutomatedOracle", oracleAddress) as JWKSAutomatedOracle;

  try {
    // Check if contract is initialized
    const subscriptionId = await oracle.subscriptionId();
    console.log("\nSubscription ID:", subscriptionId.toString());

    // Check if contract is owner
    const isOwner = await oracle.owner() === signer.address;
    console.log("Is signer owner:", isOwner);

    // Check last timestamp
    const lastTimeStamp = await oracle.lastTimeStamp();
    console.log("Last timestamp:", lastTimeStamp.toString());

    // Check interval
    const interval = await oracle.interval();
    console.log("Interval:", interval.toString());

    // Check if we can read the source code
    const kidSource = await oracle.kidSource();
    const modulusSource = await oracle.modulusSource();
    console.log("\nSource Code Lengths:");
    console.log("Kid Source Length:", kidSource.length);
    console.log("Modulus Source Length:", modulusSource.length);

    // Try to estimate gas for triggerJWKSFetch
    console.log("\nTesting gas estimation for triggerJWKSFetch...");
    try {
      const gasEstimate = await oracle.triggerJWKSFetch.estimateGas();
      console.log("Gas estimate for triggerJWKSFetch:", gasEstimate.toString());
    } catch (error) {
      console.error("Error estimating gas for triggerJWKSFetch:", error);
    }

  } catch (error) {
    console.error("Error checking subscription:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 