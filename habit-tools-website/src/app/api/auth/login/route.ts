import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/users-db'
import { comparePasswords, generateToken, isValidEmail } from '@/lib/auth'
import type { LoginData } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body: LoginData = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Find user
    const userRecord = await findUserByEmail(email)

    if (!userRecord) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await comparePasswords(password, userRecord.passwordHash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate token
    const user = {
      id: userRecord.id,
      email: userRecord.email,
      displayName: userRecord.displayName,
      createdAt: userRecord.createdAt,
    }

    const token = generateToken(user)

    // Create response
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
      },
    })

    // Set cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 })
  }
}
