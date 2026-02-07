'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  X,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Zap,
  Globe,
  Coins,
  Wallet,
  Trophy,
  Flame,
  Gift,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'

const STORAGE_KEY = 'yieldverse_tutorial_v1_done'

type Step = {
  title: string
  subtitle: string
  icon: ReactNode
  bullets: string[]
  cta?: { label: string; href: string; external?: boolean }
}

export default function NewPlayerTutorial({
  open,
  onClose,
}: {
  open: boolean
  onClose: () => void
}) {
  const steps: Step[] = useMemo(
    () => [
      {
        title: 'Welcome, Pilot',
        subtitle: 'Your 3‑minute quickstart to earning YES.',
        icon: <Rocket className="w-5 h-5" />,
        bullets: [
          'YieldVerse is a multi‑game universe with one economy: YES.',
          'You earn resources in games, convert to YES, and cash out via FaucetPay.',
          'Daily streaks + events boost earnings (and it stays 100% free).',
        ],
        cta: { label: 'See the Hub', href: '/dashboard' },
      },
      {
        title: 'Play Energy Empire',
        subtitle: 'Fastest way to start generating value.',
        icon: <Zap className="w-5 h-5" />,
        bullets: [
          'Tap/click to produce Energy and upgrade your production.',
          'Craft Fuel from Energy and stack multipliers & autoclickers.',
          'Fuel is your bridge currency inside the universe.',
        ],
        cta: { label: 'Open Energy Empire', href: 'https://www.energy-empire.space', external: true },
      },
      {
        title: 'Claim a Planet',
        subtitle: 'Planets give bonuses and unlock tile gameplay.',
        icon: <Globe className="w-5 h-5" />,
        bullets: [
          'Go to Planets → Claim a free planet (you can discover more later).',
          'Each planet has rarity + bonuses (Energy, rare drops, tiles).',
          'Scan/explore tiles to find resources, factories, artifacts, etc.',
        ],
        cta: { label: 'Go to Planets', href: '/planets' },
      },
      {
        title: 'Convert Fuel → YES',
        subtitle: 'Turn game progress into the universal token.',
        icon: <Coins className="w-5 h-5" />,
        bullets: [
          'In the Dashboard, use the converter to swap Fuel into YES.',
          'YES is tracked in your wallet and used for upgrades/cashouts.',
          'Keep an eye on streak rewards and event multipliers.',
        ],
        cta: { label: 'Back to Dashboard', href: '/dashboard' },
      },
      {
        title: 'Cashout to Crypto',
        subtitle: 'Withdraw YES to LTC via FaucetPay.',
        icon: <Wallet className="w-5 h-5" />,
        bullets: [
          'Open Cashout and set your FaucetPay email.',
          'Minimum cashout is small, so you can test quickly.',
          'Always double‑check your wallet details before confirming.',
        ],
        cta: { label: 'Open Cashout', href: '/cashout' },
      },
      {
        title: 'Events + Streaks',
        subtitle: 'The “AAA grind” boosters (but chill).',
        icon: <Trophy className="w-5 h-5" />,
        bullets: [
          'Daily streaks pay consistent YES across games.',
          'Events are time‑limited and reward top pilots.',
          'Referrals earn a cut of your friends’ rewards — no paywall.',
        ],
        cta: { label: 'View Event', href: '/event' },
      },
      {
        title: 'You’re ready',
        subtitle: 'Do this loop and you’ll progress fast.',
        icon: <Flame className="w-5 h-5" />,
        bullets: [
          'Play → Craft Fuel → Convert to YES → Streak/Event boost → Cashout.',
          'Claim planets when you can for better bonuses.',
          'If something looks off, use SOS support from your dashboard.',
        ],
        cta: { label: 'Open Help Page', href: '/help' },
      },
    ],
    []
  )

  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!open) return
    // lock scroll
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const current = steps[step]

  const markDone = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {}
  }

  const close = (done: boolean) => {
    if (done) markDone()
    onClose()
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card" style={{ maxWidth: 920 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-dim)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,240,255,0.10)', border: '1px solid rgba(0,240,255,0.18)' }}>
              <Gift className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--text-dim)', fontFamily: 'Orbitron, sans-serif', letterSpacing: 2 }}>
                NEW PILOT TUTORIAL
              </p>
              <p className="font-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>YieldVerse Quickstart</p>
            </div>
          </div>
          <button
            onClick={() => close(false)}
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="grid md:grid-cols-[280px_1fr] gap-0">
          {/* Steps */}
          <div className="border-r" style={{ borderColor: 'var(--border-dim)' }}>
            <div className="p-4">
              <div className="glass-card p-3" style={{ background: 'rgba(13,16,37,0.55)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Progress</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{step + 1}/{steps.length}</span>
                </div>
                <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.round(((step + 1) / steps.length) * 100)}%`,
                      background: 'linear-gradient(90deg, var(--purple), var(--cyan))',
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="px-2 pb-4" style={{ maxHeight: 440, overflowY: 'auto' }}>
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`w-full text-left px-3 py-3 rounded-xl mb-1 transition-colors ${
                    i === step ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: i === step ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    >
                      <span className={i === step ? 'text-cyan-300' : 'text-gray-300'}>{s.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold">{s.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{s.subtitle}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="glass-strong p-5" style={{ borderColor: 'rgba(0,240,255,0.18)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.22)' }}>
                  <span className="text-purple-300">{current.icon}</span>
                </div>
                <div>
                  <h3 className="text-xl font-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>{current.title}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{current.subtitle}</p>
                </div>
              </div>

              <ul className="space-y-2.5 mt-4">
                {current.bullets.map((b, idx) => (
                  <li key={idx} className="flex gap-2.5 text-sm" style={{ color: 'var(--text-primary)' }}>
                    <span className="mt-1.5 w-2 h-2 rounded-full" style={{ background: 'var(--cyan)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{b}</span>
                  </li>
                ))}
              </ul>

              {current.cta && (
                <div className="mt-5">
                  {current.cta.external ? (
                    <a
                      href={current.cta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-cyan w-full py-3 rounded-xl text-sm"
                    >
                      <ExternalLink className="w-4 h-4" /> {current.cta.label} <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <Link href={current.cta.href} className="btn-cyan w-full py-3 rounded-xl text-sm">
                      <ArrowRight className="w-4 h-4" /> {current.cta.label}
                    </Link>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4">
              <button
                onClick={() => close(false)}
                className="btn-ghost w-full sm:w-auto px-6 py-2.5 text-sm"
              >
                Skip for now
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setStep(Math.max(0, step - 1))}
                  disabled={step === 0}
                  className={`btn-ghost px-4 py-2.5 text-sm ${step === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                {step < steps.length - 1 ? (
                  <button
                    onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                    className="btn-primary px-5 py-2.5 text-sm"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => close(true)}
                    className="btn-primary px-6 py-2.5 text-sm"
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function shouldShowTutorial(): boolean {
  try {
    return !localStorage.getItem(STORAGE_KEY)
  } catch {
    return false
  }
}

export function resetTutorial() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
