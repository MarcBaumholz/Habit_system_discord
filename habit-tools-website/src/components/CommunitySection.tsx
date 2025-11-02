'use client'

import { motion } from 'framer-motion'
import { Users, BarChart3, Target, MessageCircle } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const features = [
  {
    icon: Users,
    text: 'Accountability Partner finden',
  },
  {
    icon: BarChart3,
    text: 'Weekly Momentum Calls',
  },
  {
    icon: Target,
    text: 'Gemeinsame Ziel-Sprints',
  },
]

export default function CommunitySection() {
  return (
    <section
      id="community"
      className="relative mx-auto max-w-6xl overflow-hidden rounded-[56px] border-2 border-white/15 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] px-6 py-24 shadow-[0_8px_48px_rgba(18,255,195,0.1)] backdrop-blur-3xl"
    >
      <div className="pointer-events-none absolute -right-12 top-10 h-80 w-80 rounded-full bg-[#12ffc3]/20 blur-3xl" />

      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <Badge className="bg-white/10 text-[0.6rem] tracking-[0.4em] text-white/70">
          Collective energy
        </Badge>
        <h2 className="text-4xl font-semibold tracking-tight md:text-5xl">
          Community & Accountability wie im futuristischen Studio.
        </h2>
        <p className="text-sm text-white/60 md:text-base">
          Live Sessions, Fokus-Spots und reale Verbindlichkeit. Unsere Community bringt die Ästhetik von
          lusion.co in deine Gewohnheitsarbeit – nur mit echten Ergebnissen.
        </p>
      </div>

      <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.text}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
            className="flex flex-col items-center gap-3 rounded-3xl border-2 border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] px-6 py-10 shadow-lg backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-white/20 hover:shadow-xl"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <feature.icon className="h-7 w-7 text-white/80" />
            </div>
            <p className="text-sm font-medium text-white/70">{feature.text}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Button asChild className="h-12 px-10 text-sm font-semibold">
          <Link href="#contact" className="inline-flex items-center gap-3">
            <MessageCircle className="h-5 w-5" /> Community beitreten
          </Link>
        </Button>
      </div>
    </section>
  )
}
