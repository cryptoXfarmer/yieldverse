import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
