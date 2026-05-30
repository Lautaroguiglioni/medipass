import { getDefaultConfig } from 'connectkit';
import { createConfig, http } from 'wagmi';
import { defineChain } from 'viem';

// Define the Monad Testnet chain according to the technical requirements
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    name: 'MON',
    symbol: 'MON',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
    },
  },
  // Hardcoded fees to save network latency (eth_gasPrice call avoidance)
  fees: {
    estimateFeesPerGas: async () => {
      return {
        maxFeePerGas: 52000000000n, // 52 gwei
        maxPriorityFeePerGas: 52000000000n, // 52 gwei
      };
    },
  },
});

export const config = createConfig(
  getDefaultConfig({
    // Your dApp's chains
    chains: [monadTestnet],
    transports: {
      [monadTestnet.id]: http('https://testnet-rpc.monad.xyz', {
        batch: true, // Batch requests for state reads to optimize Multicall
      }),
    },

    // Required dApp metadata
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3f6e80b2a8d50e8a71d87ee9db5678cd', // Fallback public key

    appName: 'MediPass',
    appDescription: 'Infraestructura de recetas médicas portables en Monad',
    appUrl: 'https://medipass.health',
    appIcon: 'https://medipass.health/logo.png',
  })
);

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
