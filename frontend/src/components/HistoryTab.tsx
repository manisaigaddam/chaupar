'use client';

import { CardHistoryEntry } from '@/stores/gameStore';
import { motion } from 'framer-motion';

// Card rank conversion
const getRank = (value: number): string => {
  if (value === 14) return 'A';
  if (value === 13) return 'K';
  if (value === 12) return 'Q';
  if (value === 11) return 'J';
  return value.toString();
};

// Suit symbol
const getSuit = (suit: number): { symbol: string; color: string } => {
  const suits = [
    { symbol: '♠', color: 'text-white' },
    { symbol: '♥', color: 'text-red-500' },
    { symbol: '♦', color: 'text-red-500' },
    { symbol: '♣', color: 'text-white' },
  ];
  return suits[suit] || suits[0];
};

// Format multiplier from BPS to display string
const formatMultiplier = (bps: number): string => {
  return (bps / 10000).toFixed(2) + 'x';
};

// Arrow component showing prediction direction
function PredictionArrow({ 
  prediction, 
  result 
}: { 
  prediction?: 'higher' | 'lower' | 'skip';
  result?: 'win' | 'lose' | 'skip';
}) {
  // Color based on result
  const getColor = () => {
    if (!result) return 'text-zinc-500';
    if (result === 'win') return 'text-green-400';
    if (result === 'lose') return 'text-red-400';
    return 'text-zinc-400'; // skip
  };

  return (
    <div className={`flex items-center justify-center w-8 px-1 ${getColor()}`}>
      <svg
        viewBox="0 0 24 24"
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        {prediction === 'higher' ? (
          // Up arrow for higher
          <path d="M12 19V5M5 12L12 5L19 12" strokeLinecap="round" strokeLinejoin="round" />
        ) : prediction === 'lower' ? (
          // Down arrow for lower
          <path d="M12 5V19M5 12L12 19L19 12" strokeLinecap="round" strokeLinejoin="round" />
        ) : prediction === 'skip' ? (
          // Right arrow for skip
          <path d="M5 12H19M12 5L19 12L12 19" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          // Default connector line
          <path d="M5 12H19" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </div>
  );
}

// Mini card component for history
function MiniCard({ 
  entry, 
  isStart 
}: { 
  entry: CardHistoryEntry; 
  isStart?: boolean;
}) {
  const { symbol, color } = getSuit(entry.card.suit);
  const rank = getRank(entry.card.value);

  // Result colors for the multiplier badge
  const getResultStyle = () => {
    if (isStart) return 'bg-zinc-700 text-zinc-300';
    if (!entry.result) return 'bg-zinc-700 text-zinc-300';
    
    switch (entry.result) {
      case 'win': return 'bg-green-500/20 text-green-400';
      case 'lose': return 'bg-red-500/20 text-red-400';
      case 'skip': return 'bg-zinc-500/20 text-zinc-400';
      default: return 'bg-zinc-700 text-zinc-300';
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Card */}
      <motion.div
        className="w-10 h-14 bg-white rounded-md flex flex-col items-center justify-center shadow-sm border border-zinc-200"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <span className="text-black text-sm font-bold">{rank}</span>
        <span className={`text-xs ${color}`}>
          {symbol}
        </span>
      </motion.div>

      {/* Multiplier with result indicator */}
      <div className={`text-xs px-2 py-0.5 rounded-full ${getResultStyle()}`}>
        {isStart ? 'Start' : formatMultiplier(entry.accumulatedMultiplier)}
      </div>
    </div>
  );
}

interface HistoryTabProps {
  entries: CardHistoryEntry[];
  className?: string;
}

export function HistoryTab({ entries, className = '' }: HistoryTabProps) {
  if (entries.length === 0) return null;

  return (
    <div className={`w-full ${className}`}>
      <div className="text-zinc-500 text-xs mb-2">History</div>
      <div className="flex items-center gap-0 overflow-x-auto pb-2 scrollbar-hide">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-center">
            <MiniCard
              entry={entry}
              isStart={index === 0}
            />
            {/* Show arrow after each card except the last one */}
            {index < entries.length - 1 && (
              <PredictionArrow 
                prediction={entry.prediction} 
                result={entry.result}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
