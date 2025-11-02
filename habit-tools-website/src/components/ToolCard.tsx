'use client'

import type { HTMLAttributes } from 'react'

import { motion } from 'framer-motion'
import { ArrowRight, Clock, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { HabitTool } from '@/types/tools'

interface ToolCardProps extends HTMLAttributes<HTMLDivElement> {
  tool: HabitTool
  onClick?: () => void
}

const CATEGORY_LABELS: Record<string, string> = {
  routine: 'Routine',
  focus: 'Fokus',
  time: 'Zeit',
  motivation: 'Motivation',
  environment: 'Umgebung',
}

export default function ToolCard({ tool, className, onClick, ...rest }: ToolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card
        className={cn(
          'group flex h-full cursor-pointer flex-col gap-6 border-white/8 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 text-white transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(72,210,255,0.2)]',
          className,
        )}
        onClick={onClick}
        {...rest}
      >

        <header className="flex items-start gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-white/10 to-white/5 text-4xl shadow-lg backdrop-blur-sm md:h-20 md:w-20 md:text-5xl">
            {tool.emoji ?? '🎯'}
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <h3 className="text-xl font-bold tracking-tight text-white md:text-2xl">{tool.name}</h3>
            <p className="text-sm leading-relaxed text-white/70">{tool.summary}</p>

            <div className="flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-white/80 backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5" />
                {tool.timeToImplement}
              </span>
              <span className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-white/80 backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 fill-yellow-400/40 text-yellow-400/80" />
                {tool.effectiveness}/5
              </span>
            </div>
          </div>
        </header>

        <footer className="mt-auto flex items-center justify-between border-t border-white/10 pt-6">
          <div className="flex flex-wrap gap-2">
            {tool.categories.slice(0, 2).map((category) => (
              <Badge key={category} variant="secondary" className="text-[0.65rem]">
                {CATEGORY_LABELS[category] ?? category}
              </Badge>
            ))}
            {tool.categories.length > 2 ? (
              <Badge variant="outline" className="text-[0.65rem]">
                +{tool.categories.length - 2}
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
            Details
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </footer>
      </Card>
    </motion.div>
  )
}
