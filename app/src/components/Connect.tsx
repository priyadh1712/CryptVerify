"use client";

import { GoogleLogin } from "@react-oauth/google";
import jwt from "jsonwebtoken";
import { Wallet } from "lucide-react";
import React, { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { baseSepoliaPublicClient } from "@/lib/clients";

import { AuthWalletFactoryAbi } from "../../../contracts/abis/AuthWalletFactory";
import { deployedContractAddress } from "../../../contracts/deployedContractAddress";

export const Connect = () => {
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async function () {
      if (!email) {
        return;
      }
      const aud = process.env.NEXT_PUBLIC_CLIENT_ID || "";
      const address = await baseSepoliaPublicClient.readContract({
        abi: AuthWalletFactoryAbi,
        address: deployedContractAddress.AuthWalletFactory,
        functionName: "getDeployedAddress",
        args: [aud, email, BigInt(0)],
      });
      window.localStorage.setItem("address", address);
      window.localStorage.setItem("email", email);
      if (window.opener && window.opener.parent) {
        window.opener.parent.postMessage({ type: "address", address }, "*");
      }
    })();
  }, [email]);

  return (
    <div className="w-[400px] h-[600px] bg-gradient-to-br from-blue-100 to-indigo-200 p-4 flex flex-col">
      <header className="bg-white/90 backdrop-blur-sm shadow-md rounded-2xl">
        <div className="px-6 py-4 flex justify-center items-center">
          <Wallet className="text-indigo-600 mr-2" size={24} />
          <h1 className="text-2xl font-bold text-indigo-600">AuthWallet 2.5</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center items-center p-4">
        <Card className="w-full max-w-sm bg-white/80 backdrop-blur-sm shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="text-center text-xl text-indigo-700">
              Connect Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6 text-gray-600">
              Sign in with Google to connect your wallet
            </p>
            <div className="flex justify-center">
              <GoogleLogin
                width="100%"
                onSuccess={({ credential }) => {
                  if (!credential) {
                    throw new Error("No credential");
                  }
                  const decodedCredential = jwt.decode(
                    credential,
                  ) as jwt.JwtPayload;
                  if (
                    decodedCredential.aud !== process.env.NEXT_PUBLIC_CLIENT_ID
                  ) {
                    throw new Error("Invalid audience");
                  }
                  if (typeof decodedCredential.email != "string") {
                    throw new Error("Invalid email");
                  }
                  setEmail(decodedCredential.email);
                }}
              />
            </div>
          </CardContent>
        </Card>
        <p className="flex justify-center items-center text-sm text-blue-800">
          ※ AuthWallet 2.5 is an EIP-1193-compatible wallet. It integrates
          seamlessly with viem, wagmi, and RainbowKit, making it easy to use.
        </p>
      </main>
    </div>
  );
};
