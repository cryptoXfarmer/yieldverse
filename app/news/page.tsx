'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { Globe, Rocket, ArrowRight, Zap, Shield, Target, Heart, ChevronDown, ExternalLink } from 'lucide-react'

const SOCIAL = {
  x: 'https://x.com/Crypto_FarmerX',
  fb: 'https://www.facebook.com/profile.php?id=61586569664260',
  tiktok: 'https://www.tiktok.com/@yesmetaverse',
  youtube: 'https://www.youtube.com/@YesMetaverse',
}

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(40px)',
      transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
    }}>{children}</div>
  )
}

function ConfettiParticles() {
  const colors = ['#00f0ff','#ff00ea','#ffe600','#39ff14','#ff6b00','#a855f7','#f43f5e']
  const ps = Array.from({ length: 50 }, (_, i) => ({
    id: i, left: Math.random()*100, color: colors[Math.floor(Math.random()*colors.length)],
    size: Math.random()*8+4, dur: Math.random()*4+3, delay: Math.random()*6,
    drift: (Math.random()-0.5)*80, type: Math.floor(Math.random()*3),
  }))
  return (
    <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
      {ps.map(p => (
        <div key={p.id} className="absolute top-[-20px]" style={{
          left:`${p.left}%`, width: p.type===2?`${p.size*0.3}px`:`${p.size}px`,
          height:`${p.size}px`, background: p.color, borderRadius: p.type===1?'50%':'2px',
          opacity:0.9, animation:`confetti-fall ${p.dur}s linear infinite`,
          animationDelay:`${p.delay}s`, '--drift':`${p.drift}px`,
        } as React.CSSProperties} />
      ))}
    </div>
  )
}

function FloatingEmojis() {
  const emojis = ['🎉','🥳','💰','🚀','⚡','💎','🔥','🎊','🤑','✨','🌟','💸']
  const items = Array.from({ length: 14 }, (_, i) => ({
    id: i, emoji: emojis[Math.floor(Math.random()*emojis.length)],
    left: Math.random()*100, size: Math.random()*16+20,
    dur: Math.random()*6+5, delay: Math.random()*8, rot: (Math.random()-0.5)*720,
  }))
  return (<>{items.map(e => (
    <div key={e.id} className="fixed z-[1] pointer-events-none" style={{
      left:`${e.left}%`, fontSize:`${e.size}px`, opacity:0,
      animation:`emoji-float-up ${e.dur}s ease-out infinite`,
      animationDelay:`${e.delay}s`, '--rot':`${e.rot}deg`,
    } as React.CSSProperties}>{e.emoji}</div>
  ))}</>)
}

export default function NewsPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="relative min-h-screen">
      <div className="stars">
        {mounted && [...Array(120)].map((_, i) => (
          <div key={i} className="star" style={{ left:`${Math.random()*100}%`, top:`${Math.random()*100}%`, animationDelay:`${Math.random()*3}s`, animationDuration:`${2+Math.random()*2}s` }} />
        ))}
      </div>
      <div className="nebula" />
      {mounted && <ConfettiParticles />}
      {mounted && <FloatingEmojis />}

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">YIELDVERSE</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="px-5 py-2 border border-cyan-400/50 rounded-full hover:bg-cyan-400/10 transition-colors text-sm">Dashboard</Link>
            <Link href="/register" className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full hover:opacity-90 transition-opacity text-sm font-bold">Play Now</Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 pt-20">

        {/* ═══════ HERO ═══════ */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 text-center relative">
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#090a0f] to-transparent z-10 pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-cyan-400/30 mb-8"
            style={{ background:'linear-gradient(135deg,rgba(0,240,255,0.08),rgba(255,0,234,0.08))', animation:'fadeSlideIn 0.8s ease-out 0.3s both' }}>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-cyan-400 text-xs font-mono tracking-[3px] uppercase">February 2026 Update</span>
          </div>

          <p className="text-xl md:text-2xl text-gray-300 mb-4" style={{ animation:'fadeSlideIn 0.8s ease-out 0.5s both' }}>
            We&apos;ve got something big for you 🎉
          </p>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-2 leading-[0.95]" style={{ animation:'fadeSlideIn 1s ease-out 0.7s both' }}>
            <span className="block bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,240,255,0.3)]">CASH OUT</span>
            <span className="block text-[1.15em] mt-1" style={{ color:'#ffe600', textShadow:'0 0 40px rgba(255,230,0,0.4),0 0 80px rgba(255,230,0,0.15)' }}>$0.01</span>
          </h1>

          <p className="text-base md:text-lg text-gray-400 max-w-xl leading-relaxed mb-10" style={{ animation:'fadeSlideIn 0.8s ease-out 0.9s both' }}>
            We just lowered the minimum cashout to <strong className="text-green-400 font-bold">just 10 YES tokens</strong>.<br />
            Your grind pays off faster. Your first payout is closer than ever.
          </p>

          {/* Price Card */}
          <div className="relative mb-10" style={{ animation:'fadeSlideIn 1.2s ease-out 1.1s both' }}>
            <div className="relative overflow-hidden p-8 md:p-10 text-center border-2 border-transparent"
              style={{ background:'linear-gradient(135deg,rgba(0,240,255,0.06),rgba(255,0,234,0.06),rgba(255,230,0,0.04))', borderImage:'linear-gradient(135deg,#00f0ff,#ff00ea,#ffe600) 1' }}>
              <div className="absolute inset-[-2px] -z-10 blur-[15px] opacity-30"
                style={{ background:'linear-gradient(135deg,#00f0ff,#ff00ea,#ffe600,#00f0ff)', backgroundSize:'300% 300%', animation:'gradientShift 4s linear infinite' }} />
              <p className="font-mono text-lg text-gray-500 line-through decoration-red-500 decoration-[3px] mb-1">Old minimum: 100 YES ($0.10)</p>
              <p className="text-3xl my-2" style={{ animation:'bounceArrow 1s ease-in-out infinite' }}>⬇️</p>
              <p className="text-5xl md:text-7xl font-black leading-tight"
                style={{ background:'linear-gradient(135deg,#39ff14,#ffe600)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', filter:'drop-shadow(0 0 25px rgba(57,255,20,0.4))' }}>
                10 YES
              </p>
              <p className="font-mono text-sm text-gray-500 tracking-wide mt-1">= 0.00001 LTC ≈ $0.01</p>
              <span className="inline-block mt-4 px-4 py-1.5 bg-green-400 text-black font-extrabold text-xs tracking-wider uppercase"
                style={{ animation:'tagPulse 2s ease-in-out infinite' }}>🔥 LOWEST CASHOUT EVER</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-center" style={{ animation:'fadeSlideIn 0.8s ease-out 1.3s both' }}>
            <Link href="/dashboard" className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-lg hover:scale-105 transition-transform inline-flex items-center gap-2">
              <Rocket className="w-5 h-5" />Start Earning Now<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="https://energy-empire.space" target="_blank" rel="noopener noreferrer" className="px-8 py-4 border-2 border-white/20 rounded-full font-bold text-lg hover:border-cyan-400 hover:text-cyan-400 transition-all inline-flex items-center gap-2">
              <Zap className="w-5 h-5" />Play Energy Empire
            </a>
          </div>

          <div className="absolute bottom-28 z-20" style={{ animation:'bounceArrow 2s ease-in-out infinite' }}>
            <ChevronDown className="w-6 h-6 text-gray-500" />
          </div>
        </section>

        {/* ═══════ WHY THIS MATTERS ═══════ */}
        <section className="py-20 px-4">
          <Reveal className="text-center mb-16">
            <p className="text-cyan-400 font-mono text-xs tracking-[4px] uppercase mb-3">Why This Matters</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Built for Real Players</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-lg mx-auto">We&apos;re not here to waste your time. We want you to see real crypto in your wallet — fast.</p>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: <Zap className="w-8 h-8 text-green-400" />, title:'Instant Proof', desc:'Cash out 10 YES and see real LTC hit your FaucetPay within 24h. No tricks, no hidden fees.', border:'border-green-500/30', hover:'hover:border-green-500' },
              { icon: <Target className="w-8 h-8 text-cyan-400" />, title:'Grind Smarter', desc:'Lower threshold = cash out more often. See your progress, stay motivated, build your stack.', border:'border-cyan-500/30', hover:'hover:border-cyan-500' },
              { icon: <Heart className="w-8 h-8 text-pink-400" />, title:'Trust First', desc:'We earn your trust by paying you first. No massive minimums. Your YES, your choice.', border:'border-pink-500/30', hover:'hover:border-pink-500' },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i*150}>
                <div className={`bg-white/5 backdrop-blur-sm border ${c.border} ${c.hover} rounded-2xl p-8 transition-all card-hover h-full`}>
                  <div className="w-16 h-16 rounded-xl bg-white/5 flex items-center justify-center mb-5">{c.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{c.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{c.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════ HOW IT WORKS ═══════ */}
        <section className="py-20 px-4">
          <Reveal className="text-center mb-16">
            <p className="text-cyan-400 font-mono text-xs tracking-[4px] uppercase mb-3">3 Simple Steps</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Click → Earn → Cash Out</span>
            </h2>
          </Reveal>
          <div className="max-w-2xl mx-auto flex flex-col">
            {[
              { num:'1', icon:'⚡', title:'Play Energy Empire', desc:<>Click to mine energy, discover rare resources at <span className="text-green-400 font-semibold">energy-empire.space</span>. Every click earns Fuel.</> },
              { num:'2', icon:'🔄', title:'Convert to YES Tokens', desc:<>Convert your Fuel into <span className="text-green-400 font-semibold">YES tokens</span> — the universal currency of the metaverse.</> },
              { num:'3', icon:'💰', title:'Cash Out to LTC', desc:<>With just <span className="text-green-400 font-semibold">10 YES</span>, cash out real Litecoin to your FaucetPay. Zero fees.</> },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i*150}>
                <div className="grid grid-cols-[60px_1fr] gap-5 py-8 relative">
                  {i<2 && <div className="absolute left-[29px] top-[68px] bottom-0 w-[2px] bg-gradient-to-b from-cyan-500/30 to-transparent" />}
                  <div className="w-[60px] h-[60px] flex items-center justify-center font-black text-xl text-cyan-400 border-2 border-cyan-400/30 bg-cyan-400/5 flex-shrink-0">{s.num}</div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{s.icon} {s.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══════ BEFORE VS NOW ═══════ */}
        <section className="py-20 px-4">
          <Reveal className="text-center mb-12">
            <p className="text-cyan-400 font-mono text-xs tracking-[4px] uppercase mb-3">The Change</p>
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Before vs. Now</span>
            </h2>
          </Reveal>
          <Reveal>
            <div className="max-w-2xl mx-auto border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
              <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
                <div className="p-4 text-xs font-mono tracking-wider uppercase text-gray-500" />
                <div className="p-4 text-xs font-mono tracking-wider uppercase text-gray-500 text-center">Before</div>
                <div className="p-4 text-xs font-mono tracking-wider uppercase text-gray-500 text-center">Now</div>
              </div>
              {[['Minimum YES','100 YES','10 YES ✅'],['USD Value','$0.10','$0.01 ✅'],['Time to Payout','Days','Hours ✅'],['Processing','24h','Under 24h ✅'],['Fees','None','Still None ✅']].map(([l,o,n],i) => (
                <div key={i} className="grid grid-cols-3 border-b border-white/5 last:border-b-0">
                  <div className="p-4 text-sm text-gray-400">{l}</div>
                  <div className="p-4 text-sm text-red-400/60 line-through text-center">{o}</div>
                  <div className="p-4 text-sm text-green-400 font-bold text-center">{n}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ═══════ TRUST BANNER ═══════ */}
        <section className="py-20 px-4">
          <Reveal>
            <div className="max-w-3xl mx-auto text-center relative overflow-hidden rounded-3xl p-12 md:p-16"
              style={{ background:'linear-gradient(135deg,rgba(57,255,20,0.05),rgba(0,240,255,0.05))', border:'1px solid rgba(57,255,20,0.15)' }}>
              <div className="absolute inset-[-50%] -z-10" style={{ background:'conic-gradient(from 0deg,transparent,rgba(57,255,20,0.03),transparent,rgba(0,240,255,0.03),transparent)', animation:'slowSpin 15s linear infinite' }} />
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-3xl md:text-5xl font-bold mb-4">We Believe <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">In You</span></h2>
              <p className="text-gray-400 max-w-md mx-auto leading-relaxed mb-8 text-base md:text-lg">
                Most platforms set high minimums to keep your earnings locked. We&apos;re different. We want you to see your first payout ASAP — because once you know it&apos;s real, you&apos;ll never look back.
              </p>
              <Link href="/dashboard" className="group px-8 py-4 bg-gradient-to-r from-green-600 to-cyan-600 rounded-full font-bold text-lg hover:scale-105 transition-transform inline-flex items-center gap-2">
                💎 Claim Your First Payout<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ═══════ FINAL CTA ═══════ */}
        <section className="py-20 px-4 text-center">
          <Reveal>
            <p className="text-5xl mb-6 animate-float">🎮 ⚡ 💰</p>
            <h2 className="text-4xl md:text-6xl font-black mb-4">
              Ready to<br /><span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Get Paid?</span>
            </h2>
            <p className="text-lg text-gray-400 mb-8">Join 25+ pilots already earning real crypto in the YieldVerse.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/dashboard" className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-full font-bold text-lg hover:scale-105 transition-transform inline-flex items-center gap-2">
                <Rocket className="w-5 h-5" />Play Now — It&apos;s Free<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href={SOCIAL.x} target="_blank" rel="noopener noreferrer" className="px-8 py-4 border-2 border-white/20 rounded-full font-bold text-lg hover:border-cyan-400 hover:text-cyan-400 transition-all inline-flex items-center gap-2">
                🐦 Follow on X
              </a>
              <a href={SOCIAL.fb} target="_blank" rel="noopener noreferrer" className="px-8 py-4 border-2 border-white/20 rounded-full font-bold text-lg hover:border-blue-400 hover:text-blue-400 transition-all inline-flex items-center gap-2">
                📘 Follow on Facebook
              </a>
            </div>
          </Reveal>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="py-12 px-4 border-t border-gray-800">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">Yield<span className="text-cyan-400">Verse</span> 🌍</span>
            </div>
            <p className="text-gray-500 text-sm mb-4">The Free Play-to-Earn Metaverse — Earn Real Crypto, Zero Investment.</p>
            <div className="flex gap-6 justify-center flex-wrap mb-4">
              <Link href="/" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">Home</Link>
              <a href="https://energy-empire.space" target="_blank" rel="noopener noreferrer" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors inline-flex items-center gap-1">Energy Empire<ExternalLink className="w-3 h-3" /></a>
              <a href={SOCIAL.x} target="_blank" rel="noopener noreferrer" className="text-gray-500 text-sm hover:text-cyan-400 transition-colors">🐦 Twitter / X</a>
              <a href={SOCIAL.fb} target="_blank" rel="noopener noreferrer" className="text-gray-500 text-sm hover:text-blue-400 transition-colors">📘 Facebook</a>
              <a href={SOCIAL.tiktok} target="_blank" rel="noopener noreferrer" className="text-gray-500 text-sm hover:text-pink-400 transition-colors">🎵 TikTok</a>
              <a href={SOCIAL.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-500 text-sm hover:text-red-400 transition-colors">📺 YouTube</a>
            </div>
            <p className="text-gray-700 text-xs">© 2026 YieldVerse Metaverse. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
