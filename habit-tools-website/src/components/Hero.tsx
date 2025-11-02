'use client'

import React, { useState } from 'react'
import { ArrowRight, Search } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function Hero() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = query.trim()

    if (!trimmed) {
      return
    }

    const params = new URLSearchParams({ q: trimmed, source: 'hero' })
    router.push(`/search?${params.toString()}`)
  }

  return (
    <section className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden bg-gradient-to-b from-black via-black to-[#05010D] px-6 pb-24 pt-48">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <div className="flex flex-col gap-8 text-white">
          <Badge className="w-fit bg-white/10 text-[0.65rem] tracking-[0.4em] text-white/80">
            Beyond habits
          </Badge>

          <h1 className="text-balance bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-5xl font-bold leading-[1.05] tracking-tight text-transparent drop-shadow-[0_4px_12px_rgba(72,210,255,0.3)] md:text-7xl">
            Build rituals that stay.<br />
            <span className="bg-gradient-to-r from-[#5B4BFF] via-[#6C6CFF] to-[#48D2FF] bg-clip-text text-transparent">
              Craft a better life
            </span>{' '}
            with the Futurist Habit Toolbox.
          </h1>

          <p className="max-w-2xl text-pretty text-base text-white/70 md:text-lg">
            Ein immersiver Workflow inspiriert von High-End Studios wie Lusion — klare Strukturen,
            neonfarbene Akzente, lebendige Animationen. Gestalte Gewohnheiten, die wirklich bleiben.
          </p>

          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Button className="h-12 px-8 text-sm" type="button">
              Browse tools
            </Button>

            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition hover:text-white"
              href="#featured-tools"
            >
              Discover the process
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <form
          aria-label="Habit challenge search"
          className="relative max-w-3xl rounded-3xl border-2 border-white/15 bg-gradient-to-br from-white/8 via-white/5 to-white/3 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-500 hover:border-white/25 hover:shadow-[0_12px_48px_rgba(72,210,255,0.2)]"
          onSubmit={handleSearch}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Input
                autoComplete="off"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Woran möchtest du arbeiten?"
                value={query}
              />
              <Search className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            </div>

            <Button className="h-12 px-6 text-sm" type="submit">
              Suche starten
            </Button>
          </div>

          <p className="mt-4 text-xs text-white/50">
            Tip: Nutze Keywords wie „Motivation“, „Routine“ oder „Zeitmanagement“, um präzise Empfehlungen
            zu erhalten.
          </p>
        </form>
      </div>

      <div className="pointer-events-none absolute -left-10 top-10 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-[#5B4BFF] via-[#6C6CFF] to-[#48D2FF] opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-[360px] w-[360px] rounded-full bg-[#12FFC3] opacity-20 blur-3xl" />
    </section>
  )
}
