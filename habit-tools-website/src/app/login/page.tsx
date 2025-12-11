'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to login')
        setIsLoading(false)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-white">Welcome Back</h1>
          <p className="text-white/60">Sign in to your HabitOS dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-3xl border-2 border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-white/80">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-white/80">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-white/60">
            Don't have an account?{' '}
            <Link href="/signup" className="font-semibold text-[#48D2FF] hover:text-[#48D2FF]/80">
              Sign up
            </Link>
          </div>
        </form>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-white/40 hover:text-white/60">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
