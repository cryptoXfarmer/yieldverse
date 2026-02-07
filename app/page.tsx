'use client'

import { Rocket, Zap, Star, Globe, Coins, ArrowRight, Sparkles, User, Shield, TrendingUp, Gift } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import AnimatedPlanet from '@/components/AnimatedPlanet'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="relative min-h-screen">
      {/* Background layers */}
      <div className="stars">
        {mounted && [...Array(80)].map((_, i) => (
          <div key={i}
            className={`star ${i < 8 ? 'large' : ''}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              '--dur': `${2.5 + Math.random() * 3}s`,
              '--delay': `${Math.random() * 4}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="nebula" />
      <div className="grid-overlay" />
      <div className="scan-line" />

      {/* ═══ NAVIGATION ═══ */}
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center planet-glow">
              <Globe className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-lg font-bold gradient-text-main" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              YIELDVERSE
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/help" className="btn-ghost px-5 py-2.5 text-sm">Help</Link>
            <Link href="/login" className="btn-ghost px-5 py-2.5 text-sm">Login</Link>
            <Link href="/register" className="btn-primary px-5 py-2.5 text-sm">Register</Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-20">
        {/* ═══════════════════════════════════════
             HERO SECTION
           ═══════════════════════════════════════ */}
        <section className="min-h-[92vh] flex items-center justify-center px-4">
          <div className="max-w-5xl mx-auto text-center hero-enter">
            {/* Planet logo */}
            <div className="flex justify-center mb-8">
              <div className="relative animate-float">
                <AnimatedPlanet
                  rarity="legendary"
                  sheetIndex={0}
                  visualType={4}
                  size={140}
                />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-5 tracking-tight" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              <span className="gradient-text-main">YIELDVERSE</span>
            </h1>
            <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-glow-cyan text-cyan-400 mb-4" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              The YES Metaverse
            </p>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Play cosmic games. Earn YES tokens. Cashout real crypto. The future of play-to-earn is here.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/register" className="btn-primary px-10 py-4 text-lg rounded-2xl">
                <Rocket className="w-5 h-5" />
                Start Your Journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="btn-ghost px-10 py-4 text-lg rounded-2xl">
                <User className="w-5 h-5" />
                Already a Pilot?
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {[
                { value: '2', label: 'Active Games', color: 'purple' },
                { value: '∞', label: 'YES Tokens', color: 'cyan' },
                { value: '24/7', label: 'Play & Earn', color: 'pink' },
                { value: '100%', label: 'Free to Play', color: 'gold' },
              ].map((s, i) => (
                <div key={i} className={`glass-card p-5 reveal reveal-d${i + 1}`}>
                  <div className={`text-3xl font-black mb-1 text-${
                    s.color === 'purple' ? 'purple-400' :
                    s.color === 'cyan' ? 'cyan-400' :
                    s.color === 'pink' ? 'pink-400' : 'yellow-400'
                  }`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {s.value}
                  </div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
             GAMES SECTION
           ═══════════════════════════════════════ */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="section-label">EXPLORE</p>
              <h2 className="text-4xl md:text-5xl font-black gradient-text-gold" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                The Universe Awaits
              </h2>
              <p className="text-gray-500 mt-3 text-lg">Choose your adventure across the cosmos</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Energy Empire */}
              <div className="game-card energy-empire group">
                <div className="absolute top-4 right-4">
                  <span className="badge badge-live">● LIVE</span>
                </div>

                {/* Ambient glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-yellow-500/8 rounded-full blur-3xl" />

                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 energy-glow flex items-center justify-center mb-5">
                    <Zap className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-3xl font-black text-yellow-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    Energy Empire
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Click to generate energy, craft fuel, activate autoclickers and dominate the energy cosmos!
                  </p>

                  <div className="space-y-1 mb-6">
                    <div className="feature-item"><div className="dot bg-yellow-400" /><span>Click & earn energy</span></div>
                    <div className="feature-item"><div className="dot bg-purple-400" /><span>Craft rare fuel resources</span></div>
                    <div className="feature-item"><div className="dot bg-cyan-400" /><span>Convert 100 Fuel = 1 YES</span></div>
                  </div>

                  <a href="https://www.energy-empire.space" target="_blank" rel="noopener noreferrer" className="btn-gold w-full py-3.5 text-base rounded-xl">
                    <Rocket className="w-5 h-5" /> Play Now <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* StarForge */}
              <div className="game-card starforge group">
                <div className="absolute top-4 right-4">
                  <span className="badge badge-soon">COMING SOON</span>
                </div>

                <div className="absolute -top-20 -left-20 w-48 h-48 bg-purple-500/8 rounded-full blur-3xl" />

                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 planet-glow flex items-center justify-center mb-5 animate-spin-slow">
                    <Star className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-3xl font-black text-blue-400 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    StarForge PTC
                  </h3>
                  <p className="text-gray-400 mb-6 leading-relaxed">
                    Watch ads, complete tasks, forge your stellar fortune in the cosmic economy!
                  </p>

                  <div className="space-y-1 mb-6">
                    <div className="feature-item"><div className="dot bg-blue-400" /><span>Watch rewarded ads</span></div>
                    <div className="feature-item"><div className="dot bg-purple-400" /><span>Complete daily tasks</span></div>
                    <div className="feature-item"><div className="dot bg-cyan-400" /><span>Convert 500 Stars = 1 YES</span></div>
                  </div>

                  <button disabled className="btn-primary w-full py-3.5 text-base rounded-xl opacity-40 cursor-not-allowed">
                    <Star className="w-5 h-5" /> Coming Soon
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
             HOW IT WORKS
           ═══════════════════════════════════════ */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="section-label">SYSTEM</p>
              <h2 className="text-4xl md:text-5xl font-black gradient-text-cyan" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                How It Works
              </h2>
              <p className="text-gray-500 mt-3 text-lg">Three steps to cosmic wealth</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
              {[
                { num: '1', title: 'Play Games', desc: 'Choose your game and start earning in-game resources. Click, farm, and dominate!', gradient: 'from-purple-600 to-blue-600', color: 'purple-400', borderColor: 'rgba(124,58,237,0.3)' },
                { num: '2', title: 'Convert to YES', desc: 'Exchange your game resources for universal YES tokens across the metaverse.', gradient: 'from-cyan-600 to-blue-600', color: 'cyan-400', borderColor: 'rgba(0,240,255,0.3)' },
                { num: '3', title: 'Cashout Crypto', desc: 'Convert YES tokens to Litecoin and withdraw to your wallet. Real money, real fast!', gradient: 'from-pink-600 to-purple-600', color: 'pink-400', borderColor: 'rgba(244,114,182,0.3)' },
              ].map((step, i) => (
                <div key={i} className="text-center glass-card p-8 reveal" style={{ animationDelay: `${0.1 + i * 0.15}s` }}>
                  <div className="flex justify-center mb-6">
                    <div
                      className={`step-circle bg-gradient-to-br ${step.gradient} text-white`}
                      style={{ borderColor: step.borderColor }}
                    >
                      {step.num}
                    </div>
                  </div>
                  <h3 className={`text-xl font-bold mb-3 text-${step.color}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
             FEATURES
           ═══════════════════════════════════════ */}
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="section-label">FEATURES</p>
              <h2 className="text-4xl md:text-5xl font-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                <span className="text-white">Why </span>
                <span className="gradient-text-main">YieldVerse</span>
                <span className="text-white">?</span>
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: <Shield className="w-5 h-5" />, title: 'Instant Payouts', desc: 'Cashout to LTC via FaucetPay in seconds.', color: 'emerald' },
                { icon: <Gift className="w-5 h-5" />, title: '100% Free to Play', desc: 'No investment needed. Start earning today.', color: 'purple' },
                { icon: <TrendingUp className="w-5 h-5" />, title: 'Daily Streak Rewards', desc: 'Claim up to 67 YES per week, per game.', color: 'orange' },
                { icon: <Sparkles className="w-5 h-5" />, title: 'Multiple Games', desc: 'Diverse games, one token economy.', color: 'cyan' },
                { icon: <Coins className="w-5 h-5" />, title: 'Low Min Cashout', desc: 'Just 10 YES ($0.01) to withdraw.', color: 'gold' },
                { icon: <Globe className="w-5 h-5" />, title: 'Referral Program', desc: 'Earn 10% of your friends\' rewards.', color: 'pink' },
              ].map((f, i) => {
                const colors: Record<string, string> = {
                  emerald: 'rgba(16,185,129,', purple: 'rgba(124,58,237,', orange: 'rgba(249,115,22,',
                  cyan: 'rgba(0,240,255,', gold: 'rgba(251,191,36,', pink: 'rgba(244,114,182,'
                }
                const c = colors[f.color] || colors.cyan
                return (
                  <div key={i} className="glass-card p-6 group" style={{ borderColor: `${c}0.1)` }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors"
                      style={{ background: `${c}0.12)`, color: `${c}1)` }}>
                      {f.icon}
                    </div>
                    <h4 className="font-bold mb-1.5">{f.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════
             CTA
           ═══════════════════════════════════════ */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative glass-strong p-12 md:p-16 text-center overflow-hidden" style={{ borderColor: 'rgba(0,240,255,0.2)' }}>
              {/* Ambient */}
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

              <div className="relative">
                <h2 className="text-3xl md:text-4xl font-black mb-4 text-glow-cyan text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  Ready to Join?
                </h2>
                <p className="text-lg text-gray-400 mb-8 max-w-lg mx-auto">
                  Start your cosmic journey today. Play, earn, and prosper in the YieldVerse metaverse!
                </p>
                <Link href="/register" className="btn-cyan px-12 py-4 text-lg rounded-2xl">
                  <Rocket className="w-5 h-5" />
                  Launch into YieldVerse
                  <Sparkles className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="py-10 px-4 border-t" style={{ borderColor: 'var(--border-dim)' }}>
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Globe className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm font-bold gradient-text-main" style={{ fontFamily: 'Orbitron, sans-serif' }}>YIELDVERSE</span>
            </div>
            <div className="flex gap-6 justify-center flex-wrap mb-4">
              <a href="https://energy-empire.space" target="_blank" rel="noopener noreferrer" className="text-gray-600 text-sm hover:text-yellow-400 transition-colors">⚡ Energy Empire</a>
              <Link href="/news" className="text-gray-600 text-sm hover:text-cyan-400 transition-colors">📰 News</Link>
              <a href="https://x.com/Crypto_FarmerX" target="_blank" rel="noopener noreferrer" className="text-gray-600 text-sm hover:text-cyan-400 transition-colors">𝕏 Twitter</a>
              <a href="https://www.facebook.com/profile.php?id=61586569664260" target="_blank" rel="noopener noreferrer" className="text-gray-600 text-sm hover:text-blue-400 transition-colors">📘 Facebook</a>
            </div>
            <p className="text-xs text-gray-700">© 2026 YieldVerse Metaverse. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
