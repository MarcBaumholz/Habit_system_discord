'use client'

import { HabitCard } from './HabitCard'
import type { Habit, HabitProgress } from '@/types/dashboard'

interface HabitWithProgress extends Habit {
  progress: HabitProgress
}

interface HabitBoardProps {
  habits: HabitWithProgress[]
  title?: string
  emptyMessage?: string
}

export function HabitBoard({
  habits,
  title = 'Your Habits',
  emptyMessage = 'No habits found. Start building your first habit!',
}: HabitBoardProps) {
  if (habits.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-12 text-center">
        <p className="text-white/60">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-6 text-3xl font-bold text-white">{title}</h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {habits.map((habit) => (
          <HabitCard key={habit.id} habit={habit} progress={habit.progress} />
        ))}
      </div>
    </div>
  )
}
