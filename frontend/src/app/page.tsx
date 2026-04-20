'use client';

import { ERC20_ABI, getUsdtAddress } from '@/lib/contracts';
import { PremiumCard } from '@/components/PremiumCard';
import { Profile } from '@/components/Profile';
import { Button } from '@/components/ui/button';
import { useChainStore } from '@/stores/chainStore';
import { formatTokenAmount } from '@/stores/gameStore';
import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { formatEther } from 'viem';
import { useAccount, useBalance, useReadContract } from 'wagmi';

function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
}

export default function HomePage() {
  const { login, authenticated, ready, user } = usePrivy();
  const { address, isConnected } = useAccount();
  const { activeChainId } = useChainStore();
  const { data: cfxBalance } = useBalance({ address, chainId: activeChainId });
  const usdtAddress = getUsdtAddress(activeChainId);
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);

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
  const avatarFallbackColor = getAvatarColor(email || address || 'user');
  const displayInitial = (email?.[0] || 'U').toUpperCase();

  const handleStartClick = () => {
    if (!authenticated || !isConnected) {
      login();
      return;
    }
    router.push('/game');
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between p-4 z-10">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>चौपड़</span>
          <span className="text-xl font-bold tracking-tight">Chaupar</span>
          <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">Conflux</span>
        </div>

        <div>
          {authenticated && isConnected ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-zinc-900/80 rounded-lg px-3 py-1.5 border border-zinc-800">
                <span className="text-amber-400 text-sm font-medium">
                  {usdtBalance} <span className="text-[10px] text-amber-400/70">USDT0</span>
                </span>
                <div className="w-px h-3 bg-zinc-700" />
                <span className="text-zinc-500 text-xs">
                  {cfxBalance ? parseFloat(formatEther(cfxBalance.value)).toFixed(2) : '0'} CFX
                </span>
              </div>
              <button
                onClick={() => setShowProfile(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold overflow-hidden border-2 border-zinc-700 hover:border-zinc-500 transition-colors"
                style={{ backgroundColor: avatarFallbackColor }}
              >
                <span className="text-white">{displayInitial}</span>
              </button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => login()}
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              Connect
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <PremiumCard size="xl" glowing={authenticated} />
        </motion.div>

        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold mb-1" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            चौपड़ — Chaupar
          </h1>
          <p className="text-zinc-400 text-sm">Predict the next card. 96% RTP. Pure On-Chain. USDT0 Bets.</p>
        </motion.div>

        <motion.div
          className="flex gap-3 text-xs flex-wrap justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2 text-center">
            <div className="text-white font-bold">96%</div>
            <div className="text-zinc-500">RTP</div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2 text-center">
            <div className="text-amber-400 font-bold">USDT0</div>
            <div className="text-zinc-500">Bet Token</div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2 text-center">
            <div className="text-white font-bold">On-Chain</div>
            <div className="text-zinc-500">Every TX</div>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg px-4 py-2 text-center">
            <div className="text-green-400 font-bold">House Pool</div>
            <div className="text-zinc-500">Earn Yield</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            size="lg"
            onClick={handleStartClick}
            className="bg-white text-black hover:bg-zinc-200 font-bold px-12 py-6 text-lg rounded-xl"
          >
            {authenticated ? 'शुरू करो / Start Game' : 'Connect to Play'}
          </Button>
        </motion.div>

        {!authenticated && (
          <motion.p
            className="text-zinc-600 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Email login — Auto wallet created
          </motion.p>
        )}
      </main>

      <Profile
        isOpen={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}
