'use client';

import { motion } from 'framer-motion';
import { HabitTool } from '@/types/tools';
import { Clock, Star } from 'lucide-react';

interface ToolCardProps {
  tool: HabitTool;
  onClick?: () => void;
}

export default function ToolCard({ tool, onClick }: ToolCardProps) {
  const categoryNames: Record<string, string> = {
    routine: 'Routine',
    focus: 'Fokus',
    time: 'Zeitmanagement',
    motivation: 'Motivation',
    environment: 'Umgebung',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="notion-card h-full flex flex-col cursor-pointer group"
      onClick={onClick}
    >
      {/* Header mit Emoji & Titel */}
      <div className="flex items-start gap-4 mb-4">
        <div className="text-5xl leading-none flex-shrink-0">
          {tool.emoji || '🎯'}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold mb-2 group-hover:text-[var(--notion-accent)] transition-colors">
            {tool.name}
          </h3>
          <div className="flex items-center gap-2 text-sm text-[var(--notion-text-secondary)]">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {tool.timeToImplement}
            </span>
            <span className="text-[var(--notion-border)]">•</span>
            <span className="inline-flex items-center gap-1">
              <Star className="w-3.5 h-3.5" />
              {tool.effectiveness}/5
            </span>
          </div>
        </div>
      </div>

      {/* Beschreibung */}
      <p className="text-[var(--notion-text-secondary)] text-sm leading-relaxed mb-4 flex-1">
        {tool.summary}
      </p>

      {/* Meta-Informationen */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--notion-border)]">
        <div className="flex flex-wrap gap-1.5">
          {tool.categories.slice(0, 2).map((category) => (
            <span
              key={category}
              className="px-2 py-0.5 bg-[var(--notion-surface-hover)] text-[var(--notion-text-secondary)] rounded text-xs"
            >
              {categoryNames[category] || category}
            </span>
          ))}
          {tool.categories.length > 2 && (
            <span className="px-2 py-0.5 bg-[var(--notion-surface-hover)] text-[var(--notion-text-secondary)] rounded text-xs">
              +{tool.categories.length - 2}
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--notion-accent)] font-medium">
          Details →
        </span>
      </div>
    </motion.div>
  );
}
