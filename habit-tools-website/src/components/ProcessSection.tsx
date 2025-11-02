'use client'

import { motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'

const processSteps = [
  {
    number: '01',
    title: 'Problem identifizieren',
    description: 'Definiere präzise, welche Gewohnheit du verändern willst und warum sie wichtig ist.',
  },
  {
    number: '02',
    title: 'Toolbox wählen',
    description: 'Nutze den Habit-Matcher, um das passende Tool mit maximalem Wirkungsgrad zu finden.',
  },
  {
    number: '03',
    title: 'System bauen',
    description: 'Kombiniere Tool + Trigger + Tracking in einer futuristischen Routine, die zu dir passt.',
  },
  {
    number: '04',
    title: 'Community nutzen',
    description: 'Hol dir Momentum durch Live Sessions, Accountability-Partner und geteilte Reports.',
  },
]

export default function ProcessSection() {
  return (
    <section
      id="process"
      className="relative mx-auto mt-10 flex max-w-6xl flex-col gap-12 px-6 pb-28"
    >
      <div className="absolute inset-0 -z-10 mx-auto h-full w-full rounded-[56px] border border-white/10 bg-white/[0.03] backdrop-blur-2xl" />

      <header className="flex flex-col gap-4 px-6 pt-16">
        <Badge className="w-fit bg-white/10 text-[0.6rem] tracking-[0.4em] text-white/70">
          Process architecture
        </Badge>
        <h2 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
          Vier Phasen, ein klares Ziel: Gewohnheiten, die bleiben.
        </h2>
        <p className="max-w-2xl text-sm text-white/60">
          Jedes Modul führt dich visuell durch den nächsten Schritt – inspiriert von der immersiven Experience
          auf lusion.co, jedoch zugeschnitten auf Habit Systems.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 px-6 pb-16 md:grid-cols-2">
        {processSteps.map((step, index) => (
          <motion.article
            key={step.number}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] p-8 shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_16px_48px_rgba(72,210,255,0.15)]"
          >
            <div className="absolute -top-16 right-0 h-32 w-32 rounded-full bg-[#48d2ff]/20 blur-3xl" />

            <div className="mb-4 flex items-center gap-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5B4BFF] to-[#48D2FF] text-xs font-bold text-white shadow-lg">
                {step.number}
              </span>
              <h3 className="text-2xl font-bold text-white">{step.title}</h3>
            </div>
            <p className="text-sm leading-relaxed text-white/70">{step.description}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}

