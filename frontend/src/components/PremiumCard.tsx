'use client';

import { motion } from 'framer-motion';

interface PremiumCardProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glowing?: boolean;
  className?: string;
  onClick?: () => void;
}

export function PremiumCard({ 
  size = 'lg', 
  glowing = false, 
  className = '',
  onClick
}: PremiumCardProps) {
  const sizeClasses = {
    sm: 'w-12 h-16',
    md: 'w-20 h-28',
    lg: 'w-32 h-44',
    xl: 'w-48 h-64',
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      layout
      layoutId="premium-card"
    >
      {/* Glow effect */}
      {glowing && (
        <motion.div
          className="absolute -inset-4 rounded-3xl bg-white/10 blur-xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}

      {/* Card body */}
      <div className="relative w-full h-full rounded-xl overflow-hidden border border-zinc-700 bg-zinc-900 shadow-2xl">
        {/* Geometric pattern */}
        <svg
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 100 140"
          preserveAspectRatio="none"
        >
          {/* Diamond pattern */}
          <defs>
            <pattern id="diamonds" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M10 0L20 10L10 20L0 10Z"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="140" fill="url(#diamonds)" />
          
          {/* Center emblem */}
          <g transform="translate(50, 70)">
            <circle r="25" fill="none" stroke="white" strokeWidth="1" />
            <circle r="18" fill="none" stroke="white" strokeWidth="0.5" />
            {/* Spade symbol */}
            <path
              d="M0 -12 C-8 -4 -10 4 -6 8 C-4 10 -2 10 0 8 L0 12 L0 8 C2 10 4 10 6 8 C10 4 8 -4 0 -12Z"
              fill="white"
              fillOpacity="0.8"
            />
          </g>
        </svg>

        {/* Corner decorations */}
        <div className="absolute top-2 left-2 text-white/60 text-xs font-bold">♠</div>
        <div className="absolute bottom-2 right-2 text-white/60 text-xs font-bold rotate-180">♠</div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/20" />
        
        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '200%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: 'easeInOut',
          }}
        />
      </div>
    </motion.div>
  );
}
