import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Habit Toolbox - Dein Weg zu besseren Gewohnheiten',
  description: 'Transformiere deine Gewohnheiten mit der Habit Toolbox. Ein systematischer Ansatz für nachhaltige Gewohnheitsbildung.',
  keywords: 'habits, gewohnheiten, productivity, produktivität, self-improvement, routine, focus, motivation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body className={inter.className}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}