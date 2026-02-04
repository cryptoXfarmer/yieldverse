import type { Metadata } from 'next'
import { Exo_2 } from 'next/font/google'
import './globals.css'

const exo2 = Exo_2({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  title: 'YieldVerse - The YES Metaverse',
  description: 'Play games, earn YES tokens, cashout real crypto. The future of Play-to-Earn gaming.',
  keywords: ['play to earn', 'crypto games', 'metaverse', 'YES tokens', 'P2E'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={exo2.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: 'var(--font-body), "Exo 2", system-ui, sans-serif' }}>{children}</body>
    </html>
  )
}
