'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Globe,
  Rocket,
  Zap,
  Coins,
  Wallet,
  Trophy,
  Gift,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { resetTutorial } from '@/components/NewPlayerTutorial'

export default function HelpPage() {
  const [mounted, setMounted] = useState(false)
  const [stars, setStars] = useState<{ left: string; top: string; dur: string; delay: string; large: boolean }[]>([])

  useEffect(() => {
    setMounted(true)
    // stable-ish stars for this mount
    const s = Array.from({ length: 70 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      dur: `${2.5 + Math.random() * 3}s`,
      delay: `${Math.random() * 4}s`,
      large: i < 7,
    }))
    setStars(s)
  }, [])

  const quick = [
    {
      icon: <Rocket className="w-5 h-5" />,
      title: '1) Create your Pilot account',
      text: 'Register → you get a Pilot ID. Then go straight to your Dashboard (your hub).',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: '2) Farm resources in Energy Empire',
      text: 'Generate Energy → craft Fuel → stack upgrades. Fuel is your main progression currency.',
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: '3) Claim a planet (bonus gameplay)',
      text: 'Planets give bonuses + tile exploration (rare drops, buildables, artifacts).',
    },
    {
      icon: <Coins className="w-5 h-5" />,
      title: '4) Convert Fuel → YES',
      text: 'From Dashboard: convert Fuel into YES (universal token used for rewards + cashouts).',
    },
    {
      icon: <Wallet className="w-5 h-5" />,
      title: '5) Cashout YES to LTC',
      text: 'Use the Cashout page and your FaucetPay email. Always double-check your info.',
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      title: '6) Boost with streaks & events',
      text: 'Daily streaks give consistent YES. Events are limited-time leaderboards with prizes.',
    },
  ]

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="stars">
        {mounted &&
          stars.map((s, i) => (
            <div
              key={i}
              className={`star ${s.large ? 'large' : ''}`}
              style={{
                left: s.left,
                top: s.top,
                '--dur': s.dur,
                '--delay': s.delay,
              } as React.CSSProperties}
            />
          ))}
      </div>
      <div className="nebula" />
      <div className="grid-overlay" />

      {/* Nav */}
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center planet-glow">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text-main" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              YIELDVERSE
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard?tutorial=1"
              className="btn-cyan px-4 py-2 text-xs rounded-xl"
              title="Open interactive tutorial"
            >
              <Gift className="w-4 h-4" /> Tutorial
            </Link>
            <Link
              href="/dashboard"
              className="btn-ghost px-4 py-2 text-xs rounded-xl"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-24 pb-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="glass-strong p-8 md:p-10 mb-8" style={{ borderColor: 'rgba(0,240,255,0.18)' }}>
            <p className="section-label">NEW PLAYER GUIDE</p>
            <h1 className="text-3xl md:text-4xl font-black gradient-text-main" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              Welcome to YieldVerse
            </h1>
            <p className="text-gray-400 mt-3 leading-relaxed">
              Here’s the clean “AAA” flow: <span className="text-cyan-300 font-semibold">Play → Craft Fuel → Convert to YES → Boost (streaks/events) → Cashout</span>.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Link href="/register" className="btn-primary px-6 py-3 rounded-2xl">
                <Rocket className="w-4 h-4" /> Create Account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="btn-ghost px-6 py-3 rounded-2xl">
                Already a Pilot? Login
              </Link>
              <button
                onClick={() => {
                  resetTutorial()
                  // small UX: nudge user back to dashboard tutorial
                  window.location.href = '/dashboard?tutorial=1'
                }}
                className="btn-ghost px-6 py-3 rounded-2xl"
                title="Reset + reopen tutorial"
              >
                <RefreshCw className="w-4 h-4" /> Reset Tutorial
              </button>
            </div>
          </div>

          {/* Quickstart */}
          <div className="mb-10">
            <p className="section-label">QUICKSTART</p>
            <div className="grid md:grid-cols-2 gap-4">
              {quick.map((q, i) => (
                <div key={i} className="glass-card p-6">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <span className="text-cyan-300">{q.icon}</span>
                    </div>
                    <div>
                      <p className="font-bold">{q.title}</p>
                      <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {q.text}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQs */}
          <div className="glass-card p-7 md:p-8">
            <p className="section-label">FAQ</p>
            <div className="space-y-5">
              <div>
                <p className="font-bold">What is YES?</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  YES is the universal token across YieldVerse games. You earn via gameplay, then use it for rewards and cashouts.
                </p>
              </div>
              <div className="divider" />
              <div>
                <p className="font-bold">Why Fuel first?</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Fuel is the internal “progress” resource used to convert into YES. It keeps game loops smooth and upgrade-friendly.
                </p>
              </div>
              <div className="divider" />
              <div>
                <p className="font-bold">Where do planets fit in?</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Planets add bonuses + tile exploration (rare drops, factories, artifacts). Higher rarity usually means stronger bonuses.
                </p>
              </div>
              <div className="divider" />
              <div>
                <p className="font-bold">I got stuck — what now?</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  Open the tutorial from your Dashboard (chat icon), or use the SOS Support panel so you can message the team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
