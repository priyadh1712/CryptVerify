import { expect } from "chai";
import { ethers } from "hardhat";
import { AuthWallet, JWKSAutomatedOracleMock } from "../typechain-types";
import {
  aud,
  email,
  jwt,
  kid,
  modulus,
  nonce as expectedNonce,
} from "./data/jwt";
import { entryPointAddress } from "../externalContractAddress";
import { ZeroAddress } from "ethers";

describe("AuthWallet", function () {
  let authWallet: AuthWallet;
  let jwksAutomatedOracleMock: JWKSAutomatedOracleMock;

  before(async function () {
    const JWKSAutomatedOracleMockFactory = await ethers.getContractFactory(
      "JWKSAutomatedOracleMock"
    );
    jwksAutomatedOracleMock = await JWKSAutomatedOracleMockFactory.deploy();
    await jwksAutomatedOracleMock.waitForDeployment();
    const jwksAutomatedOracleMockAddress =
      await jwksAutomatedOracleMock.getAddress();
    const AuthWalletFactory = await ethers.getContractFactory("AuthWallet");
    authWallet = await AuthWalletFactory.deploy(
      entryPointAddress,
      jwksAutomatedOracleMockAddress,
      ZeroAddress,
      aud,
      email
    );
    await authWallet.waitForDeployment();
  });

  it("should validate JWT correctly", async function () {
    await jwksAutomatedOracleMock.setModulus(kid, modulus);
    const [isValid, nonce] = await authWallet.validateJWT(jwt);
    expect(isValid).to.be.true;
    expect(nonce).to.equal(expectedNonce);
  });
});
