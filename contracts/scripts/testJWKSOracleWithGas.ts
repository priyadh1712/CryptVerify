import { ethers } from "hardhat";
import { JWKSAutomatedOracle } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing JWKS Oracle with account:", signer.address);

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

    // Get the function data
    const functionData = oracle.interface.encodeFunctionData("triggerJWKSFetch", []);
    console.log("\nFunction data:", functionData);

    // Try to estimate gas first
    try {
      const gasEstimate = await oracle.triggerJWKSFetch.estimateGas();
      console.log("Gas estimate:", gasEstimate.toString());
    } catch (error) {
      console.error("Error estimating gas:", error);
    }

    // Send the transaction with proper encoding
    const tx = await signer.sendTransaction({
      to: oracleAddress,
      data: functionData,
      gasLimit: 500000,
    });

    console.log("\nTransaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt?.blockNumber);

    // Listen for ModulusReceived event
    console.log("\nListening for ModulusReceived event...");
    const filter = oracle.filters.ModulusReceived();
    const events = await oracle.queryFilter(filter, receipt?.blockNumber);
    
    if (events.length > 0) {
      console.log("ModulusReceived events found:", events.length);
      events.forEach((event, index) => {
        console.log(`Event ${index + 1}:`);
        console.log("Kid:", event.args.kid);
        console.log("Modulus:", event.args.modulus);
      });
    } else {
      console.log("No ModulusReceived events found");
    }

  } catch (error: any) {
    console.error("\nError details:");
    if (error.data) {
      console.log("Error data:", error.data);
    }
    if (error.reason) {
      console.log("Error reason:", error.reason);
    }
    if (error.code) {
      console.log("Error code:", error.code);
    }
    if (error.transaction) {
      console.log("Transaction:", error.transaction);
    }
    if (error.receipt) {
      console.log("Receipt:", error.receipt);
    }
    console.log("Full error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 