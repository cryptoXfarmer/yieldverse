import { Suspense } from 'react'
import DashboardClient from './DashboardClient'

function DashboardFallback() {
  return (
    <div className="min-h-screen bg-[#05060a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 rounded-full border border-white/10 animate-pulse mx-auto" />
        <p className="mt-3 text-white/60 text-sm">Loading dashboard…</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  // NOTE: useSearchParams() lives inside DashboardClient.
  // Wrapping it in Suspense prevents Next.js static prerender errors on Vercel.
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardClient />
    </Suspense>
  )
}
