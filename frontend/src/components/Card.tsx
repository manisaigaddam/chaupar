'use client';

import { DEVANAGARI_NUMERALS, GANJIFA_FACES, GANJIFA_SUITS, indexToSuit, type Card as CardType } from '@/stores/gameStore';
import { AnimatePresence, motion } from 'framer-motion';
import { PremiumCard } from './PremiumCard';

interface CardProps {
  card: CardType | null;
  isNew?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Premium SVG suit icons — Ganjifa style
const SuitIcon = ({ suit, size = 24, className = '' }: { suit: number; size?: number; className?: string }) => {
  const colors: Record<number, string> = {
    0: '#D4AF37', // Gold — Khadga (Sword)
    1: '#FF9933', // Saffron — Kalasha (Pot)
    2: '#6366F1', // Indigo — Chakra (Wheel)
    3: '#EC4899', // Rose — Padma (Lotus)
  };
  const color = colors[suit] || colors[0];

  switch (suit) {
    case 0: // Khadga — Sword
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <path d="M16 2L18 14L22 18L18 18L16 30L14 18L10 18L14 14L16 2Z" fill={color} />
          <path d="M12 22H20M14 24H18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="14" r="1.5" fill="white" fillOpacity="0.4" />
        </svg>
      );
    case 1: // Kalasha — Pot
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <path d="M11 28C11 28 10 24 10 20C10 16 12 14 12 14H20C20 14 22 16 22 20C22 24 21 28 21 28H11Z" fill={color} />
          <path d="M12 14C12 14 13 10 16 8C19 10 20 14 20 14" stroke={color} strokeWidth="1.5" />
          <ellipse cx="16" cy="6" rx="3" ry="2" fill={color} />
          <path d="M14 4C14 4 15 2 16 2C17 2 18 4 18 4" stroke={color} strokeWidth="1" strokeLinecap="round" />
          <ellipse cx="16" cy="20" rx="4" ry="5" fill="white" fillOpacity="0.15" />
        </svg>
      );
    case 2: // Chakra — Wheel
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="11" stroke={color} strokeWidth="2" />
          <circle cx="16" cy="16" r="4" fill={color} />
          <circle cx="16" cy="16" r="2" fill="white" fillOpacity="0.3" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="16" y1="16"
              x2={16 + 11 * Math.cos((angle * Math.PI) / 180)}
              y2={16 + 11 * Math.sin((angle * Math.PI) / 180)}
              stroke={color} strokeWidth="1.5"
            />
          ))}
        </svg>
      );
    case 3: // Padma — Lotus
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
          {/* Petals */}
          {[0, 60, 120, 180, 240, 300].map((angle) => (
            <ellipse
              key={angle}
              cx="16" cy="10"
              rx="4" ry="8"
              fill={color}
              fillOpacity="0.85"
              transform={`rotate(${angle} 16 16)`}
            />
          ))}
          <circle cx="16" cy="16" r="3.5" fill={color} />
          <circle cx="16" cy="16" r="2" fill="white" fillOpacity="0.3" />
        </svg>
      );
    default:
      return null;
  }
};

// Card sizes
const sizes = {
  sm: 'w-12 h-18 text-sm',
  md: 'w-20 h-28 text-xl',
  lg: 'w-28 h-40 text-3xl',
};

const premiumSizeMap = {
  sm: 'sm' as const,
  md: 'md' as const,
  lg: 'lg' as const,
};

// Icon sizes per card size
const iconSizes = { sm: 14, md: 20, lg: 28 };
const miniIconSizes = { sm: 8, md: 10, lg: 12 };

// Get display value for card
function getDisplayValue(value: number): { main: string; sub: string } {
  if (value >= 2 && value <= 10) {
    return { main: value.toString(), sub: DEVANAGARI_NUMERALS[value] || '' };
  }
  const face = GANJIFA_FACES[value];
  if (face) {
    // Show abbreviated English name + Hindi
    const shortNames: Record<number, string> = { 11: 'Si', 12: 'Ra', 13: 'Rj', 14: 'De' };
    return { main: shortNames[value] || face.name[0], sub: face.hindi };
  }
  return { main: value.toString(), sub: '' };
}

export function Card({ card, isNew = false, size = 'lg', className = '' }: CardProps) {
  if (!card || card.value === 0) {
    return <PremiumCard size={premiumSizeMap[size]} className={className} />;
  }

  const { main, sub } = getDisplayValue(card.value);
  const suitInfo = GANJIFA_SUITS[card.suit];
  const suitColors: Record<number, string> = {
    0: 'text-amber-500',    // Gold
    1: 'text-orange-400',   // Saffron
    2: 'text-indigo-400',   // Indigo
    3: 'text-pink-400',     // Rose
  };
  const textColor = suitColors[card.suit] || 'text-amber-500';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${card.value}-${card.suit}`}
        className={`${sizes[size]} rounded-xl bg-white border border-zinc-200
          flex flex-col items-center justify-center relative overflow-hidden shadow-lg ${className}`}
        initial={isNew ? { rotateY: 180, scale: 0.5 } : { scale: 1 }}
        animate={{ rotateY: 0, scale: 1 }}
        exit={{ rotateY: -180, scale: 0.5, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Subtle mandala-inspired background pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg viewBox="0 0 100 140" className="w-full h-full">
            <defs>
              <pattern id={`mandala-${card.suit}`} width="28" height="28" patternUnits="userSpaceOnUse">
                <circle cx="14" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="0.3" />
                <circle cx="14" cy="14" r="6" fill="none" stroke="currentColor" strokeWidth="0.3" />
                {[0, 60, 120, 180, 240, 300].map((a) => (
                  <line key={a} x1="14" y1="14"
                    x2={14 + 12 * Math.cos((a * Math.PI) / 180)}
                    y2={14 + 12 * Math.sin((a * Math.PI) / 180)}
                    stroke="currentColor" strokeWidth="0.2" />
                ))}
              </pattern>
            </defs>
            <rect width="100" height="140" fill={`url(#mandala-${card.suit})`} />
          </svg>
        </div>

        {/* Main rank + suit icon */}
        <div className="flex flex-col items-center z-10">
          <div className={`font-bold leading-none ${textColor}`} style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {main}
          </div>
          {sub && (
            <div className="text-[0.35em] text-zinc-400 leading-none mt-0.5">
              {sub}
            </div>
          )}
          <div className="mt-1">
            <SuitIcon suit={card.suit} size={iconSizes[size]} />
          </div>
        </div>

        {/* Top-left corner */}
        <div className={`absolute top-1.5 left-1.5 flex flex-col items-center ${textColor}`}>
          <span className="text-[0.35em] font-bold leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{main}</span>
          <SuitIcon suit={card.suit} size={miniIconSizes[size]} />
        </div>

        {/* Bottom-right corner (rotated) */}
        <div className={`absolute bottom-1.5 right-1.5 flex flex-col items-center rotate-180 ${textColor}`}>
          <span className="text-[0.35em] font-bold leading-tight" style={{ fontFamily: 'Cormorant Garamond, serif' }}>{main}</span>
          <SuitIcon suit={card.suit} size={miniIconSizes[size]} />
        </div>

        {/* Subtle edge glow */}
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-black/5" />
      </motion.div>
    </AnimatePresence>
  );
}
