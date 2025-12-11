'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { LogOut, User } from 'lucide-react'
import type { User as UserType } from '@/types/auth'
import type { DashboardStats } from '@/types/dashboard'

interface DashboardHeaderProps {
  user: UserType
  stats?: DashboardStats
}

export function DashboardHeader({ user, stats }: DashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <div className="mb-12">
      {/* Top Bar */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#48D2FF] to-[#5B4BFF]">
            <User size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
            <p className="text-sm text-white/60">{user.email}</p>
          </div>
        </div>

        <Button variant="ghost" onClick={handleLogout}>
          <LogOut size={16} className="mr-2" />
          Logout
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Total Habits" value={stats.totalHabits} />
          <StatCard label="Active" value={stats.activeHabits} color="#21D568" />
          <StatCard label="Completed" value={stats.completedHabits} color="#48D2FF" />
          <StatCard label="Current Streak" value={stats.currentStreak} color="#FFB800" suffix=" days" />
          <StatCard label="Weekly Score" value={stats.weeklyScore} color="#9C27B0" suffix="%" />
          <StatCard label="Total Proofs" value={stats.totalProofs} />
        </div>
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  color?: string
  suffix?: string
}

function StatCard({ label, value, color = '#FFFFFF', suffix = '' }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-4 backdrop-blur-xl">
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-white/60">{label}</p>
      <p className="text-2xl font-bold" style={{ color }}>
        {value}{suffix}
      </p>
    </div>
  )
}
