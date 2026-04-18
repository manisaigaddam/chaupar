'use client';

import { indexToSuit, valueToRank, type Card as CardType } from '@/stores/gameStore';
import { AnimatePresence, motion } from 'framer-motion';
import { PremiumCard } from './PremiumCard';

interface CardProps {
  card: CardType | null;
  isNew?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Card suits with colors - minimal black/white with red for hearts/diamonds
const suitSymbols = {
  spades: { symbol: '♠', color: 'text-black' },
  hearts: { symbol: '♥', color: 'text-red-500' },
  diamonds: { symbol: '♦', color: 'text-red-500' },
  clubs: { symbol: '♣', color: 'text-black' },
};

// Card sizes
const sizes = {
  sm: 'w-12 h-18 text-sm',
  md: 'w-20 h-28 text-xl',
  lg: 'w-28 h-40 text-3xl',
};

// Map size to PremiumCard size
const premiumSizeMap = {
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
};

export function Card({ card, isNew = false, size = 'lg', className = '' }: CardProps) {
  if (!card || card.value === 0) {
    // Hidden/empty card - use PremiumCard
    return <PremiumCard size={premiumSizeMap[size]} className={className} />;
  }

  const rank = valueToRank(card.value);
  const suit = indexToSuit(card.suit);
  const { symbol, color } = suitSymbols[suit];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${card.value}-${card.suit}`}
        className={`${sizes[size]} rounded-xl bg-white border border-zinc-200
          flex flex-col items-center justify-center relative overflow-hidden ${className}`}
        initial={isNew ? { rotateY: 180, scale: 0.5 } : { scale: 1 }}
        animate={{ rotateY: 0, scale: 1 }}
        exit={{ rotateY: -180, scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Main rank and suit */}
        <div className={`font-bold ${color}`}>
          <div className="text-center leading-none">{rank}</div>
          <div className="text-center leading-none mt-0.5 text-[0.6em]">{symbol}</div>
        </div>
        
        {/* Top-left corner */}
        <div className={`absolute top-1.5 left-1.5 text-[0.4em] font-bold ${color} leading-tight`}>
          <div>{rank}</div>
          <div>{symbol}</div>
        </div>
        
        {/* Bottom-right corner (rotated) */}
        <div className={`absolute bottom-1.5 right-1.5 text-[0.4em] font-bold ${color} 
          leading-tight rotate-180`}>
          <div>{rank}</div>
          <div>{symbol}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Comparison arrows - minimal black/white style
interface ComparisonArrowProps {
  direction: 'higher' | 'lower';
  multiplier: number;
  probability: number;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function ComparisonArrow({ 
  direction, 
  multiplier, 
  probability,
  onClick, 
  disabled = false,
  isLoading = false 
}: ComparisonArrowProps) {
  const isHigher = direction === 'higher';
  const formattedMultiplier = (multiplier / 10000).toFixed(2);
  
  return (
    <motion.button
      className={`flex flex-col items-center justify-center p-4 rounded-xl min-w-[100px]
        border transition-all relative
        ${disabled 
          ? 'border-zinc-800 bg-zinc-900/50 text-zinc-600 cursor-not-allowed' 
          : 'border-zinc-700 bg-zinc-900 text-white hover:border-zinc-500 hover:bg-zinc-800'
        }`}
      onClick={onClick}
      disabled={disabled || isLoading || multiplier === 0}
      whileHover={!disabled && !isLoading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : {}}
    >
      {/* Arrow icon */}
      <motion.div
        className="text-2xl mb-1"
        animate={!disabled ? { y: isHigher ? -2 : 2 } : {}}
        transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.6 }}
      >
        {isHigher ? '↑' : '↓'}
      </motion.div>
      
      {/* Label */}
      <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
        {isHigher ? 'Higher' : 'Lower'}
      </div>
      
      {/* Multiplier */}
      {multiplier > 0 && (
        <div className="text-lg font-bold mt-1">
          {formattedMultiplier}x
        </div>
      )}
      
      {/* Probability */}
      {probability > 0 && (
        <div className="text-[10px] text-zinc-500 mt-0.5">
          {probability.toFixed(0)}%
        </div>
      )}
      
      {/* Loading spinner */}
      {isLoading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
    </motion.button>
  );
}
