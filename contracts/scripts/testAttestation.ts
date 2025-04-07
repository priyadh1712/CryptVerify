import { ethers } from "hardhat";
import { SignProtocolClient, SpMode, EvmChains } from "@ethsign/sp-sdk";
import { AuthWalletFactory } from "../typechain-types";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Testing attestation with account:", signer.address);

  // Get the deployed AuthWalletFactory contract
  const factoryAddress = "0xa0771c308a254795d3F6b4f4C78c2AB9320e8AB0";
  const factory = await ethers.getContractAt("AuthWalletFactory", factoryAddress) as AuthWalletFactory;

  try {
    // Test parameters
    const aud = "841686129182-e70p2msrn969bls4ghh9cionb1t6p5u5.apps.googleusercontent.com";
    const email = "test@example.com";
    const attestation = "Test Attestation";

    // Get the recipient's wallet address
    const recipientAddress = await factory.getDeployedAddress(aud, email, 0);
    console.log("\nRecipient Address:", recipientAddress);

    // Initialize SignProtocol client
    const client = new SignProtocolClient(SpMode.OnChain, {
      chain: EvmChains.baseSepolia,
    });

    // Create attestation
    console.log("\nCreating attestation...");
    const schemaId = "0x27e"; // Base Sepolia schema ID
    const result = await client.createAttestation({
      schemaId,
      recipients: [recipientAddress],
      data: { message: attestation },
      indexingValue: "0x",
    });

    console.log("\nAttestation created successfully!");
    console.log("Attestation ID:", result.attestationId);
    console.log("Transaction Hash:", result.txHash);

  } catch (error) {
    console.error("Error creating attestation:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 