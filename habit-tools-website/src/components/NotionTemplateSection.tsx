'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Download } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const checklist = [
  'Vorgefertigte Struktur für alle Toolboxen',
  'Automatisierte Tracking-Boards',
  'Progress-Visualisierung mit Glow Effects',
  'Community-Integration via WhatsApp & Loom',
]

export default function NotionTemplateSection() {
  return (
    <section id="notion-template" className="mx-auto max-w-6xl px-6 pb-28">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col gap-8"
        >
          <Badge className="w-fit bg-white/10 text-[0.6rem] tracking-[0.4em] text-white/70">
            Template system
          </Badge>
          <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Das Habit OS für Notion – inspiriert von immersiven Digital Studios.
          </h2>
          <p className="max-w-xl text-sm text-white/60 md:text-base">
            Hol dir das komplette Setup: Kanban, Automationen, Reporting. Alles sauber designt und sofort
            einsatzbereit – inklusive futuristischer Visuals und schnellen Quick-Actions.
          </p>

          <ul className="space-y-4">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/70">
                <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#48d2ff]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <Button asChild className="mt-4 h-12 w-fit px-8 text-sm font-semibold">
            <Link href="#download">
              <Download className="mr-2 h-5 w-5" /> Template herunterladen
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative"
        >
          <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-[#5b4bff]/30 via-[#6c6cff]/15 to-[#48d2ff]/20 blur-3xl transition-all duration-700 hover:blur-[4rem]" />
          <div className="relative overflow-hidden rounded-[32px] border-2 border-white/15 bg-gradient-to-br from-white/[0.12] via-white/[0.06] to-white/[0.03] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.3)] backdrop-blur-2xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/30">
              <span className="h-2 w-2 rounded-full bg-[#48d2ff]" />
              Habit Dashboard
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <p className="text-sm text-white/50">Progress</p>
                <p className="mt-1 text-2xl font-semibold text-white">75% Complete</p>
                <div className="mt-4 h-3 w-full rounded-full bg-white/10">
                  <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#5b4bff] via-[#6c6cff] to-[#48d2ff]" />
                </div>
              </div>

              <div className="grid gap-3 text-sm text-white/70">
                {[
                  { text: 'Morning Energy Stack', completed: true },
                  { text: 'Habit Health Check', completed: true },
                  { text: 'Creative Ritual', completed: false },
                  { text: 'Weekly Reflection', completed: false },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4"
                  >
                    <span className={item.completed ? 'text-white/40 line-through' : 'text-white/80'}>
                      {item.text}
                    </span>
                    <span
                      className={
                        item.completed
                          ? 'h-5 w-5 rounded-full bg-gradient-to-r from-[#5b4bff] to-[#48d2ff]'
                          : 'h-5 w-5 rounded-full border border-white/30'
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
