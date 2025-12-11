import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/users-db'
import {
  hashPassword,
  generateToken,
  isValidEmail,
  isValidPassword,
  isValidDisplayName,
} from '@/lib/auth'
import type { SignupData } from '@/types/auth'

export async function POST(request: NextRequest) {
  try {
    const body: SignupData = await request.json()
    const { email, password, displayName } = body

    // Validation
    if (!email || !password || !displayName) {
      return NextResponse.json(
        { error: 'Email, password, and display name are required' },
        { status: 400 }
      )
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    if (!isValidPassword(password)) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    if (!isValidDisplayName(displayName)) {
      return NextResponse.json(
        { error: 'Display name must be 2-50 characters' },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Create user
    const user = await createUser(email, displayName, passwordHash)

    // Generate token
    const token = generateToken(user)

    // Create response with httpOnly cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
        },
      },
      { status: 201 }
    )

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
    console.error('Signup error:', error)

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}
