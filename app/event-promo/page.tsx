'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

export default function EventPromoPage() {
  const [countdown, setCountdown] = useState({ d: 0, h: 0, m: 0, s: 0 })
  const [phase, setPhase] = useState<'upcoming' | 'active' | 'ended'>('upcoming')
  const [mounted, setMounted] = useState(false)

  const EVENT_START = '2026-02-03T00:00:00Z'
  const EVENT_END = '2026-02-07T00:00:00Z'

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      const start = new Date(EVENT_START).getTime()
      const end = new Date(EVENT_END).getTime()

      let target: number
      if (now < start) {
        setPhase('upcoming')
        target = start
      } else if (now < end) {
        setPhase('active')
        target = end
      } else {
        setPhase('ended')
        setCountdown({ d: 0, h: 0, m: 0, s: 0 })
        return
      }

      const ms = target - now
      setCountdown({
        d: Math.floor(ms / 86400000),
        h: Math.floor((ms % 86400000) / 3600000),
        m: Math.floor((ms % 3600000) / 60000),
        s: Math.floor((ms % 60000) / 1000),
      })
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  // Generate stars once
  const stars = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() > 0.85 ? 3 : Math.random() > 0.5 ? 2 : 1,
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 3,
    }))
  , [])

  // Streaks
  const streaks = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      top: 10 + Math.random() * 80,
      width: 100 + Math.random() * 200,
      delay: Math.random() * 8,
      duration: 3 + Math.random() * 4,
    }))
  , [])

  const prizes = [
    { rank: '1ST', emoji: '🥇', value: '250 YES', color: 'from-yellow-500/20 to-amber-600/10', border: 'border-yellow-500/40', text: 'text-yellow-400' },
    { rank: '2ND', emoji: '🥈', value: '150 YES', color: 'from-gray-400/15 to-gray-500/5', border: 'border-gray-400/40', text: 'text-gray-300' },
    { rank: '3RD', emoji: '🥉', value: '100 YES', color: 'from-orange-500/15 to-amber-600/5', border: 'border-orange-500/40', text: 'text-orange-400' },
    { rank: '4TH', emoji: '🎁', value: '500 FUEL', color: 'from-purple-500/15 to-pink-600/5', border: 'border-purple-500/30', text: 'text-purple-400' },
    { rank: '5TH', emoji: '🎁', value: '1K RARE + 10K ⚡', color: 'from-purple-500/15 to-pink-600/5', border: 'border-purple-500/30', text: 'text-purple-400' },
  ]

  return (
    <div className="relative min-h-screen bg-black overflow-hidden select-none">

      {/* ═══ DEEP SPACE BACKGROUND ═══ */}
      <div className="fixed inset-0">
        {/* Nebula gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e] via-[#0a0014] to-black" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 80% 20%, rgba(255,165,0,0.07) 0%, transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(138,43,226,0.05) 0%, transparent 50%), radial-gradient(ellipse at 50% 50%, rgba(255,69,0,0.03) 0%, transparent 40%)'
        }} />

        {/* Grid */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'linear-gradient(rgba(255,165,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,165,0,0.04) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
        }} />

        {/* Stars */}
        {mounted && stars.map(star => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
            }}
          />
        ))}

        {/* Energy streaks */}
        {mounted && streaks.map(streak => (
          <div
            key={streak.id}
            className="absolute h-px"
            style={{
              top: `${streak.top}%`,
              width: streak.width,
              left: '-200px',
              background: 'linear-gradient(90deg, transparent, rgba(255,200,0,0.4), transparent)',
              animation: `streakMove ${streak.duration}s linear ${streak.delay}s infinite`,
            }}
          />
        ))}

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }} />
      </div>

      {/* ═══ CORNER ACCENTS ═══ */}
      <div className="fixed top-6 left-6 w-20 h-20 border-t-2 border-l-2 border-orange-500/20 z-10" />
      <div className="fixed bottom-6 right-6 w-20 h-20 border-b-2 border-r-2 border-orange-500/20 z-10" />

      {/* ═══ BRANDING ═══ */}
      <div className="fixed top-6 right-8 z-50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-sm">
          🌐
        </div>
        <span className="text-white/60 font-bold tracking-[4px] text-sm" style={{ fontFamily: "'Courier New', monospace" }}>
          YIELDVERSE
        </span>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="relative z-20 min-h-screen flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-12 py-16">

          {/* LEFT — Energy Bolt */}
          <div className="relative flex-shrink-0 w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            {/* Rings */}
            {[300, 220, 150].map((size, i) => (
              <div
                key={i}
                className="absolute rounded-full border-2"
                style={{
                  width: size,
                  height: size,
                  borderColor: `rgba(255, ${180 + i * 20}, 0, ${0.1 + i * 0.08})`,
                  animation: `pulseRing 3s ease-in-out ${i * 0.5}s infinite`,
                }}
              />
            ))}
            {/* Bolt */}
            <span className="text-7xl md:text-8xl relative z-10" style={{
              filter: 'drop-shadow(0 0 30px rgba(255,200,0,0.8)) drop-shadow(0 0 60px rgba(255,165,0,0.4))',
              animation: 'boltPulse 2s ease-in-out infinite',
            }}>
              ⚡
            </span>
          </div>

          {/* RIGHT — Content */}
          <div className="flex-1 max-w-2xl">

            {/* Badge */}
            <div className="inline-block mb-5">
              <span className="px-5 py-2 rounded text-xs font-black tracking-[3px] uppercase bg-gradient-to-r from-orange-500 to-amber-500 text-black">
                🏆 Alpha Event
              </span>
            </div>

            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-black leading-[1.05] mb-2 tracking-tight">
              <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-red-500 bg-clip-text text-transparent">
                ENERGY RACE
              </span>
              <br />
              <span className="text-white">#1</span>
            </h1>

            <p className="text-white/40 text-lg mb-8 tracking-wide">
              Click. Compete. Earn real crypto. Top 5 win prizes.
            </p>

            {/* ═══ COUNTDOWN ═══ */}
            <div className="mb-8">
              <p className="text-xs text-white/30 tracking-[3px] uppercase mb-3">
                {phase === 'upcoming' ? '⏳ Event starts in' : phase === 'active' ? '⏰ Event ends in' : '🏁 Event has ended'}
              </p>
              <div className="flex gap-3">
                {[
                  { val: countdown.d, label: 'DAYS' },
                  { val: countdown.h, label: 'HRS' },
                  { val: countdown.m, label: 'MIN' },
                  { val: countdown.s, label: 'SEC' },
                ].map((unit, i) => (
                  <div key={i} className="bg-black/60 border border-orange-500/20 rounded-xl px-4 py-3 text-center min-w-[70px] backdrop-blur-sm">
                    <div className="text-3xl md:text-4xl font-black text-yellow-400 font-mono tabular-nums leading-none mb-1">
                      {String(unit.val).padStart(2, '0')}
                    </div>
                    <div className="text-[10px] text-white/30 tracking-[2px] font-bold">{unit.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ PRIZES ═══ */}
            <div className="grid grid-cols-5 gap-2 mb-8">
              {prizes.map((prize, i) => (
                <div
                  key={i}
                  className={`relative bg-gradient-to-b ${prize.color} border ${prize.border} rounded-xl p-3 text-center backdrop-blur-sm transition-transform hover:scale-105`}
                >
                  <span className="text-2xl md:text-3xl block mb-1">{prize.emoji}</span>
                  <div className="text-[10px] text-white/35 tracking-[2px] font-bold mb-1">{prize.rank}</div>
                  <div className={`text-xs md:text-sm font-extrabold ${prize.text}`}>{prize.value}</div>
                </div>
              ))}
            </div>

            {/* ═══ INFO BAR ═══ */}
            <div className="flex flex-wrap gap-6 mb-8">
              {[
                { icon: '⏱️', label: 'DURATION', value: '96 HOURS', color: 'text-cyan-400' },
                { icon: '🎮', label: 'ENTRY', value: 'FREE', color: 'text-green-400' },
                { icon: '⚡', label: 'STARTS', value: 'FEB 3 · 00:00 UTC', color: 'text-orange-400' },
              ].map((info, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-sm">
                    {info.icon}
                  </div>
                  <div>
                    <div className="text-[9px] text-white/25 tracking-[2px] font-bold">{info.label}</div>
                    <div className={`text-sm font-extrabold tracking-wide ${info.color}`}>{info.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* ═══ CTA BUTTONS ═══ */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/join"
                className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl font-black text-base tracking-[2px] uppercase text-black bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 shadow-[0_0_40px_rgba(255,100,0,0.3)] hover:shadow-[0_0_60px_rgba(255,100,0,0.5)] transition-all hover:scale-[1.03] active:scale-[0.97]"
              >
                <span className="text-lg">⚡</span>
                JOIN NOW — IT&apos;S FREE
                <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <Link
                href="/event"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-sm tracking-[2px] uppercase text-orange-400 border-2 border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 transition-all hover:scale-[1.03] active:scale-[0.97]"
              >
                🏆 VIEW LEADERBOARD
              </Link>
            </div>

          </div>
        </div>
      </div>

      {/* ═══ BOTTOM URL BAR ═══ */}
      <div className="fixed bottom-6 left-8 z-50 text-xs tracking-[3px] text-orange-500/40" style={{ fontFamily: "'Courier New', monospace" }}>
        🔗 <span className="text-orange-500/70 font-bold">yieldverse.io/event</span>
      </div>

      {/* ═══ ANIMATIONS ═══ */}
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 1; }
        }
        @keyframes pulseRing {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        @keyframes boltPulse {
          0%, 100% { filter: drop-shadow(0 0 30px rgba(255,200,0,0.8)) drop-shadow(0 0 60px rgba(255,165,0,0.4)); }
          50% { filter: drop-shadow(0 0 50px rgba(255,220,0,1)) drop-shadow(0 0 100px rgba(255,165,0,0.7)); }
        }
        @keyframes streakMove {
          0% { transform: translateX(-100%); opacity: 0; }
          5% { opacity: 1; }
          95% { opacity: 1; }
          100% { transform: translateX(calc(100vw + 100%)); opacity: 0; }
        }
        body { overflow-x: hidden; }
      `}</style>
    </div>
  )
}
