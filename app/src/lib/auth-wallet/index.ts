import { Wallet, WalletDetailsParams } from "@rainbow-me/rainbowkit";
import { createConnector } from "wagmi";

import { authWalletConnector } from "./connector";
import { appId, appName } from "./constant";

export const authWallet = (): Wallet => {
  return {
    id: appId,
    name: appName,
    iconUrl: "./oauth.png",
    iconBackground: "",

    createConnector: (walletDetails: WalletDetailsParams) => {
      const connector = authWalletConnector();
      return createConnector((config) => {
        return {
          ...connector(config),
          ...walletDetails,
        };
      });
    },
  };
};
