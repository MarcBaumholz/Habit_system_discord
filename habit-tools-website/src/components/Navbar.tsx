'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-gradient-to-b from-black/90 via-black/80 to-black/60 backdrop-blur-2xl shadow-lg">
      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"
      >
        <Link
          aria-label="Habit Toolbox"
          href="/"
          className="group flex items-center gap-3 text-white transition-all duration-300 hover:scale-105"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-[#5B4BFF] via-[#6C6CFF] to-[#48D2FF] text-xl font-semibold shadow-[0_4px_16px_rgba(72,210,255,0.4)] transition-all duration-300 group-hover:shadow-[0_6px_24px_rgba(72,210,255,0.6)]">
            ⚡
          </div>
          <span className="text-base font-bold uppercase tracking-[0.3em] text-white transition-colors group-hover:text-white">
            Habit Toolbox
          </span>
        </Link>

        <div className="hidden items-center gap-8 text-sm md:flex">
          <Link
            className="relative font-medium text-white/70 transition-all duration-300 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-[#5B4BFF] after:to-[#48D2FF] after:transition-all after:duration-300 hover:after:w-full"
            href="/"
          >
            Tools
          </Link>
          <Link
            className="relative font-medium text-white/70 transition-all duration-300 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-[#5B4BFF] after:to-[#48D2FF] after:transition-all after:duration-300 hover:after:w-full"
            href="#process"
          >
            Process
          </Link>
          <Link
            className="relative font-medium text-white/70 transition-all duration-300 hover:text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-gradient-to-r after:from-[#5B4BFF] after:to-[#48D2FF] after:transition-all after:duration-300 hover:after:w-full"
            href="#community"
          >
            Community
          </Link>
        </div>

        <div className="hidden md:block">
          <Button>Get started</Button>
        </div>

        <button
          aria-controls="mobile-nav"
          aria-expanded={isMenuOpen}
          className="md:hidden text-white"
          onClick={() => setIsMenuOpen((open) => !open)}
          type="button"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {isMenuOpen ? (
        <div id="mobile-nav" className="border-t border-white/10 bg-black/90 px-6 py-6 md:hidden">
          <div className="flex flex-col gap-4 text-lg text-white/70">
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              Tools
            </Link>
            <Link href="#process" onClick={() => setIsMenuOpen(false)}>
              Process
            </Link>
            <Link href="#community" onClick={() => setIsMenuOpen(false)}>
              Community
            </Link>
            <Button className="mt-4 w-full" onClick={() => setIsMenuOpen(false)}>
              Get started
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  )
}
