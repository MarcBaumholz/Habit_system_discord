import Link from 'next/link'

import Navbar from '@/components/Navbar'
import ToolCard from '@/components/ToolCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { HABIT_TOOLS, TOOL_CATEGORIES } from '@/data/tools'

const quickStats = [
  { label: 'Tools', value: HABIT_TOOLS.length.toString() },
  { label: 'Kategorien', value: TOOL_CATEGORIES.length.toString() },
  { label: 'Sprachen', value: 'DE & EN' },
  { label: 'Preis', value: '100% Free' },
]

export default function ToolsPage() {
  return (
    <main className="bg-black text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 pb-24 pt-32">
        <div className="pointer-events-none absolute -left-16 top-10 h-[360px] w-[360px] rounded-full bg-[#6C6CFF]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-[300px] w-[300px] rounded-full bg-[#48D2FF]/20 blur-3xl" />

        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <Badge className="bg-white/10 text-[0.6rem] tracking-[0.4em] text-white/70">
            Habit Toolbox Library
          </Badge>
          <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Die komplette Sammlung unserer Habit Rituale
          </h1>
          <p className="mt-6 max-w-2xl text-base text-white/70 md:text-lg">
            Durchsuche alle Strategien aus dem Habit System – kuratiert, getestet und bereit für deinen Alltag.
            Jeder Eintrag liefert klare Schritte, Beispiele und Pro-Tipps.
          </p>

          <div className="mt-12 grid w-full grid-cols-2 gap-5 md:grid-cols-4">
            {quickStats.map((stat) => (
              <Card key={stat.label} className="border-white/10 bg-white/[0.06] p-6 text-left">
                <p className="text-xs uppercase tracking-[0.3em] text-white/40">{stat.label}</p>
                <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-16 px-6 pb-24">
        <div className="flex flex-col gap-8 text-center">
          <Badge className="mx-auto bg-white/10 text-[0.6rem] tracking-[0.4em] text-white/70">Toolboxen</Badge>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Finde das Cluster, das zu deinem Ziel passt</h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {TOOL_CATEGORIES.map((category) => (
              <Link key={category.id} href={`/search?q=${encodeURIComponent(category.name)}`}>
                <Card className="h-full border-white/10 bg-white/[0.05] p-8 text-left transition hover:-translate-y-1">
                  <span className="text-3xl">{category.emoji ?? '🧩'}</span>
                  <h3 className="mt-4 text-lg font-semibold text-white">{category.name}</h3>
                  <p className="mt-3 text-sm text-white/65">{category.description}</p>
                  <span className="mt-6 inline-flex items-center text-xs uppercase tracking-[0.3em] text-white/40">
                    Öffnen →
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge className="w-fit bg-white/10 text-[0.6rem] tracking-[0.4em] text-white/70">Alle Tools</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight">Browse & filter deine Habit Assets</h2>
            </div>

            <form action="/search" className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <Input
                name="q"
                placeholder="z.B. Motivation halten, keine Zeit, Fokus"
                className="md:w-96"
              />
              <Button className="h-12 px-6 text-sm" type="submit">
                Suchen
              </Button>
            </form>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {HABIT_TOOLS.map((tool) => (
              <Link key={tool.id} href={`/tools/${tool.id}`}>
                <ToolCard tool={tool} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-28">
        <Card className="border-white/10 bg-white/[0.05] p-10 text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Noch nicht sicher, welches Tool passt?
          </h2>
          <p className="mt-4 text-base text-white/70 md:text-lg">
            Nutze die intelligente Suche oder frag die Community nach ihrer Lieblingsroutine für dein Szenario.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild className="h-11 px-8 text-sm">
              <Link href="/search">Intelligente Suche</Link>
            </Button>
            <Button asChild className="h-11 px-8 text-sm" variant="outline">
              <Link href="#community">Community beitreten</Link>
            </Button>
          </div>
        </Card>
      </section>
    </main>
  )
}
