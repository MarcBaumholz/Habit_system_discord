import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { findUserById } from '@/lib/users-db'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    const user = await findUserById(payload.userId)

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
