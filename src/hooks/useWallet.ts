// V2 Stub - Wallet functionality will be implemented in marketplace version

export interface WalletState {
  connected: boolean;
  address?: string;
  chainId?: number;
}

const defaultWalletState: WalletState = {
  connected: false,
};

export function useWallet() {
  // V2: This will be implemented with ethers/wagmi when marketplace is enabled
  return {
    wallet: defaultWalletState,
    connect: async () => {
      throw new Error('Wallet feature not enabled in v1');
    },
    disconnect: async () => {
      throw new Error('Wallet feature not enabled in v1');
    },
    signMessage: async (_message: string) => {
      throw new Error('Wallet feature not enabled in v1');
    },
  };
}
