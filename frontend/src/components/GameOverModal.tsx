'use client';

import { formatTokenAmount } from '@/stores/gameStore';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';

interface GameOverModalProps {
  isOpen: boolean;
  endReason: 'cashout' | 'wrong_prediction' | 'timeout' | null;
  betAmount: bigint | number;
  winAmount: bigint | number;
  multiplier: number; // BPS
  rounds: number;
  onNewGame: () => void;
}

const configs = {
  cashout: {
    icon: '🎉',
    title: 'घर ले गए! Cashed Out!',
    titleColor: 'text-green-400',
    bgGlow: 'from-green-500/10',
    showConfetti: true,
  },
  wrong_prediction: {
    icon: '💔',
    title: 'गिर गए! Crashed!',
    titleColor: 'text-red-400',
    bgGlow: 'from-red-500/10',
    showConfetti: false,
  },
  timeout: {
    icon: '⏰',
    title: 'समय समाप्त! Timed Out',
    titleColor: 'text-amber-400',
    bgGlow: 'from-amber-500/10',
    showConfetti: false,
  },
};

export function GameOverModal({
  isOpen,
  endReason,
  betAmount,
  winAmount,
  multiplier,
  rounds,
  onNewGame,
}: GameOverModalProps) {
  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => onNewGame(), 8000);
    return () => clearTimeout(timer);
  }, [isOpen, onNewGame]);

  if (!isOpen || !endReason) return null;

  const config = configs[endReason];
  const isWin = endReason === 'cashout' || endReason === 'timeout';
  const formattedBet = formatTokenAmount(betAmount);
  const formattedWin = formatTokenAmount(winAmount);
  const formatMult = (bps: number) => (bps / 10000).toFixed(2);
  const profit = isWin ? (Number(formattedWin) - Number(formattedBet)).toFixed(2) : '0';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Confetti particles for cashout */}
          {config.showConfetti && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#D4AF37', '#FF9933', '#6366F1', '#EC4899', '#10B981'][i % 5],
                    left: `${Math.random() * 100}%`,
                    top: '-5%',
                  }}
                  animate={{
                    y: ['0vh', '110vh'],
                    x: [0, (Math.random() - 0.5) * 200],
                    rotate: [0, Math.random() * 720],
                    opacity: [1, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: Math.random() * 0.5,
                    ease: 'easeIn',
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            className={`bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4 relative overflow-hidden`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Glow background */}
            <div className={`absolute inset-0 bg-gradient-to-b ${config.bgGlow} to-transparent opacity-50`} />

            <div className="relative z-10">
              {/* Icon + Title */}
              <div className="text-center mb-5">
                <motion.div
                  className="text-5xl mb-3"
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  {config.icon}
                </motion.div>
                <h2 className={`text-xl font-bold ${config.titleColor}`}>
                  {config.title}
                </h2>
              </div>

              {/* Stats */}
              <div className="bg-zinc-800/60 rounded-xl p-4 space-y-2.5 mb-5">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">दाव / Bet</span>
                  <span className="text-white font-medium">{formattedBet} USDT0</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">हाथ / Rounds</span>
                  <span className="text-white font-medium">{rounds}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">गुणा / Multiplier</span>
                  <span className="text-white font-medium">{formatMult(multiplier)}x</span>
                </div>
                <div className="h-px bg-zinc-700 my-1" />
                {isWin ? (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">जीत / Won</span>
                      <span className="text-green-400 font-bold text-base">{formattedWin} USDT0</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-600">Profit</span>
                      <span className="text-green-400/80">+{profit} USDT0</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">हार / Lost</span>
                    <span className="text-red-400 font-bold text-base">-{formattedBet} USDT0</span>
                  </div>
                )}
              </div>

              {/* New Game Button */}
              <motion.button
                className="w-full bg-white text-black font-bold py-3 px-6 rounded-xl
                  hover:bg-zinc-200 transition-colors"
                onClick={onNewGame}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                नया खेल / New Game
              </motion.button>

              {/* Auto dismiss hint */}
              <p className="text-center text-zinc-600 text-xs mt-3">
                Auto-closing in a few seconds...
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
