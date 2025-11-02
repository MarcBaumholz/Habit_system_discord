import * as React from 'react'

import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLDivElement>

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'group relative overflow-hidden rounded-3xl border border-white/8 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-8 backdrop-blur-xl transition-all duration-500 hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04] hover:shadow-[0_8px_32px_rgba(72,210,255,0.15)]',
          className,
        )}
        {...props}
      >
        <div className="pointer-events-none absolute inset-0 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30">
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#5B4BFF] via-[#6C6CFF] to-[#48D2FF]" />
        </div>
        <div className="relative z-10">{props.children}</div>
      </div>
    )
  },
)

Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex flex-col space-y-1.5', className)} {...props} />
    )
  },
)

CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-2xl font-semibold leading-none tracking-tight text-white', className)}
        {...props}
      />
    )
  },
)

CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-sm text-white/70 leading-relaxed', className)}
      {...props}
    />
  )
})

CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('pt-6', className)} {...props} />
  },
)

CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center pt-6', className)} {...props} />
    )
  },
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

