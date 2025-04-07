"use client";

import { EvmChains, SignProtocolClient, SpMode } from "@ethsign/sp-sdk";
import { Options } from "@layerzerolabs/lz-v2-utilities";
import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { motion } from "framer-motion";
import {
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Shield,
  Wallet,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  Address,
  Hex,
  encodeFunctionData,
  parseEther,
  zeroAddress,
} from "viem";
import { useAccount, useBalance, useDisconnect, useWalletClient } from "wagmi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { baseSepoliaPublicClient } from "@/lib/clients";

import { AuthWalletFactoryAbi } from "../../../contracts/abis/AuthWalletFactory";
import { JWKSAutomatedOracle } from "../../../contracts/abis/JWKSAutomatedOracle";
import { OmniExecutorAbi } from "../../../contracts/abis/OmniExecutor";
import { deployedContractAddress } from "../../../contracts/deployedContractAddress";
import { optimismSepoliaEid } from "../../../contracts/layerZeroConfig";

export const AuthWalletApp = () => {
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();
  const { isConnected, address } = useAccount();

  const { data: walletClient } = useWalletClient();
  const { data: balance } = useBalance({ address });

  const [sendToEmail, setSendToEmail] = useState(
    "no-web3-wallet-holder@gmail.com",
  );
  // const [sendAmount, setSendAmount] = useState("");
  const [myEmail, setMyEmail] = useState("");

  const [oracleStatus, setOracleStatus] = useState("Loading...");

  const [attestation, setAttestation] = useState("EthOnline 2024 Attendee");
  const [omniExecuteTxHash, setOmniExecuteTxHash] = useState("");

  const [to, setTo] = useState<Address>("0x");

  useEffect(() => {
    const aud = process.env.NEXT_PUBLIC_CLIENT_ID || "";
    baseSepoliaPublicClient
      .readContract({
        abi: AuthWalletFactoryAbi,
        address: deployedContractAddress.AuthWalletFactory,
        functionName: "getDeployedAddress",
        args: [aud, sendToEmail, BigInt(0)],
      })
      .then((to) => {
        setTo(to);
      });
  }, [sendToEmail]);

  useEffect(() => {
    if (isConnected) {
      const storedEmail = localStorage.getItem("email");
      if (storedEmail) {
        setMyEmail(storedEmail);
      }

      // scroll to top
      window.scrollTo(0, 0);
    }

    fetch("https://www.googleapis.com/oauth2/v3/certs")
      .then((response) => response.json())
      .then(async (data) => {
        let oracleStatus = "Good";
        for (const key of data.keys) {
          const modulus = await baseSepoliaPublicClient.readContract({
            abi: JWKSAutomatedOracle,
            address: deployedContractAddress.JWKSAutomatedOracle,
            functionName: "kidToModulus",
            args: [key.kid],
          });
          if (
            modulus.substring(2) !==
            Buffer.from(key.n, "base64").toString("hex")
          ) {
            oracleStatus = "Bad";
          }
        }
        setOracleStatus(oracleStatus);
      })
      .catch((error) => {
        console.error("Error fetching JWKS data:", error);
        setOracleStatus("Bad");
      });
  }, [isConnected]);

  // const handleSendETH = async () => {
  //   if (!walletClient) {
  //     throw new Error("No wallet client");
  //   }
  //   if (!sendToEmail) {
  //     throw new Error("Please enter recipient's email address");
  //   }
  //   if (!sendAmount || parseFloat(sendAmount) <= 0) {
  //     throw new Error("Please enter a valid amount to send");
  //   }
  //   const hash = await walletClient.sendTransaction({
  //     to,
  //     value: parseEther(sendAmount),
  //     data: "0x",
  //   });
  //   console.log("hash", hash);
  //   console.log("Sending", sendAmount, "ETH to:", sendToEmail);
  // };

  const handleConnect = () => {
    if (openConnectModal) {
      openConnectModal();
    }
  };

  const functionUrl = "https://functions.chain.link/base-sepolia/301";
  const automationUrl = "https://automation.chain.link/base-sepolia/1099904432";
  const certUrl = "https://www.googleapis.com/oauth2/v3/certs";

  const schemaIdWithType = "onchain_evm_84532_0x27e";

  const handleSendAttestation = async () => {
    const aud = process.env.NEXT_PUBLIC_CLIENT_ID || "";
    const to = await baseSepoliaPublicClient.readContract({
      abi: AuthWalletFactoryAbi,
      address: deployedContractAddress.AuthWalletFactory,
      functionName: "getDeployedAddress",
      args: [aud, sendToEmail, BigInt(0)],
    });

    const schemaId = schemaIdWithType.split("_").pop() as Hex;
    const client = new SignProtocolClient(SpMode.OnChain, {
      chain: EvmChains.baseSepolia,
    });
    await client.createAttestation({
      schemaId,
      recipients: [to],
      data: { message: attestation },
      indexingValue: "0x",
    });
  };

  const handleOmniExecute = async () => {
    if (!walletClient) {
      throw new Error("No wallet client");
    }
    const GAS_LIMIT = 3000000;
    const MSG_VALUE = 0;
    const options = Options.newOptions().addExecutorLzReceiveOption(
      GAS_LIMIT,
      MSG_VALUE,
    );

    const data = encodeFunctionData({
      abi: OmniExecutorAbi,
      functionName: "send",
      args: [
        optimismSepoliaEid,
        zeroAddress,
        BigInt(0),
        "0x",
        options.toHex() as Hex,
      ],
    });
    const hash = await walletClient.sendTransaction({
      to: deployedContractAddress.OmniExecutor,
      value: parseEther("0.0001"),
      data: data,
    });
    console.log("hash", hash);
    setOmniExecuteTxHash(hash);
  };

  const [showJWKSImage, setShowJWKSImage] = useState(false);
  const [showOmnichainImage, setShowOmnichainImage] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-300">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div
            className="flex justify-center items-center"
            onClick={() => disconnect()}
          >
            <Wallet className="text-indigo-600 mr-2" size={24} />
            <h1 className="text-2xl font-bold text-indigo-600">
              CryptVerify
            </h1>
          </div>
          <ConnectButton
            showBalance={false}
            chainStatus={"none"}
            accountStatus={"full"}
          />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isConnected ? (
          <>
            <div className="grid lg:grid-cols-2 gap-6 mb-16">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>Wallet Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label>Address:</Label>
                    <div className="text-xs lg:text-base">{address}</div>
                  </div>
                  <div>
                    <Label>Balance:</Label>
                    <div>
                      {balance?.formatted} {balance?.symbol}
                    </div>
                  </div>
                  <div>
                    <Label>Your Email:</Label>
                    <div>{myEmail}</div>
                  </div>
                  <div>
                    <Label>Identity Provider:</Label>
                    <div>Google</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle>JWKS Oracle Information</CardTitle>
                  <HelpCircle
                    className="h-4 w-4 cursor-pointer"
                    onClick={() => setShowJWKSImage(!showJWKSImage)}
                  />
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label>JWKS URL:</Label>
                    <div className="text-xs lg:text-sm break-all">
                      <a
                        href={certUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {certUrl}
                      </a>
                    </div>
                  </div>
                  <div>
                    <Label>Chainlink Functions URL:</Label>
                    <div className="text-xs lg:text-sm break-all">
                      <a
                        href={functionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {functionUrl}
                      </a>
                    </div>
                  </div>
                  <div>
                    <Label>Chainlink Automation URL:</Label>
                    <div className="text-xs lg:text-sm break-all">
                      <a
                        href={automationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {automationUrl}
                      </a>
                    </div>
                  </div>
                  <div>
                    <Label>Status:</Label>
                    <div
                      className={`text-xs lg:text-sm font-semibold ${
                        oracleStatus === "Good"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {oracleStatus}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mb-8">
              <h2 className="text-xl font-bold text-indigo-600 text-center">
                Use Cases with Automatic Onboarding
              </h2>
            </div>
            {/* <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Benefit 1: Send ETH by Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sendToEmail">Recipient Email:</Label>
                  <Input
                    id="sendToEmail"
                    type="email"
                    placeholder="Enter recipient's email address"
                    value={sendToEmail}
                    onChange={(e) => setSendToEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sendToEmail">
                    Calculated Wallet Address:
                  </Label>
                  <Input
                    id="toAddress"
                    type="text"
                    value={to}
                    disabled={true}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sendAmount">Amount (ETH):</Label>
                  <Input
                    id="sendAmount"
                    type="number"
                    step="0.000000000000000001"
                    min="0"
                    placeholder="Enter amount to send"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleSendETH}
                  disabled={!sendToEmail || !sendAmount}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  Send ETH
                </Button>
              </CardContent>
            </Card> */}
            <Card className="bg-white/80 backdrop-blur-sm mb-8">
              <CardHeader>
                <CardTitle>
                  Use Case 1: Send Sign Protocol Attestation by Email
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sendToEmail">Recipient Email:</Label>
                  <Input
                    id="sendToEmail"
                    type="email"
                    placeholder="Enter recipient's email address"
                    value={sendToEmail}
                    onChange={(e) => setSendToEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="sendToEmail">
                    Calculated Wallet Address:
                  </Label>
                  <Input
                    id="toAddress"
                    type="text"
                    value={to}
                    disabled={true}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="attestation">Sample Schema ID</Label>
                  <p>
                    <a
                      href={`https://testnet-scan.sign.global/schema/${schemaIdWithType}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {schemaIdWithType}
                    </a>
                  </p>
                </div>
                <div>
                  <Label htmlFor="attestation">Sample Attestation</Label>
                  <Input
                    id="attestation"
                    placeholder="Attestation to send"
                    value={attestation}
                    onChange={(e) => setAttestation(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleSendAttestation}
                  disabled={!attestation}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  Send Attestation
                </Button>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>
                  Use Case 2: Omni Account Abstraction Execution with LayerZero
                </CardTitle>
                <HelpCircle
                  className="h-4 w-4 cursor-pointer"
                  onClick={() => setShowOmnichainImage(!showOmnichainImage)}
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Disabled Select Box */}
                <div>
                  <label
                    htmlFor="destination-chain"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Destination Chain
                  </label>
                  <select
                    id="destination-chain"
                    name="destination-chain"
                    // disabled
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option>Optimism Sepolia</option>
                  </select>
                </div>

                <Button
                  onClick={handleOmniExecute}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  Test Omni Execution
                </Button>
                <p className="text-sm text-gray-600 font-semibold">
                  AuthWallet 2.5 contracts are deployed omnichain, allowing
                  users to maintain the same wallet address across multiple
                  chains, meaning they are onboarded to all EVM chains
                  simultaneously without any action. Our omnichain execution
                  environment enables seamless transactions between chains,
                  while eliminating the complexity of gas fee management.
                </p>
                {omniExecuteTxHash && (
                  <div>
                    <a
                      href={`https://testnet.layerzeroscan.com/tx/${omniExecuteTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {`https://testnet.layerzeroscan.com/tx/${omniExecuteTxHash}`}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <Wallet className="inline-block text-indigo-600 mb-6" size={80} />
              <h1 className="text-5xl font-bold text-indigo-600 mb-6">
                CryptVerify
              </h1>
              <p className="max-w-3xl mx-auto text-2xl text-gray-700">
                Simplifying Wallet Management with OAuth2.0, OpenID Connect,
                JWT, RSA Verification and Account Abstraction
              </p>
            </motion.section>

            <section className="space-y-8">
              <h2 className="text-3xl font-bold text-indigo-600 text-center mb-8">
                Addressing Key Challenges
              </h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Wallet,
                    title: "Wallet Complexity",
                    description:
                      "Managing private keys, seed phrases, and multiple accounts is overwhelmingly complex for most users.",
                  },
                  {
                    icon: Shield,
                    title: "Security vs. Usability",
                    description:
                      "Advanced solutions like MPC wallets provide security but are too complicated for average users to adopt.",
                  },
                  {
                    icon: Lightbulb,
                    title: "The Need for Simplicity",
                    description:
                      "A secure and user-friendly wallet solution is desperately needed. This is where AuthWallet 2.5 steps in to bridge the gap.",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Card className="bg-white/90 backdrop-blur-sm shadow-lg h-full">
                      <CardContent className="p-6 flex flex-col items-center h-full">
                        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                          <item.icon className="text-indigo-600" size={32} />
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-indigo-700 text-center">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-center flex-grow">
                          {item.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>

            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-indigo-600 text-center">
                How it works?
              </h2>
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-semibold text-indigo-600 mb-4">
                    Usual Social Login Wallet
                  </h3>
                  <div className="relative aspect-video">
                    <img
                      src="/social-login-diagram.png"
                      alt="Social Login Wallet Diagram"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-2xl font-semibold text-indigo-600 mb-4">
                    AuthWallet 2.5
                  </h3>
                  <div className="relative aspect-video">
                    <img
                      src="/auth-wallet-diagram.png"
                      alt="AuthWallet 2.5 Diagram"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-bold text-indigo-600 text-center mb-8">
                Benefits
              </h2>
              <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
                <CardContent className="p-8 space-y-6">
                  {[
                    "Simplicity: No need to manage complex keys or passwords.",
                    "Trust Model: No need to trust any additional services beyond what you already trust for Gmail.",
                    "Automatic Onboarding: Wallet address is generated from email address before users even sign in, and holding assets are accessed any time later. All Gmail holders are already onboarded.",
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="flex items-center space-x-4"
                    >
                      <ArrowRight className="text-indigo-600 flex-shrink-0" />
                      <p className="text-lg text-gray-700">{item}</p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.section>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Card className="bg-indigo-600 text-white text-center shadow-xl border border-indigo-400">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">
                    Ready to Experience the Future of Wallet Management?
                  </h3>
                  <p className="mb-6 text-indigo-100">
                    Connect your wallet and start your journey with CryptVerify
                    today!
                  </p>
                  <Button
                    onClick={handleConnect}
                    className="bg-white text-indigo-600 hover:bg-indigo-100 font-semibold py-2 px-6 rounded-full text-lg transition duration-300"
                  >
                    Connect Wallet
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </main>
      <footer className="bg-white shadow-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-gray-600">
          <p>© 2024 CryptVerify. All rights reserved.</p>
        </div>
      </footer>
      {showJWKSImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-5xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">How JWKS Oracle Works</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJWKSImage(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img
              src="/how-it-works.png"
              alt="JWKS Oracle Diagram"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
      {showOmnichainImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg max-w-5xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                How Omnichain Execution Works
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOmnichainImage(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <img
              src="/omnichain.png"
              alt="Omnichain Diagram"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
