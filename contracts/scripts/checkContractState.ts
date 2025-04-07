import { ethers } from "hardhat";
import { JWKSAutomatedOracle } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Checking contract state with account:", signer.address);

  // Get the deployed JWKSAutomatedOracle contract
  const oracleAddress = "0x7986bA7Feb5EAE2A7Cf4D5d86DD777d6F16b372c";
  const oracle = await ethers.getContractAt("JWKSAutomatedOracle", oracleAddress) as JWKSAutomatedOracle;

  try {
    // Check basic contract state
    const subscriptionId = await oracle.subscriptionId();
    const donID = await oracle.donID();
    const gasLimit = await oracle.gasLimit();
    const lastTimeStamp = await oracle.lastTimeStamp();
    const interval = await oracle.interval();

    console.log("\nContract State:");
    console.log("Subscription ID:", subscriptionId.toString());
    console.log("DON ID:", donID);
    console.log("Gas Limit:", gasLimit.toString());
    console.log("Last Timestamp:", lastTimeStamp.toString());
    console.log("Interval:", interval.toString());

    // Try to get the owner (this might fail)
    try {
      const owner = await oracle.owner();
      console.log("Owner:", owner);
    } catch (error) {
      console.log("Could not get owner - contract might not have owner functionality");
    }

  } catch (error) {
    console.error("Error checking contract state:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 