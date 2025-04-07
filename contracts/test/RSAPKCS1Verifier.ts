import { expect } from "chai";
import { ethers } from "hardhat";
import crypto from "crypto";

describe("RSAPKCS1Verifier", function () {
  it("should verify a valid RSA PKCS#1 signature", async function () {
    const RSAPKCS1Verifier = await ethers.getContractFactory(
      "RSAPKCS1Verifier"
    );
    const rsaPKCS1Verifier = await RSAPKCS1Verifier.deploy();
    await rsaPKCS1Verifier.waitForDeployment();

    // Generate RSA key pair
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicExponent: 65537,
    });

    const message = "message";
    const messageHash = crypto.createHash("sha256").update(message).digest();

    // ASN.1 prefix for SHA-256 (from PKCS#1 v1.5 specification)
    const asn1Prefix = Buffer.from(
      "3031300d060960864801650304020105000420",
      "hex"
    );

    // Combine ASN.1 prefix and the message hash
    const encodedMessage = Buffer.concat([asn1Prefix, messageHash]);

    // Create signature with PKCS#1 v1.5 padding and ASN.1 encoding
    const signature = crypto.privateEncrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      encodedMessage // Note: ASN.1 encoded message is signed
    );

    // Export public key in JWK format
    const publicKeyData = publicKey.export({
      format: "jwk",
    });

    if (!publicKeyData.n || !publicKeyData.e) {
      throw new Error("Invalid public key data");
    }

    // Convert the modulus and exponent from Base64 to buffers
    const modulus = Buffer.from(publicKeyData.n, "base64");
    const exponent = Buffer.from(publicKeyData.e, "base64");

    // Call the Solidity verifier with the hash, signature, exponent, and modulus
    const result = await rsaPKCS1Verifier.verify(
      messageHash,
      signature,
      exponent,
      modulus
    );

    // Expect the verification to succeed
    expect(result).to.equal(true);
  });
});
