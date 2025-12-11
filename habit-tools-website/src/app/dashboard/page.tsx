'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { HabitBoard } from '@/components/dashboard/HabitBoard'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Fetch dashboard data
  const { data: habitsData, error: habitsError } = useSWR(
    user ? '/api/dashboard/habits' : null,
    fetcher
  )

  const { data: statsData, error: statsError } = useSWR(
    user ? '/api/dashboard/stats' : null,
    fetcher
  )

  // Loading state
  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-[#48D2FF]"></div>
          <p className="text-white/60">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (habitsError || statsError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
        <div className="text-center">
          <p className="mb-4 text-2xl font-bold text-red-400">Error loading dashboard</p>
          <p className="text-white/60">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  const habits = habitsData?.habits || []
  const stats = statsData?.stats

  // Separate active and completed habits
  const activeHabits = habits.filter((h: any) => h.status === 'active')
  const completedHabits = habits.filter((h: any) => h.status === 'completed')

  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Dashboard Header */}
        <DashboardHeader user={user} stats={stats} />

        {/* Active Habits Section */}
        <div className="mb-12">
          <HabitBoard
            habits={activeHabits}
            title="Active Habits"
            emptyMessage="No active habits yet. Create your first habit in Discord!"
          />
        </div>

        {/* Completed Habits Section */}
        {completedHabits.length > 0 && (
          <div>
            <HabitBoard
              habits={completedHabits}
              title="Completed Habits"
              emptyMessage="No completed habits yet."
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-white/40">
            Built with HabitOS • Track your habits, build your future
          </p>
        </div>
      </div>
    </main>
  )
}
