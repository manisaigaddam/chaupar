'use client';

import { ERC20_ABI, confluxEspaceTestnet, getUsdtAddress } from '@/lib/contracts';
import { useChainStore } from '@/stores/chainStore';
import { formatTokenAmount } from '@/stores/gameStore';
import { usePrivy } from '@privy-io/react-auth';
import { AnimatePresence, motion } from 'framer-motion';
import { formatEther } from 'viem';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { Button } from './ui/button';

interface ProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

const shortenAddress = (address: string) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export function Profile({ isOpen, onClose }: ProfileProps) {
  const { user, logout } = usePrivy();
  const { address } = useAccount();
  const { activeChainId } = useChainStore();
  const usdtAddress = getUsdtAddress(activeChainId);

  const { data: cfxBalance } = useBalance({
    address,
    chainId: confluxEspaceTestnet.id
  });

  // USDT0 balance
  const { data: usdtBalanceRaw } = useReadContract({
    address: usdtAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: activeChainId,
  });

  const usdtBalance = usdtBalanceRaw ? formatTokenAmount(usdtBalanceRaw as bigint) : '0';

  const email = user?.email?.address;
  const displayName = email?.split('@')[0] || 'Anonymous';
  const avatarFallbackColor = getAvatarColor(email || address || 'user');

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-0 bottom-0 max-w-md mx-auto bg-zinc-900 border-t border-x border-zinc-800 rounded-t-2xl z-50 safe-area-bottom"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-4 pb-3 border-b border-zinc-800">
              <span className="font-bold text-white">Profile</span>
              <Button variant="ghost" size="sm" onClick={onClose} className="text-zinc-500 hover:text-white">
                ✕
              </Button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: avatarFallbackColor }}
                >
                  <span className="text-white">{displayName[0]?.toUpperCase()}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold truncate">{displayName}</div>
                  <div className="text-zinc-400 text-sm truncate">
                    {email || 'Connected'}
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
                <div className="text-zinc-500 text-xs uppercase tracking-wider">Wallet</div>

                <button
                  onClick={handleCopyAddress}
                  className="flex items-center gap-2 text-zinc-300 hover:text-white transition-colors"
                >
                  <span className="font-mono text-sm">{shortenAddress(address || '')}</span>
                  <span className="text-xs text-zinc-500">copy</span>
                </button>

                <div className="space-y-2 pt-2 border-t border-zinc-700">
                  {/* USDT0 Balance */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 text-sm">USDT0 (Betting)</span>
                    </div>
                    <span className="text-amber-400 font-mono font-bold text-sm">
                      {usdtBalance} USDT0
                    </span>
                  </div>
                  {/* CFX Balance */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-sm">CFX (Gas)</span>
                    </div>
                    <span className="text-white font-mono text-sm">
                      {cfxBalance ? parseFloat(formatEther(cfxBalance.value)).toFixed(4) : '0'} CFX
                    </span>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <span className="text-[10px] bg-white/10 text-white px-1.5 py-0.5 rounded">Conflux eSpace Testnet</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-800/50 rounded-xl p-3 space-y-2">
                <div className="text-zinc-500 text-xs uppercase tracking-wider">Faucets</div>
                <a
                  href="https://efaucet.confluxnetwork.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400/80 text-sm hover:text-amber-300 transition-colors block"
                >
                  Get testnet tokens (CFX + USDT0) →
                </a>
                <a
                  href={`https://evmtestnet.confluxscan.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 text-sm hover:text-white transition-colors block"
                >
                  View on ConfluxScan →
                </a>
              </div>

              <button
                onClick={logout}
                className="w-full py-2.5 px-4 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all font-medium text-sm"
              >
                Disconnect
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
