'use client';

import { CardHistoryEntry, GANJIFA_FACES } from '@/stores/gameStore';
import { motion } from 'framer-motion';

// Get display rank
const getRank = (value: number): string => {
  if (value >= 2 && value <= 10) return value.toString();
  const face = GANJIFA_FACES[value];
  if (face) {
    const shortNames: Record<number, string> = { 11: 'Si', 12: 'Ra', 13: 'Rj', 14: 'De' };
    return shortNames[value] || face.name[0];
  }
  return value.toString();
};

// Suit colors
const getSuitColor = (suit: number): string => {
  const colors: Record<number, string> = {
    0: '#D4AF37', // Gold
    1: '#FF9933', // Saffron
    2: '#6366F1', // Indigo
    3: '#EC4899', // Rose
  };
  return colors[suit] || colors[0];
};

// Mini suit icon for history
const MiniSuitIcon = ({ suit, size = 10 }: { suit: number; size?: number }) => {
  const color = getSuitColor(suit);
  switch (suit) {
    case 0: return <svg width={size} height={size} viewBox="0 0 16 16"><path d="M8 1L9 7L11 9L9 9L8 15L7 9L5 9L7 7L8 1Z" fill={color} /><path d="M6 11H10" stroke={color} strokeWidth="1" /></svg>;
    case 1: return <svg width={size} height={size} viewBox="0 0 16 16"><path d="M5.5 14C5.5 14 5 12 5 10C5 8 6 7 6 7H10C10 7 11 8 11 10C11 12 10.5 14 10.5 14H5.5Z" fill={color} /><ellipse cx="8" cy="4" rx="2" ry="1.5" fill={color} /></svg>;
    case 2: return <svg width={size} height={size} viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" stroke={color} strokeWidth="1.5" fill="none" /><circle cx="8" cy="8" r="2" fill={color} /></svg>;
    case 3: return <svg width={size} height={size} viewBox="0 0 16 16">{[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="8" cy="4" rx="2" ry="4" fill={color} fillOpacity="0.8" transform={`rotate(${a} 8 8)`} />)}<circle cx="8" cy="8" r="1.5" fill={color} /></svg>;
    default: return null;
  }
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
  const getColor = () => {
    if (!result) return 'text-zinc-500';
    if (result === 'win') return 'text-green-400';
    if (result === 'lose') return 'text-red-400';
    return 'text-zinc-400';
  };

  return (
    <div className={`flex items-center justify-center w-8 px-1 ${getColor()}`}>
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
        {prediction === 'higher' ? (
          <path d="M12 19V5M5 12L12 5L19 12" strokeLinecap="round" strokeLinejoin="round" />
        ) : prediction === 'lower' ? (
          <path d="M12 5V19M5 12L12 19L19 12" strokeLinecap="round" strokeLinejoin="round" />
        ) : prediction === 'skip' ? (
          <path d="M5 12H19M12 5L19 12L12 19" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M5 12H19" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </div>
  );
}

// Mini card component
function MiniCard({
  entry,
  isStart
}: {
  entry: CardHistoryEntry;
  isStart?: boolean;
}) {
  const rank = getRank(entry.card.value);
  const suitColor = getSuitColor(entry.card.suit);

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
      <motion.div
        className="w-10 h-14 bg-white rounded-md flex flex-col items-center justify-center shadow-sm border border-zinc-200"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <span className="text-sm font-bold" style={{ color: suitColor, fontFamily: 'Cormorant Garamond, serif' }}>{rank}</span>
        <MiniSuitIcon suit={entry.card.suit} size={12} />
      </motion.div>
      <div className={`text-xs px-2 py-0.5 rounded-full ${getResultStyle()}`}>
        {isStart ? 'शुरू' : formatMultiplier(entry.accumulatedMultiplier)}
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
      <div className="text-zinc-500 text-xs mb-2">इतिहास / History</div>
      <div className="flex items-center gap-0 overflow-x-auto pb-2 scrollbar-hide">
        {entries.map((entry, index) => (
          <div key={index} className="flex items-center">
            <MiniCard entry={entry} isStart={index === 0} />
            {index < entries.length - 1 && (
              <PredictionArrow prediction={entry.prediction} result={entry.result} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
