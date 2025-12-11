'use client'

import { Flame } from 'lucide-react'
import { motion } from 'framer-motion'

interface StreakCounterProps {
  streak: number
  size?: 'sm' | 'md' | 'lg'
}

export function StreakCounter({ streak, size = 'md' }: StreakCounterProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  const iconSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  }

  return (
    <motion.div
      className="flex items-center gap-1"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      <Flame
        size={iconSizes[size]}
        className="text-[#48D2FF]"
        fill="#48D2FF"
      />
      <span className={`font-bold text-[#48D2FF] ${sizeClasses[size]}`}>
        {streak}
      </span>
    </motion.div>
  )
}
