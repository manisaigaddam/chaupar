'use client';

import { AnimatePresence, motion } from 'framer-motion';

// 4 popup types with distinct messaging
export type PopupType =
  | 'resume_exit'       // Active round, no timeout - on mount
  | 'timeout_mount'     // Round timed out - on mount
  | 'exit_x_click'      // User clicked X while in active game
  | 'timeout_operation'; // Timeout during prediction/operation

interface ActiveRoundPopupProps {
  isOpen: boolean;
  popupType: PopupType;
  potentialWin: string;
  roundNumber: number;
  currentMultiplier: number;
  currencySymbol?: string;
  onResume: () => void;
  onExit: () => void;
  onCancel?: () => void;
  isExiting?: boolean;
}

// Popup configuration based on type — uses dynamic currency
const getPopupConfig = (symbol: string) => ({
  resume_exit: {
    icon: '🎴',
    title: 'चालू खेल मिला / Active Round Found',
    message: 'You have an active round. Resume or collect your winnings.',
    showResume: true,
    showCancel: false,
    exitText: (win: string) => `Collect (${win} ${symbol})`,
    exitingText: 'Collecting...',
    footerText: 'You can only have one active round at a time.',
  },
  timeout_mount: {
    icon: '⏰',
    title: 'समय समाप्त / Round Timed Out',
    message: 'Your round has timed out. Collect your winnings to start a new game.',
    showResume: false,
    showCancel: false,
    exitText: (win: string) => `Collect ${win} ${symbol}`,
    exitingText: 'Collecting...',
    footerText: 'Timeout occurs after 10 minutes of inactivity.',
  },
  exit_x_click: {
    icon: '🚪',
    title: 'खेल छोड़ें? / Exit Game?',
    message: 'Are you sure? You will cash out your current winnings.',
    showResume: false,
    showCancel: true,
    exitText: (win: string) => `Exit & Collect ${win} ${symbol}`,
    exitingText: 'Exiting...',
    footerText: 'You can start a new game after exiting.',
  },
  timeout_operation: {
    icon: '⏰',
    title: 'समय समाप्त / Round Timed Out',
    message: 'Your round has timed out. Collect your winnings to continue.',
    showResume: false,
    showCancel: false,
    exitText: (win: string) => `Collect ${win} ${symbol}`,
    exitingText: 'Collecting...',
    footerText: 'Timeout occurs after 10 minutes of inactivity.',
  },
});

export function ActiveRoundPopup({
  isOpen,
  popupType,
  potentialWin,
  roundNumber,
  currentMultiplier,
  currencySymbol = 'USDT0',
  onResume,
  onExit,
  onCancel,
  isExiting = false,
}: ActiveRoundPopupProps) {
  if (!isOpen) return null;

  const configs = getPopupConfig(currencySymbol);
  const config = configs[popupType];
  const formatMultiplier = (bps: number) => (bps / 10000).toFixed(2);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">
                {config.icon}
              </div>
              <h2 className="text-xl font-bold text-white">
                {config.title}
              </h2>
              <p className="text-zinc-400 text-sm mt-2">
                {config.message}
              </p>
            </div>

            {/* Round Info */}
            <div className="bg-zinc-800/50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">हाथ / Round</span>
                <span className="text-white font-medium">#{roundNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">गुणा / Multiplier</span>
                <span className="text-white font-medium">{formatMultiplier(currentMultiplier)}x</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">जीत / Potential Win</span>
                <span className="text-amber-400 font-bold">{potentialWin} {currencySymbol}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {config.showResume && (
                <motion.button
                  className="w-full bg-white text-black font-bold py-3 px-6 rounded-xl
                    hover:bg-zinc-200 transition-colors disabled:opacity-50"
                  onClick={onResume}
                  disabled={isExiting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  खेल जारी रखें / Resume Game
                </motion.button>
              )}

              <motion.button
                className={`w-full font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50
                  ${config.showResume || config.showCancel
                    ? 'border border-zinc-600 text-zinc-300 hover:border-zinc-500 hover:text-white'
                    : 'bg-white text-black hover:bg-zinc-200'
                  }`}
                onClick={onExit}
                disabled={isExiting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isExiting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {config.exitingText}
                  </span>
                ) : (
                  config.exitText(potentialWin)
                )}
              </motion.button>

              {config.showCancel && onCancel && (
                <motion.button
                  className="w-full text-zinc-500 font-medium py-2 px-6 rounded-xl
                    hover:text-zinc-300 transition-colors disabled:opacity-50"
                  onClick={onCancel}
                  disabled={isExiting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  रद्द करें / Cancel
                </motion.button>
              )}
            </div>

            {/* Info text */}
            <p className="text-center text-zinc-600 text-xs mt-4">
              {config.footerText}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
