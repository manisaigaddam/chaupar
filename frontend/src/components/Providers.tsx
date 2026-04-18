'use client';

/**
 * Providers - Chaupar Game on Conflux eSpace Testnet
 *
 * Features:
 * - Email-only login via Privy
 * - Conflux eSpace Testnet
 * - Embedded wallet auto-creation
 */

import { HTTP_URLS, confluxEspaceTestnet } from '@/lib/contracts';
import { PrivyProvider } from '@privy-io/react-auth';
import { createConfig, WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';

const wagmiConfig = createConfig({
  chains: [confluxEspaceTestnet],
  transports: {
    [confluxEspaceTestnet.id]: http(HTTP_URLS[confluxEspaceTestnet.id]),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'cmjf6vwpx00izjm0c134vmtod'}
      config={{
        loginMethods: ['email'],
        appearance: {
          theme: 'dark',
          accentColor: '#FFFFFF',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
          showWalletUIs: false,
        },
        supportedChains: [confluxEspaceTestnet],
        defaultChain: confluxEspaceTestnet,
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
