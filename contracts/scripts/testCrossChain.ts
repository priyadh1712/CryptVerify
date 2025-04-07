import { ethers } from "hardhat";
import { Options } from "@layerzerolabs/lz-v2-utilities";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing cross-chain execution with account:", signer.address);

  // Get the deployed OmniExecutor contract
  const executorAddress = "0x74178088145C3C100c5834d1d94F0173172ad64D";
  const executor = await ethers.getContractAt("OmniExecutor", executorAddress);

  try {
    // Test parameters
    const GAS_LIMIT = 3000000;
    const MSG_VALUE = 0;
    const options = Options.newOptions().addExecutorLzReceiveOption(
      GAS_LIMIT,
      MSG_VALUE
    );

    // Prepare the transaction
    const tx = await executor.send(
      40231, // Optimism Sepolia endpoint ID
      ethers.ZeroAddress, // to address
      0, // value
      "0x", // data
      options.toHex(),
      { value: ethers.parseEther("0.0001") }
    );

    console.log("\nTransaction sent:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("Transaction confirmed in block:", receipt?.blockNumber);

  } catch (error) {
    console.error("Error executing cross-chain transaction:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 