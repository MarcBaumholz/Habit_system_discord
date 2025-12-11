import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUserHabits, getHabitProgress } from '@/lib/notion-dashboard'

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user habits from Notion
    const habits = await getUserHabits(payload.userId)

    // Get progress for each habit
    const habitsWithProgress = await Promise.all(
      habits.map(async (habit) => {
        const progress = await getHabitProgress(habit.id, habit.frequency)
        return {
          ...habit,
          progress,
        }
      })
    )

    return NextResponse.json({ habits: habitsWithProgress })
  } catch (error) {
    console.error('Error fetching habits:', error)
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 })
  }
}
