'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

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

  const logoSizes = {
    sm: 20,
    md: 36,
    lg: 56,
    xl: 80,
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
          className="absolute -inset-4 rounded-3xl bg-amber-500/10 blur-xl"
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
        {/* Diamond pattern background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 100 140"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="card-diamonds" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M10 0L20 10L10 20L0 10Z"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100" height="140" fill="url(#card-diamonds)" />
        </svg>

        {/* Center logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/logo.png"
            alt="Chaupar"
            width={logoSizes[size]}
            height={logoSizes[size]}
            className="opacity-80 drop-shadow-lg"
          />
        </div>

        {/* Corner decorations — Ganjifa */}
        <div className="absolute top-2 left-2 text-[#D4AF37]/60 text-xs font-bold">❖</div>
        <div className="absolute bottom-2 right-2 text-[#D4AF37]/60 text-xs font-bold rotate-180">❖</div>

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
