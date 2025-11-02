import Link from 'next/link'

import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import ProcessSection from '@/components/ProcessSection'
import ToolCard from '@/components/ToolCard'
import NotionTemplateSection from '@/components/NotionTemplateSection'
import CommunitySection from '@/components/CommunitySection'
import Footer from '@/components/Footer'
import { HABIT_TOOLS } from '@/data/tools'

export default function Home() {
  const featuredTools = HABIT_TOOLS.slice(0, 6)

  return (
    <main className="bg-black text-white">
      <Navbar />
      <Hero />

      <section
        id="featured-tools"
        aria-labelledby="featured-tools-heading"
        className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-28"
      >
        <header className="flex flex-col gap-4">
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Curated for momentum</p>
          <h2 id="featured-tools-heading" className="text-4xl font-semibold tracking-tight md:text-5xl">
            Beliebte Habit Tools
          </h2>
          <p className="max-w-2xl text-sm text-white/60 md:text-base">
            Starte mit Techniken, die in der Community funktionieren. Jede Karte zeigt dir sofort, was das Tool
            besonders macht.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {featuredTools.map((tool) => (
            <Link key={tool.id} href={`/tools/${tool.id}`}>
              <ToolCard data-testid="featured-tool-card" tool={tool} />
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-3xl border-2 border-white/15 bg-gradient-to-r from-white/[0.08] via-white/[0.05] to-white/[0.08] px-8 py-8 shadow-xl backdrop-blur-2xl transition-all duration-500 hover:border-white/25 hover:shadow-[0_12px_48px_rgba(72,210,255,0.15)]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-white/60">Explore all rituals</p>
            <p className="text-xs text-white/50">{HABIT_TOOLS.length} Tools warten auf dich</p>
          </div>
          <Link
            className="rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white hover:border-white/40"
            href="/tools"
          >
            View all tools
          </Link>
        </div>
      </section>

      <ProcessSection />
      <NotionTemplateSection />
      <CommunitySection />
      <Footer />
    </main>
  )
}