'use client'

import { motion } from 'framer-motion'
import { ProgressRing } from './ProgressRing'
import { StreakCounter } from './StreakCounter'
import type { Habit, HabitProgress } from '@/types/dashboard'

interface HabitCardProps {
  habit: Habit
  progress: HabitProgress
}

export function HabitCard({ habit, progress }: HabitCardProps) {
  const domainColors: Record<string, string> = {
    Health: '#21D568',
    Mind: '#48D2FF',
    Career: '#FFB800',
    Productivity: '#FF4757',
    Relationships: '#9C27B0',
    Finance: '#4CAF50',
  }

  const primaryDomain = habit.domains[0] || 'Health'
  const domainColor = domainColors[primaryDomain] || '#48D2FF'

  return (
    <motion.div
      className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.05] to-white/[0.08] p-6 shadow-xl backdrop-blur-2xl transition-all duration-500 hover:border-white/25 hover:shadow-[0_12px_48px_rgba(72,210,255,0.15)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
    >
      {/* Domain Badge */}
      <div className="mb-4 flex items-center justify-between">
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `${domainColor}20`,
            color: domainColor,
          }}
        >
          {primaryDomain}
        </span>
        {habit.status === 'completed' && (
          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-400">
            Completed
          </span>
        )}
      </div>

      {/* Habit Name */}
      <h3 className="mb-2 text-xl font-bold text-white">{habit.name}</h3>

      {/* Minimal Dose */}
      {habit.minimalDose && (
        <p className="mb-4 text-sm text-white/60">Minimal: {habit.minimalDose}</p>
      )}

      {/* Progress Ring */}
      <div className="mb-4 flex items-center justify-center">
        <ProgressRing progress={progress.completionRate} />
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60">Weekly Progress</span>
          <span className="font-semibold text-white">
            {progress.weeklyCompleted}/{progress.weeklyTarget} days
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Current Streak</span>
          <StreakCounter streak={progress.currentStreak} size="sm" />
        </div>

        {progress.lastProofDate && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Last proof</span>
            <span className="text-white/40">
              {new Date(progress.lastProofDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Why (shown on hover) */}
      {habit.why && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center rounded-3xl bg-black/95 p-6 opacity-0 backdrop-blur-xl transition-opacity duration-300 group-hover:opacity-100"
        >
          <div className="text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
              Your Why
            </p>
            <p className="text-sm text-white/90">{habit.why}</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
