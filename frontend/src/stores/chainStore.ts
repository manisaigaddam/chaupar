import { DEFAULT_CHAIN_ID, SupportedChainId, confluxEspaceTestnet } from '@/lib/contracts';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChainState {
    activeChainId: SupportedChainId;
    setActiveChain: (chainId: SupportedChainId) => void;
    getChainName: () => string;
    getNativeCurrency: () => string;
}

export const useChainStore = create<ChainState>()(
    persist(
        (set, get) => ({
            activeChainId: DEFAULT_CHAIN_ID,
            setActiveChain: (chainId) => set({ activeChainId: chainId }),
            getChainName: () => 'Conflux eSpace Testnet',
            getNativeCurrency: () => 'CFX',
        }),
        {
            name: 'chaupar-chain-preference',
            partialize: (state) => ({ activeChainId: state.activeChainId }),
        }
    )
);

export { confluxEspaceTestnet };
