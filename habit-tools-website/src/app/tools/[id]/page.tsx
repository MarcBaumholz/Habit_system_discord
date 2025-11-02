import Link from 'next/link'
import { notFound } from 'next/navigation'

import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import ToolCard from '@/components/ToolCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { HABIT_TOOLS, TOOL_CATEGORIES } from '@/data/tools'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  Lightbulb,
  Sparkles,
  Target,
} from 'lucide-react'

interface ToolDetailPageProps {
  params: {
    id: string
  }
}

const CATEGORY_NAME = new Map(TOOL_CATEGORIES.map((category) => [category.id, category.name]))

export default function ToolDetailPage({ params }: ToolDetailPageProps) {
  const tool = HABIT_TOOLS.find((entry) => entry.id === params.id)

  if (!tool) {
    notFound()
    return null
  }

  const relatedTools = HABIT_TOOLS.filter(
    (entry) => entry.id !== tool.id && entry.categories.some((category) => tool.categories.includes(category)),
  ).slice(0, 3)

  const metrics = [
    { label: 'Schwierigkeit', value: tool.difficulty },
    { label: 'Zeitaufwand', value: tool.timeToImplement },
    { label: 'Effektivität', value: `${tool.effectiveness}/5` },
    {
      label: 'Sprache',
      value: tool.language === 'both' ? 'DE & EN' : tool.language.toUpperCase(),
    },
  ]

  return (
    <main className="bg-black text-white">
      <Navbar />

      <section className="relative isolate overflow-hidden px-6 pb-20 pt-32">
        <div className="pointer-events-none absolute -left-32 top-20 h-[520px] w-[520px] rounded-full bg-[#5B4BFF]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-12 h-[380px] w-[380px] rounded-full bg-[#48D2FF]/20 blur-3xl" />

        <div className="mx-auto flex max-w-5xl flex-col gap-12">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm text-white/60 transition hover:text-white"
            href="/tools"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Übersicht
          </Link>

          <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
            <div className="flex-1 space-y-6">
              <Badge className="w-fit bg-white/10 text-[0.6rem] tracking-[0.4em] text-white/70">
                {tool.categories
                  .map((category) => CATEGORY_NAME.get(category) ?? category)
                  .join(' · ')}
              </Badge>

              <div className="flex items-center gap-4 text-6xl font-semibold tracking-tight">
                <span>{tool.emoji ?? '🎯'}</span>
                <h1 className="text-balance leading-[1.05] md:text-6xl">{tool.name}</h1>
              </div>

              <p className="max-w-2xl text-base text-white/70 md:text-lg">{tool.summary}</p>

              <div className="flex flex-wrap gap-3">
                <Button className="h-11 px-6 text-sm" variant="default">
                  <Sparkles className="mr-2 h-4 w-4" /> Direkt anwenden
                </Button>
                <Button className="h-11 px-6 text-sm" variant="ghost" asChild>
                  <Link href={`/search?q=${encodeURIComponent(tool.name)}`}>Ähnliche Tools finden</Link>
                </Button>
              </div>
            </div>

            <Card className="w-full max-w-sm border-white/10 bg-white/[0.08] p-8">
              <h2 className="text-sm font-semibold uppercase tracking-[0.4em] text-white/50">Quick Stats</h2>
              <div className="mt-6 grid grid-cols-1 gap-4">
                {metrics.map((metric) => (
                  <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/40 px-5 py-4">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/40">{metric.label}</p>
                    <p className="mt-2 text-base font-medium text-white">{metric.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl space-y-12 px-6 pb-24">
        <Card className="border-white/10 bg-white/[0.05] p-10">
          <div className="flex items-center gap-3 text-white/60">
            <BookOpen className="h-5 w-5" />
            <span className="text-sm uppercase tracking-[0.3em]">Über dieses Ritual</span>
          </div>
          <p className="mt-6 text-pretty text-base text-white/80 md:text-lg">{tool.description}</p>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {tool.steps?.length ? (
            <Card className="border-white/10 bg-white/[0.05] p-8">
              <div className="flex items-center gap-3 text-white/60">
                <Target className="h-5 w-5" />
                <span className="text-sm uppercase tracking-[0.3em]">Schritt-für-Schritt</span>
              </div>
              <ol className="mt-6 space-y-4">
                {tool.steps.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/70">
                      {index + 1}
                    </span>
                    <p className="text-sm text-white/70">{step}</p>
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}

          {tool.whenToUse?.length ? (
            <Card className="border-white/10 bg-white/[0.05] p-8">
              <div className="flex items-center gap-3 text-white/60">
                <CheckCircle2 className="h-5 w-5" />
                <span className="text-sm uppercase tracking-[0.3em]">Wann einsetzen?</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-white/70">
                {tool.whenToUse.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#48D2FF]" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {tool.examples?.length ? (
            <Card className="border-white/10 bg-white/[0.05] p-8">
              <div className="flex items-center gap-3 text-white/60">
                <Lightbulb className="h-5 w-5" />
                <span className="text-sm uppercase tracking-[0.3em]">Praxis-Beispiele</span>
              </div>
              <div className="mt-6 space-y-4">
                {tool.examples.map((example) => (
                  <blockquote key={example} className="rounded-2xl border border-white/15 bg-black/40 p-5 text-sm text-white/70">
                    &ldquo;{example}&rdquo;
                  </blockquote>
                ))}
              </div>
            </Card>
          ) : null}

          {tool.tips?.length ? (
            <Card className="border-white/10 bg-white/[0.05] p-8">
              <div className="flex items-center gap-3 text-white/60">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm uppercase tracking-[0.3em]">Pro Tipps</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm text-white/70">
                {tool.tips.map((tip) => (
                  <li key={tip} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5B4BFF]" />
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>

        {tool.sources?.length ? (
          <Card className="border-white/10 bg-white/[0.05] p-8">
            <div className="flex items-center gap-3 text-white/60">
              <ExternalLink className="h-5 w-5" />
              <span className="text-sm uppercase tracking-[0.3em]">Quellen & Referenzen</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-white/70">
              {tool.sources.map((source) => (
                <li key={source}>
                  <a className="inline-flex items-center gap-2 text-[#48D2FF] hover:underline" href={source} target="_blank" rel="noreferrer">
                    Mehr erfahren
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-6 rounded-[32px] border border-white/10 bg-white/[0.05] px-8 py-8">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Bereit für den nächsten Schritt?</p>
            <p className="mt-2 text-base text-white/70">
              Nutze den Habit Matcher, um verwandte Techniken sofort zu finden.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="h-11 px-6 text-sm" variant="default">
              <Link href="/tools">Alle Tools ansehen</Link>
            </Button>
            <Button asChild className="h-11 px-6 text-sm" variant="outline">
              <Link href="/search">Intelligente Suche</Link>
            </Button>
          </div>
        </div>
      </section>

      {relatedTools.length ? (
        <section className="mx-auto max-w-6xl px-6 pb-32">
          <div className="mb-10 flex flex-col gap-3">
            <Badge className="w-fit bg-white/10 text-[0.6rem] tracking-[0.4em] text-white/70">
              Verwandte Rituale
            </Badge>
            <h2 className="text-3xl font-semibold tracking-tight">Diese Tools ergänzen {tool.name}</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {relatedTools.map((relatedTool) => (
              <Link key={relatedTool.id} href={`/tools/${relatedTool.id}`}>
                <ToolCard tool={relatedTool} />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <Footer />
    </main>
  )
}

