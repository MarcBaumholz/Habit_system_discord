'use client'

import useSWR from 'swr'
import type { User } from '@/types/auth'

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  error: Error | null
  mutate: () => void
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error('Failed to fetch user')
  }
  const data = await res.json()
  return data.user
}

export function useAuth(): UseAuthReturn {
  const { data, error, isLoading, mutate } = useSWR<User | null>(
    '/api/auth/session',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    }
  )

  return {
    user: data ?? null,
    isLoading,
    error,
    mutate,
  }
}
