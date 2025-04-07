import { appId, appName, chainId } from "./constant";
import { AuthWalletProvider } from "./provider";

const provider = new AuthWalletProvider();

export const authWalletConnector = () => {
  return (config: any) => {
    return {
      id: `${appId}-connector`,
      name: `${appName} Connector`,
      type: "",

      async connect() {
        await provider.init();
        window.ethereum = provider;
        const accounts = await provider.request({ method: "eth_accounts" });
        return { accounts, chainId };
      },

      async disconnect() {},

      async getAccounts() {
        const accounts = await provider.request({ method: "eth_accounts" });
        return accounts;
      },

      async getChainId() {
        return await provider.request({ method: "eth_chainId" });
      },

      async getProvider() {
        return provider;
      },

      async isAuthorized() {
        return false;
      },

      async switchChain({ chainId }: { chainId: number }) {
        const chain = config.chains.find((chain: any) => chain.id === chainId);
        if (!chain) {
          throw new Error(`Chain with ID ${chainId} not found`);
        }
        return chain;
      },

      onAccountsChanged(accounts: string[]) {
        console.log("Accounts changed", accounts);
      },

      onChainChanged(chainId: string) {
        console.log("Chain changed", chainId);
      },

      onDisconnect(error?: Error) {
        console.log("Disconnected", error);
      },
    };
  };
};
