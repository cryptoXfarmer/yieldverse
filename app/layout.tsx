import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'YieldVerse - Metaverse P2E',
  description: 'Play games, earn YES tokens',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
