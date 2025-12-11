export interface Habit {
  id: string
  name: string
  userId: string
  domains: string[]
  frequency: number
  context: string
  difficulty: string
  smartGoal: string
  why: string
  minimalDose: string
  status: 'active' | 'completed' | 'paused'
  createdAt: string
}

export interface Proof {
  id: string
  habitId: string
  userId: string
  date: string
  unit: string
  note?: string
  attachmentUrl?: string
  isMinimalDose: boolean
  isCheatDay: boolean
}

export interface DashboardStats {
  totalHabits: number
  activeHabits: number
  completedHabits: number
  currentStreak: number
  weeklyScore: number
  totalProofs: number
}

export interface HabitProgress {
  habitId: string
  weeklyTarget: number
  weeklyCompleted: number
  currentStreak: number
  lastProofDate: string | null
  completionRate: number
}
