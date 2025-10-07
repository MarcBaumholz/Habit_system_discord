import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Habit Tools - Your Personal Habit Coach',
  description: 'Discover proven strategies and tools to build better habits. From habit stacking to time boxing, find the perfect technique for your goals.',
  keywords: 'habits, productivity, self-improvement, routine, focus, motivation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}