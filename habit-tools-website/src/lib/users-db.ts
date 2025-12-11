/**
 * Simple user database using JSON file storage
 * In production, you would use a proper database
 */

import { promises as fs } from 'fs'
import path from 'path'
import type { User } from '@/types/auth'

const DB_FILE = path.join(process.cwd(), 'data', 'users.json')

interface UserRecord extends User {
  passwordHash: string
}

/**
 * Ensure the data directory and file exist
 */
async function ensureDbFile(): Promise<void> {
  const dataDir = path.dirname(DB_FILE)

  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }

  try {
    await fs.access(DB_FILE)
  } catch {
    await fs.writeFile(DB_FILE, JSON.stringify([]))
  }
}

/**
 * Read all users from the database
 */
async function readUsers(): Promise<UserRecord[]> {
  await ensureDbFile()
  const data = await fs.readFile(DB_FILE, 'utf-8')
  return JSON.parse(data)
}

/**
 * Write users to the database
 */
async function writeUsers(users: UserRecord[]): Promise<void> {
  await ensureDbFile()
  await fs.writeFile(DB_FILE, JSON.stringify(users, null, 2))
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  displayName: string,
  passwordHash: string
): Promise<User> {
  const users = await readUsers()

  // Check if user already exists
  const existing = users.find((u) => u.email === email)
  if (existing) {
    throw new Error('User with this email already exists')
  }

  const user: UserRecord = {
    id: crypto.randomUUID(),
    email,
    displayName,
    passwordHash,
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  await writeUsers(users)

  // Return user without password hash
  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * Find a user by email
 */
export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await readUsers()
  return users.find((u) => u.email === email) || null
}

/**
 * Find a user by ID
 */
export async function findUserById(id: string): Promise<User | null> {
  const users = await readUsers()
  const user = users.find((u) => u.id === id)

  if (!user) return null

  const { passwordHash: _, ...userWithoutPassword } = user
  return userWithoutPassword
}
