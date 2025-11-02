'use client'

import Link from 'next/link'
import { Github, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="relative mt-32 border-t-2 border-white/10 bg-gradient-to-b from-black/80 via-black/60 to-black/40 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3 text-white/80">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-r from-[#5B4BFF] via-[#6C6CFF] to-[#48D2FF] text-lg">
            ⚡
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.3em]">Habit Toolbox</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs uppercase tracking-[0.3em] text-white/50">
          <Link className="transition hover:text-white" href="/">
            Tools
          </Link>
          <Link className="transition hover:text-white" href="#process">
            Process
          </Link>
          <Link className="transition hover:text-white" href="#community">
            Community
          </Link>
          <Link
            className="inline-flex items-center gap-2 transition hover:text-white"
            href="https://github.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            <Github className="h-4 w-4" /> GitHub
          </Link>
        </nav>

        <p className="flex items-center gap-2 text-xs text-white/40">
          © {new Date().getFullYear()} Habit Toolbox. Made with
          <Heart className="h-4 w-4 text-[#ff6b9a]" /> for ritual design.
        </p>
      </div>
    </footer>
  )
}
