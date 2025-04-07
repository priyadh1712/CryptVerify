import { expect } from "chai";
import { ethers } from "hardhat";
import crypto from "crypto";
import { JWT } from "../typechain-types";

import {
  jwt,
  kid,
  aud as expectedAud,
  nonce as expectedNonce,
  email as expectedEmail,
} from "./data/jwt";

describe("JWT", function () {
  let jwtDecoder: JWT;

  before(async function () {
    const JWTDecoder = await ethers.getContractFactory("JWT");
    jwtDecoder = await JWTDecoder.deploy();
    await jwtDecoder.waitForDeployment();
  });

  it("should split JWT correctly", async function () {
    const [header, payload, signature] = await jwtDecoder.split(jwt);
    const [expectedHeader, expectedPayload, expectedSignature] = jwt.split(".");
    expect(header).to.equal(expectedHeader);
    expect(payload).to.equal(expectedPayload);
    expect(signature).to.equal(expectedSignature);
  });

  it("should extract kid correctly", async function () {
    const [header] = await jwtDecoder.split(jwt);
    expect(await jwtDecoder.getKidFromHeader(header)).to.equal(kid);
  });

  it("should extract aud, email, and nonce", async function () {
    const [_, payload] = await jwtDecoder.split(jwt);
    const [aud, email, nonce] =
      await jwtDecoder.getAudAndEmailAndNonceFromPayload(payload);
    expect(aud).to.equal(expectedAud);
    expect(email).to.equal(expectedEmail);
    expect(nonce).to.equal(expectedNonce);
  });

  it("should calculate JWT hash correctly", async function () {
    const [header, payload] = await jwtDecoder.split(jwt);
    expect(await jwtDecoder.hashHeaderAndPayload(header, payload)).to.equal(
      `0x${crypto
        .createHash("sha256")
        .update(`${header}.${payload}`)
        .digest()
        .toString("hex")}`
    );
  });
});
