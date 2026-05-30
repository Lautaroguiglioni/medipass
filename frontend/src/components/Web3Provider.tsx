'use client';

import React, { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider } from 'connectkit';
import { config } from '@/config/monad';

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          customTheme={{
            '--ck-font-family': 'Outfit, Inter, system-ui, sans-serif',
            '--ck-accent-color': '#8A2BE2', // Monad purple color
            '--ck-accent-text-color': '#ffffff',
            '--ck-connectbutton-background': '#8A2BE2',
            '--ck-connectbutton-hover-background': '#6A1B9A',
            '--ck-connectbutton-border-radius': '9999px',
            '--ck-connectbutton-font-size': '0.875rem',
            '--ck-connectbutton-font-weight': '600',
            '--ck-connectbutton-box-shadow': '0 4px 12px rgba(138, 43, 226, 0.15)',
            '--ck-connectbutton-hover-box-shadow': '0 6px 16px rgba(138, 43, 226, 0.25)',
            '--ck-connectbutton-active-transform': 'scale(0.97)',
            '--ck-connectbutton-color': '#ffffff',
            '--ck-border-radius': '16px',
            '--ck-body-background': '#ffffff',
            '--ck-body-background-secondary': '#f8fafc',
            '--ck-body-color': '#0f172a',
            '--ck-body-color-muted': '#64748b',
          }}
          options={{
            embedMode: false,
            initialChainId: 10143,
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
