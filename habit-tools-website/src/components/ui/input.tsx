'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

const baseStyles =
  'flex h-12 w-full rounded-full border-2 border-white/20 bg-gradient-to-b from-white/8 to-white/4 px-6 text-sm text-white placeholder:text-white/40 backdrop-blur-sm transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#48D2FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:border-[#48D2FF] hover:border-white/30 hover:from-white/12 hover:to-white/6 disabled:cursor-not-allowed disabled:opacity-50'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return <input ref={ref} className={cn(baseStyles, className)} {...props} />
})

Input.displayName = 'Input'

export { Input }

