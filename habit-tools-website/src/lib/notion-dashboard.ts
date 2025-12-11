import { Client } from '@notionhq/client'
import type { Habit, Proof, DashboardStats, HabitProgress } from '@/types/dashboard'

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
})

const HABITS_DB = process.env.NOTION_DATABASE_HABITS || ''
const PROOFS_DB = process.env.NOTION_DATABASE_PROOFS || ''
const USERS_DB = process.env.NOTION_DATABASE_USERS || ''

/**
 * Find Notion user by email
 */
export async function findNotionUserByEmail(email: string): Promise<string | null> {
  try {
    const response = await notion.databases.query({
      database_id: USERS_DB,
      filter: {
        property: 'DiscordID',
        rich_text: {
          contains: email,
        },
      },
    })

    if (response.results.length > 0) {
      return response.results[0].id
    }

    return null
  } catch (error) {
    console.error('Error finding Notion user:', error)
    return null
  }
}

/**
 * Get all habits for a user
 */
export async function getUserHabits(userId: string): Promise<Habit[]> {
  try {
    // First find the Notion user page
    const notionUserId = await findNotionUserByEmail(userId)

    if (!notionUserId) {
      return []
    }

    const response = await notion.databases.query({
      database_id: HABITS_DB,
      filter: {
        property: 'User',
        relation: {
          contains: notionUserId,
        },
      },
    })

    return response.results.map((page: any) => ({
      id: page.id,
      name: page.properties.Name?.title?.[0]?.plain_text || 'Untitled',
      userId,
      domains: page.properties.Domains?.multi_select?.map((d: any) => d.name) || [],
      frequency: page.properties.Frequency?.number || 7,
      context: page.properties.Context?.rich_text?.[0]?.plain_text || '',
      difficulty: page.properties.Difficulty?.select?.name || 'Medium',
      smartGoal: page.properties['SMART Goal ']?.rich_text?.[0]?.plain_text || '',
      why: page.properties.Why?.rich_text?.[0]?.plain_text || '',
      minimalDose: page.properties['Minimal Dose']?.rich_text?.[0]?.plain_text || '',
      status: 'active', // Default to active for now
      createdAt: page.created_time,
    }))
  } catch (error) {
    console.error('Error fetching user habits:', error)
    return []
  }
}

/**
 * Get proofs for a specific habit
 */
export async function getHabitProofs(habitId: string): Promise<Proof[]> {
  try {
    const response = await notion.databases.query({
      database_id: PROOFS_DB,
      filter: {
        property: 'Habit',
        relation: {
          contains: habitId,
        },
      },
      sorts: [
        {
          property: 'Date',
          direction: 'descending',
        },
      ],
    })

    return response.results.map((page: any) => ({
      id: page.id,
      habitId,
      userId: '', // Will be filled in if needed
      date: page.properties.Date?.date?.start || new Date().toISOString(),
      unit: page.properties.Unit?.rich_text?.[0]?.plain_text || '',
      note: page.properties.Note?.rich_text?.[0]?.plain_text,
      attachmentUrl: page.properties['Attachment URL']?.url,
      isMinimalDose: page.properties['Is Minimal Dose']?.checkbox || false,
      isCheatDay: page.properties['Is Cheat Day']?.checkbox || false,
    }))
  } catch (error) {
    console.error('Error fetching habit proofs:', error)
    return []
  }
}

/**
 * Calculate habit progress
 */
export async function getHabitProgress(habitId: string, frequency: number): Promise<HabitProgress> {
  const proofs = await getHabitProofs(habitId)

  // Calculate weekly completion (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const weeklyProofs = proofs.filter(
    (p) => new Date(p.date) >= weekAgo && !p.isCheatDay
  )

  // Calculate current streak
  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sortedProofs = [...proofs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  for (const proof of sortedProofs) {
    const proofDate = new Date(proof.date)
    proofDate.setHours(0, 0, 0, 0)

    const daysDiff = Math.floor((today.getTime() - proofDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysDiff === currentStreak) {
      currentStreak++
    } else {
      break
    }
  }

  // Last proof date
  const lastProofDate = sortedProofs.length > 0 ? sortedProofs[0].date : null

  // Completion rate
  const completionRate = frequency > 0 ? (weeklyProofs.length / frequency) * 100 : 0

  return {
    habitId,
    weeklyTarget: frequency,
    weeklyCompleted: weeklyProofs.length,
    currentStreak,
    lastProofDate,
    completionRate: Math.min(100, completionRate),
  }
}

/**
 * Get dashboard statistics for a user
 */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const habits = await getUserHabits(userId)

  const activeHabits = habits.filter((h) => h.status === 'active')
  const completedHabits = habits.filter((h) => h.status === 'completed')

  // Calculate current streak (max streak among all habits)
  let maxStreak = 0
  for (const habit of activeHabits) {
    const progress = await getHabitProgress(habit.id, habit.frequency)
    if (progress.currentStreak > maxStreak) {
      maxStreak = progress.currentStreak
    }
  }

  // Total proofs (estimate)
  let totalProofs = 0
  for (const habit of habits) {
    const proofs = await getHabitProofs(habit.id)
    totalProofs += proofs.length
  }

  return {
    totalHabits: habits.length,
    activeHabits: activeHabits.length,
    completedHabits: completedHabits.length,
    currentStreak: maxStreak,
    weeklyScore: 85, // Mock for now
    totalProofs,
  }
}
