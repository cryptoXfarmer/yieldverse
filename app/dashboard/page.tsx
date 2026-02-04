'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Globe, Zap, Fuel, Coins, DollarSign, LogOut, 
  Rocket, Star, ArrowRight, RefreshCw, User,
  TrendingUp, Calendar, ExternalLink, Wallet, Gift, Shield,
  MessageCircle, Send, X, Trophy, Clock, Flame, ArrowRightLeft
} from 'lucide-react'
import { supabase, User as UserType } from '@/lib/supabase'
import DailyStreak from '@/components/DailyStreak'
import StarForgeBridge from '@/components/StarForgeBridge'

const ADMIN_EMAILS = ['gtrust1985@gmail.com']

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<UserType | null>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [planets, setPlanets] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [faucetPayBalance, setFaucetPayBalance] = useState<number | null>(null)
  const [newsItems, setNewsItems] = useState<string[]>([])
  
  // SOS Support
  const [showSOS, setShowSOS] = useState(false)
  const [sosMessage, setSosMessage] = useState('')
  const [sendingSOS, setSendingSOS] = useState(false)
  const [sosSent, setSosSent] = useState(false)

  // Fuel → YES Conversion
  const [showConvert, setShowConvert] = useState(false)
  const [convertAmount, setConvertAmount] = useState('')
  const [converting, setConverting] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState('')

  // Cashout Notification
  const [showCashoutNotif, setShowCashoutNotif] = useState(false)

  // Event
  const [activeEvent, setActiveEvent] = useState<any>(null)
  const [eventCountdown, setEventCountdown] = useState('')
  const [eventPhase, setEventPhase] = useState<'upcoming' | 'active' | 'ended' | null>(null)

  useEffect(() => {
    setMounted(true)
    loadUserData()
    loadFaucetPayBalance()
    loadRecentActivity()
    loadActiveEvent()
  }, [])

  // Cashout promo notification — show after 10s
  useEffect(() => {
    const dismissed = sessionStorage.getItem('cashout_notif_dismissed')
    if (dismissed) return
    const timer = setTimeout(() => setShowCashoutNotif(true), 10000)
    return () => clearTimeout(timer)
  }, [])

  // Event countdown timer
  useEffect(() => {
    if (!activeEvent) return
    const timer = setInterval(() => {
      const now = Date.now()
      const start = new Date(activeEvent.starts_at).getTime()
      const end = new Date(activeEvent.ends_at).getTime()
      if (now < start) {
        setEventPhase('upcoming')
        const ms = start - now
        const d = Math.floor(ms / 86400000)
        const h = Math.floor((ms % 86400000) / 3600000)
        const m = Math.floor((ms % 3600000) / 60000)
        const s = Math.floor((ms % 60000) / 1000)
        setEventCountdown(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
      } else if (now < end) {
        setEventPhase('active')
        const ms = end - now
        const d = Math.floor(ms / 86400000)
        const h = Math.floor((ms % 86400000) / 3600000)
        const m = Math.floor((ms % 3600000) / 60000)
        const s = Math.floor((ms % 60000) / 1000)
        setEventCountdown(d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`)
      } else {
        setEventPhase('ended')
        setEventCountdown('Ended!')
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [activeEvent])

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Load user profile
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!userError) setUser(userData)

      // Load wallet
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (!walletError) setWallet(walletData)

      // Load planets
      const { data: planetsData } = await supabase
        .from('planets')
        .select('*')
        .eq('user_id', session.user.id)

      setPlanets(planetsData || [])

    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFaucetPayBalance = async () => {
    try {
      const response = await fetch('/api/faucetpay/balance')
      const data = await response.json()
      if (data.success) {
        setFaucetPayBalance(data.balance)
      }
    } catch (err) {
      console.error('Error loading FaucetPay balance:', err)
    }
  }

  const loadRecentActivity = async () => {
    try {
      const news: string[] = []
      
      // Get recent cashouts - PRIORITY for credibility!
      const { data: cashouts } = await supabase
        .from('cashouts')
        .select('amount, faucetpay_email, created_at, status')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10)
      
      cashouts?.forEach(c => {
        const email = c.faucetpay_email.split('@')[0].slice(0, 4) + '***'
        const ltcAmount = (c.amount * 100 / 100000000).toFixed(8)
        news.push(`💰 ${email} cashed out ${c.amount} YES (${ltcAmount} LTC)!`)
      })

      // Get recent users
      const { data: users } = await supabase
        .from('users')
        .select('username, created_at')
        .order('created_at', { ascending: false })
        .limit(5)
      
      users?.forEach(u => {
        news.push(`🚀 ${u.username} joined YieldVerse!`)
      })

      // Get recent planets
      const { data: planets } = await supabase
        .from('planets')
        .select('name, rarity, users(username)')
        .order('created_at', { ascending: false })
        .limit(3)
      
      planets?.forEach((p: any) => {
        const rarityEmoji = p.rarity === 'legendary' ? '🌟' : p.rarity === 'epic' ? '💜' : p.rarity === 'rare' ? '💙' : '⚪'
        news.push(`${rarityEmoji} ${p.users?.username || 'Pilot'} discovered ${p.name}!`)
      })

      // Get recent tile discoveries (non-empty only)
      const { data: recentTiles } = await supabase
        .from('tiles')
        .select('type, level, bonus, planets(name, users(username))')
        .eq('discovered', true)
        .neq('type', 'empty')
        .neq('type', 'hq')
        .limit(8)

      recentTiles?.forEach((t: any) => {
        const planetName = t.planets?.name || 'Unknown'
        const username = t.planets?.users?.username || 'Pilot'
        const tileInfo: Record<string, { emoji: string; label: string }> = {
          energy: { emoji: '⚡', label: 'Energy Vein' },
          crystal: { emoji: '💎', label: 'Crystal Formation' },
          factory: { emoji: '🏭', label: 'Ancient Factory' },
          artifact: { emoji: '⭐', label: 'RARE Artifact' },
        }
        const info = tileInfo[t.type]
        if (info) {
          news.push(`${info.emoji} ${username} found ${info.label} on ${planetName}!`)
        }
      })

      // Shuffle and set
      const shuffled = news.sort(() => Math.random() - 0.5)
      setNewsItems(shuffled.length > 0 ? shuffled : [
        '🚀 Welcome to YieldVerse!',
        '⚡ Play Energy Empire to earn YES tokens!',
        '🪐 Discover planets and boost your earnings!',
        '💰 Instant cashouts via FaucetPay!'
      ])
    } catch (err) {
      console.error('Error loading activity:', err)
      setNewsItems([
        '🚀 Welcome to YieldVerse!',
        '⚡ Play Energy Empire to earn YES tokens!',
        '🪐 Discover planets and boost your earnings!',
        '💰 Instant cashouts via FaucetPay!'
      ])
    }
  }

  const loadActiveEvent = async () => {
    try {
      const { data } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'active'])
        .order('starts_at', { ascending: false })
        .limit(1)
      if (data && data.length > 0) setActiveEvent(data[0])
    } catch {}
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadUserData()
    await loadFaucetPayBalance()
    setRefreshing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const sendSOS = async () => {
    if (!user || !sosMessage.trim() || sendingSOS) return
    setSendingSOS(true)
    try {
      await supabase.from('support_tickets').insert({
        user_id: user.id,
        username: user.username,
        email: user.email,
        message: sosMessage.trim(),
      })
      setSosSent(true)
      setSosMessage('')
      setTimeout(() => {
        setShowSOS(false)
        setSosSent(false)
      }, 2000)
    } catch (err) {
      console.error('SOS error:', err)
    } finally {
      setSendingSOS(false)
    }
  }

  const handleConvertFuel = async () => {
    const amount = parseInt(convertAmount)
    if (!amount || amount < 1 || !wallet || !user) return
    
    const fuelNeeded = amount * 100
    if (fuelNeeded > (wallet?.fuel || 0)) return
    
    setConverting(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Update wallet: subtract fuel, add YES
      const { error: walletError } = await supabase
        .from('wallets')
        .update({
          fuel: (wallet.fuel || 0) - fuelNeeded,
          yes_tokens: (wallet.yes_tokens || 0) + amount
        })
        .eq('user_id', session.user.id)

      if (walletError) throw walletError

      // Update user totals
      await supabase
        .from('users')
        .update({
          total_yes_earned: (user.total_yes_earned || 0) + amount
        })
        .eq('id', session.user.id)

      // Log the conversion for referral commissions
      try {
        await supabase.from('referral_commissions').insert({
          referrer_id: user.referred_by || user.id,
          referred_id: user.id,
          activity_type: 'fuel_to_yes',
          amount: amount,
          commission_rate: 0.05,
          commission_amount: Math.floor(amount * 0.05)
        })
      } catch (_) {} // Silent fail if no referrer

      setConvertSuccess(`Converted ${fuelNeeded} Fuel → ${amount} YES!`)
      setConvertAmount('')
      
      // Refresh data
      await loadUserData()
      
      setTimeout(() => {
        setConvertSuccess('')
        setShowConvert(false)
      }, 2000)
    } catch (err) {
      console.error('Convert error:', err)
    } finally {
      setConverting(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

  const formatLTC = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(4)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <div className="text-center">
          <div className="planet-hero w-16 h-16 mx-auto mb-5 flex items-center justify-center">
            <Globe className="w-7 h-7 text-white/60" />
          </div>
          <p className="text-gray-500 text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>Loading your universe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Background layers */}
      <div className="stars">
        {mounted && [...Array(60)].map((_, i) => (
          <div key={i} className={`star ${i < 6 ? 'large' : ''}`}
            style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, '--dur': `${2.5 + Math.random() * 3}s`, '--delay': `${Math.random() * 4}s` } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="nebula" />
      <div className="grid-overlay" />

      {/* ═══ NAVIGATION ═══ */}
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center planet-glow">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold gradient-text-main" style={{ fontFamily: 'Orbitron, sans-serif' }}>YIELDVERSE</span>
          </Link>
          
          <div className="flex items-center gap-3">
            {user?.email && ADMIN_EMAILS.includes(user.email) && (
              <Link href="/admin" className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors text-xs font-bold text-red-400">
                <Shield className="w-3.5 h-3.5" /> Admin
              </Link>
            )}
            <button onClick={handleRefresh} disabled={refreshing} className="p-2 rounded-lg hover:bg-white/5 transition-colors" title="Refresh">
              <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium hover:bg-white/5 transition-colors" style={{ borderColor: 'var(--border-dim)', color: 'var(--text-secondary)' }}>
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      </nav>

      {/* News Ticker */}
      {mounted && newsItems.length > 0 && (
        <div className="fixed top-[53px] left-0 right-0 z-40 border-b overflow-hidden" style={{ background: 'rgba(5,5,16,0.9)', borderColor: 'var(--border-dim)' }}>
          <div className="news-ticker py-1.5">
            <div className="news-ticker-content">
              {[...newsItems, ...newsItems].map((item, i) => (
                <span key={i} className="mx-8 text-xs whitespace-nowrap">{item}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Welcome */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border flex items-center justify-center" style={{ borderColor: 'var(--border-subtle)' }}>
                <User className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black" style={{ fontFamily: 'Orbitron, sans-serif' }}>{user?.username || 'Pilot'}</h1>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Daily Streak */}
          {user?.id && (
            <div className="mb-6">
              <DailyStreak userId={user.id} />
            </div>
          )}

          {/* Event Banner */}
          {activeEvent && (
            <Link href="/event" className="block mb-8 group">
              <div className="game-card energy-empire p-5 transition-all group-hover:brightness-110" style={{ borderColor: 'rgba(251,191,36,0.25)' }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-2xl" />
                
                <div className="relative flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/30">
                      <Trophy className="w-7 h-7 text-black" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-lg">{activeEvent.name}</h3>
                        {eventPhase === 'active' && (
                          <span className="px-2 py-0.5 bg-green-500 text-black text-xs font-bold rounded-full animate-pulse">LIVE</span>
                        )}
                        {eventPhase === 'upcoming' && (
                          <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded-full">SOON</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-300">Top 5 earn prizes! 🥇 250 YES 🥈 150 YES 🥉 100 YES</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      {eventPhase === 'upcoming' ? 'Starts in' : eventPhase === 'active' ? 'Ends in' : ''}
                    </p>
                    <p className="text-xl font-mono font-black text-yellow-400">{eventCountdown}</p>
                    <p className="text-xs text-cyan-400 mt-1 group-hover:underline">View Leaderboard →</p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* ═══ STATS ═══ */}
          <p className="section-label">LIFETIME STATS</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="stat-card energy">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.1)' }}>
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Total Energy</span>
              </div>
              <p className="text-2xl font-black text-yellow-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {formatNumber(user?.total_energy_earned || 0)}
              </p>
            </div>
            <div className="stat-card fuel">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.1)' }}>
                  <Fuel className="w-5 h-5 text-orange-400" />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Total Fuel</span>
              </div>
              <p className="text-2xl font-black text-orange-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {formatNumber(user?.total_fuel_earned || 0)}
              </p>
            </div>
            <div className="stat-card yes">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,240,255,0.1)' }}>
                  <Coins className="w-5 h-5 text-cyan-400" />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Total YES</span>
              </div>
              <p className="text-2xl font-black text-cyan-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                {formatNumber(user?.total_yes_earned || 0)}
              </p>
            </div>
            <div className="stat-card usd">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Cashed Out</span>
              </div>
              <p className="text-2xl font-black text-emerald-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                ${(user?.total_cashout_usd || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* ═══ WALLET + POOL ═══ */}
          <div className="grid md:grid-cols-2 gap-5 mb-8">
            <div className="glass-card p-5" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Current Wallet</h2>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-xl font-black text-yellow-400">{formatNumber(wallet?.energy || 0)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>Energy</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-xl font-black text-orange-400">{formatNumber(wallet?.fuel || 0)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>Fuel</p>
                </div>
                <div className="text-center p-3 rounded-xl" style={{ background: 'var(--bg-card)' }}>
                  <p className="text-xl font-black text-cyan-400">{formatNumber(wallet?.yes_tokens || 0)}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>YES</p>
                </div>
              </div>
              <button onClick={() => setShowConvert(true)} disabled={(wallet?.fuel || 0) < 100}
                className="btn-gold w-full py-3 text-sm rounded-xl disabled:opacity-30 disabled:cursor-not-allowed">
                <Flame className="w-4 h-4" /> Convert Fuel → YES
              </button>
              {(wallet?.fuel || 0) < 100 && (
                <p className="text-center text-xs mt-2" style={{ color: 'var(--text-dim)' }}>Need at least 100 Fuel</p>
              )}
            </div>

            <div className="glass-card p-5" style={{ borderColor: 'rgba(16,185,129,0.15)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Pool Balance</h2>
              </div>
              <div className="text-center py-2">
                <p className="text-3xl font-black text-emerald-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  {faucetPayBalance !== null ? formatLTC(faucetPayBalance) : '---'} LTC
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Available for cashouts</p>
                <Link href="/cashout" className="btn-emerald mt-4 px-6 py-2.5 text-sm rounded-xl">
                  <DollarSign className="w-4 h-4" /> Cashout
                </Link>
              </div>
            </div>
          </div>

          {/* ═══ PLANETS ═══ */}
          <div className="glass-card p-5 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>My Planets</h2>
              </div>
              <Link href="/planets" className="text-cyan-400 text-xs hover:underline flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            {planets.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-10 h-10 mx-auto mb-3 text-gray-700" />
                <p className="text-sm mb-3" style={{ color: 'var(--text-dim)' }}>No planets yet!</p>
                <Link href="/planets" className="btn-primary px-5 py-2.5 text-sm rounded-xl">
                  <Gift className="w-4 h-4" /> Claim Free Planet
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {planets.slice(0, 4).map((planet) => (
                  <Link key={planet.id} href={`/planet?id=${planet.id}`}
                    className="rounded-xl p-4 text-center group transition-all hover:bg-white/5" style={{ background: 'var(--bg-card)' }}>
                    <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 group-hover:scale-110 transition-transform planet-glow" />
                    <p className="font-bold text-xs truncate">{planet.name}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{planet.rarity}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ═══ GAMES ═══ */}
          <p className="section-label mt-2">YOUR GAMES</p>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="game-card energy-empire">
              <div className="absolute -top-16 -right-16 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 energy-glow flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-yellow-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>Energy Empire</h3>
                      <span className="badge badge-live text-[10px]">● LIVE</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-4">Click, craft fuel, and dominate the energy cosmos!</p>
                <a href="https://www.energy-empire.space" target="_blank" rel="noopener noreferrer"
                  className="btn-gold w-full py-3 text-sm rounded-xl">
                  <Rocket className="w-4 h-4" /> Play Now <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="game-card starforge">
              <div className="absolute -top-16 -left-16 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-purple-500 planet-glow flex items-center justify-center">
                      <Star className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-400" style={{ fontFamily: 'Orbitron, sans-serif' }}>StarForge</h3>
                      <span className="badge badge-soon text-[10px]">IN DEV</span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-500 text-sm mb-4">Space exploration strategy game — in development!</p>
                <a href="https://spaceforge.live" target="_blank" rel="noopener noreferrer" className="btn-primary w-full py-3 text-sm rounded-xl flex items-center justify-center gap-2 opacity-60">
                  <Rocket className="w-4 h-4" /> Coming Soon
                </a>
              </div>
            </div>
          </div>

          {/* ═══ STARFORGE BRIDGE ═══ */}
          {user && (
            <div className="mt-5 grid md:grid-cols-2 gap-5">
              <StarForgeBridge userId={user.id} wallet={wallet} onRefresh={handleRefresh} />
              <div className="glass-card p-5" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <ArrowRightLeft className="w-4 h-4 text-purple-400" />
                  <h2 className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Cross-Game Economy</h2>
                </div>
                <div className="space-y-2 text-[11px]">
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                    <span className="text-cyan-400">🚀→🌐</span>
                    <span className="text-gray-400 flex-1">StarForge YES → YieldVerse YES</span>
                    <span className="text-cyan-400 font-bold">1:1</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                    <span className="text-yellow-400">🌐→🚀</span>
                    <span className="text-gray-400 flex-1">500 YV Energy → 100 SF Resource</span>
                    <span className="text-yellow-400 font-bold">5:1</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                    <span className="text-orange-400">🌐→🚀</span>
                    <span className="text-gray-400 flex-1">100 YV Fuel → 50 SF Resource</span>
                    <span className="text-orange-400 font-bold">2:1</span>
                  </div>
                </div>
                <p className="text-[9px] text-gray-600 mt-3 text-center">Open Trade Terminal in StarForge to transfer</p>
              </div>
            </div>
          )}

          {/* ═══ QUICK INFO ═══ */}
          <div className="mt-8 grid md:grid-cols-3 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] mb-1" style={{ color: 'var(--text-dim)' }}>Conversion Rate</p>
              <p className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>100 Fuel = 1 YES</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] mb-1" style={{ color: 'var(--text-dim)' }}>Cashout Rate</p>
              <p className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>1000 YES = 0.001 LTC</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-[10px] mb-1" style={{ color: 'var(--text-dim)' }}>Min Cashout</p>
              <p className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>10 YES ($0.01)</p>
            </div>
          </div>

          {/* AADS Banner */}
          <div className="mt-6 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-dim)', background: 'var(--bg-card)' }}>
            <iframe data-aa="2426378" src="//acceptable.a-ads.com/2426378/?size=Adaptive"
              style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: '0 auto' }}
              title="Ad" />
          </div>

        </div>
      </div>

      {/* ═══ FUEL → YES CONVERSION MODAL ═══ */}
      {showConvert && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-dim)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>Convert Fuel → YES</h3>
                  <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>100 Fuel = 1 YES Token</p>
                </div>
              </div>
              <button onClick={() => { setShowConvert(false); setConvertSuccess('') }} className="p-2 rounded-lg hover:bg-white/5"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {convertSuccess ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Coins className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="text-green-400 font-bold text-lg">{convertSuccess}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Balance display */}
                  <div className="bg-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Your Fuel Balance</span>
                      <span className="text-orange-400 font-bold text-lg">{formatNumber(wallet?.fuel || 0)} Fuel</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-400 text-sm">Max convertible</span>
                      <span className="text-cyan-400 font-bold">{Math.floor((wallet?.fuel || 0) / 100)} YES</span>
                    </div>
                  </div>

                  {/* Input */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">YES to receive</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max={Math.floor((wallet?.fuel || 0) / 100)}
                        value={convertAmount}
                        onChange={(e) => setConvertAmount(e.target.value)}
                        placeholder="Amount of YES"
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        onClick={() => setConvertAmount(String(Math.floor((wallet?.fuel || 0) / 100)))}
                        className="px-4 py-3 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 font-bold hover:bg-cyan-500/30"
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Preview */}
                  {convertAmount && parseInt(convertAmount) > 0 && (
                    <div className="bg-gradient-to-r from-orange-900/30 to-cyan-900/30 rounded-xl p-4 border border-orange-500/20">
                      <div className="flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-orange-400 font-bold text-xl">{formatNumber(parseInt(convertAmount) * 100)}</p>
                          <p className="text-gray-400 text-xs">Fuel spent</p>
                        </div>
                        <ArrowRight className="w-6 h-6 text-gray-500" />
                        <div className="text-center">
                          <p className="text-cyan-400 font-bold text-xl">{convertAmount}</p>
                          <p className="text-gray-400 text-xs">YES received</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Convert button */}
                  <button
                    onClick={handleConvertFuel}
                    disabled={converting || !convertAmount || parseInt(convertAmount) < 1 || (parseInt(convertAmount) * 100) > (wallet?.fuel || 0)}
                    className="w-full py-4 bg-gradient-to-r from-orange-500 to-cyan-500 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {converting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Flame className="w-5 h-5" />
                        Convert Now
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ SOS BUTTON ═══ */}
      <button onClick={() => setShowSOS(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 hover:brightness-110 rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="Need help?">
        <MessageCircle className="w-5 h-5 text-white" />
      </button>

      {/* ═══ SOS MODAL ═══ */}
      {showSOS && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border-dim)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>Need Help?</h3>
                  <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Send a message to the team</p>
                </div>
              </div>
              <button onClick={() => { setShowSOS(false); setSosSent(false) }} className="p-2 rounded-lg hover:bg-white/5"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {sosSent ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-3">✅</div>
                  <p className="text-green-400 font-bold text-lg">Message Sent!</p>
                  <p className="text-gray-400 text-sm mt-1">We&apos;ll get back to you soon.</p>
                </div>
              ) : (
                <>
                  <textarea
                    value={sosMessage}
                    onChange={(e) => setSosMessage(e.target.value)}
                    placeholder="Describe your issue or question..."
                    rows={4}
                    maxLength={500}
                    className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-sm resize-none focus:border-orange-500 focus:outline-none transition-colors placeholder-gray-500"
                  />
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-gray-500">{sosMessage.length}/500</p>
                    <button
                      onClick={sendSOS}
                      disabled={!sosMessage.trim() || sendingSOS}
                      className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 hover:brightness-110 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
                    >
                      {sendingSOS ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ CASHOUT PROMO NOTIFICATION ═══ */}
      {showCashoutNotif && (
        <div className="fixed bottom-6 right-6 z-[999] animate-bounce-in" style={{ animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-cyan-500/30 rounded-2xl p-5 shadow-2xl shadow-cyan-500/10 max-w-sm">
            {/* Close */}
            <button 
              onClick={() => { setShowCashoutNotif(false); sessionStorage.setItem('cashout_notif_dismissed', '1') }}
              className="absolute top-2 right-2 text-gray-600 hover:text-white transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Glow accent */}
            <div className="absolute -top-1 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded-full" />
            
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-green-500/20 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💸</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm mb-1">📢 New: Lower Cashout Minimum!</p>
                <p className="text-gray-400 text-xs leading-relaxed">
                  We've lowered the minimum cashout to just <span className="text-cyan-400 font-bold">10 YES</span> tokens (<span className="text-green-400 font-bold">$0.01</span>)! 
                  It's now easier than ever to withdraw your earnings instantly via FaucetPay.
                </p>
                <Link href="/cashout" 
                  onClick={() => { setShowCashoutNotif(false); sessionStorage.setItem('cashout_notif_dismissed', '1') }}
                  className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-gradient-to-r from-cyan-500 to-green-500 hover:brightness-110 rounded-lg text-xs font-bold text-black transition-all"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  Cashout Now
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          0% { transform: translateY(30px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
