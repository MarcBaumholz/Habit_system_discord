'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'

import { cn } from '@/lib/utils'

type ButtonVariant = 'default' | 'ghost' | 'outline'

const baseStyles =
  'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed'

const variants: Record<ButtonVariant, string> = {
  default:
    'bg-gradient-to-r from-[#5B4BFF] via-[#6C6CFF] to-[#48D2FF] text-white shadow-[0_8px_32px_rgba(72,210,255,0.4)] hover:shadow-[0_12px_40px_rgba(72,210,255,0.5)] hover:scale-[1.03] active:scale-[0.98] focus-visible:ring-[#48D2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
  ghost:
    'bg-transparent text-white hover:bg-white/10 hover:shadow-lg focus-visible:ring-white/40 focus-visible:ring-offset-black',
  outline:
    'border-2 border-white/20 text-white bg-white/5 hover:border-white/40 hover:bg-white/10 hover:shadow-lg focus-visible:ring-white/40 focus-visible:ring-offset-black',
}

export interface ButtonProps
  extends React.ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant
  asChild?: boolean
}

const Button = React.forwardRef<React.ElementRef<'button'>, ButtonProps>(
  ({ className, variant = 'default', asChild = false, ...props }, ref) => {
    const Component = asChild ? Slot : 'button'

    return (
      <Component
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'

export { Button }

