import * as React from 'react'

import { cn } from '@/lib/utils'

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'secondary' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300',
        {
          default:
            'border-white/20 bg-gradient-to-r from-white/10 to-white/5 text-white/90 shadow-sm hover:from-white/15 hover:to-white/8',
          secondary:
            'border-white/10 bg-white/5 text-white/70 hover:bg-white/8',
          outline: 'border-white/20 bg-transparent text-white/80 hover:bg-white/5',
        }[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }

