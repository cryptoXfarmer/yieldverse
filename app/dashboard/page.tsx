'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Globe, Zap, Fuel, Coins, DollarSign, LogOut, 
  Rocket, Star, ArrowRight, RefreshCw, User,
  TrendingUp, Calendar, ExternalLink, Wallet, Gift, Shield,
  MessageCircle, Send, X, Trophy, Clock, Flame
} from 'lucide-react'
import { supabase, User as UserType } from '@/lib/supabase'

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center animate-spin-slow">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400">Loading your universe...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      {/* Stars */}
      <div className="stars">
        {mounted && [...Array(60)].map((_, i) => (
          <div
            key={i}
            className="star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
      <div className="nebula" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              YIELDVERSE
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Admin Button - Only for admins */}
            {user?.email && ADMIN_EMAILS.includes(user.email) && (
              <Link
                href="/admin"
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-red-400">Admin</span>
              </Link>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* News Ticker */}
      {mounted && newsItems.length > 0 && (
        <div className="fixed top-[73px] left-0 right-0 z-40 bg-gradient-to-r from-purple-900/90 via-cyan-900/90 to-purple-900/90 border-b border-cyan-500/30 overflow-hidden">
          <div className="news-ticker py-2">
            <div className="news-ticker-content">
              {[...newsItems, ...newsItems].map((item, i) => (
                <span key={i} className="mx-8 text-sm whitespace-nowrap">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 pt-32 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user?.username || 'Pilot'}</h1>
                <p className="text-gray-400">{user?.email}</p>
              </div>
            </div>
            <p className="text-gray-500 text-sm mt-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          {/* ═══ EVENT BANNER ═══ */}
          {activeEvent && (
            <Link href="/event" className="block mb-8 group">
              <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-r from-yellow-900/40 via-orange-900/30 to-red-900/40 p-5 transition-all group-hover:border-yellow-400/70 group-hover:brightness-110">
                {/* Animated fire particles */}
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

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm border-2 stat-energy rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <span className="text-gray-400 text-sm">Total Energy</span>
              </div>
              <p className="text-3xl font-bold text-yellow-400">
                {formatNumber(user?.total_energy_earned || 0)}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border-2 stat-fuel rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Fuel className="w-6 h-6 text-orange-400" />
                </div>
                <span className="text-gray-400 text-sm">Total Fuel</span>
              </div>
              <p className="text-3xl font-bold text-orange-400">
                {formatNumber(user?.total_fuel_earned || 0)}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border-2 stat-yes rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-gray-400 text-sm">YES Tokens</span>
              </div>
              <p className="text-3xl font-bold text-cyan-400 yes-glow">
                {formatNumber(user?.total_yes_earned || 0)}
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-sm border-2 stat-usd rounded-2xl p-6 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <span className="text-gray-400 text-sm">Total Cashout</span>
              </div>
              <p className="text-3xl font-bold text-green-400">
                ${(user?.total_cashout_usd || 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Current Wallet + Pool */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Current Wallet */}
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Current Wallet
              </h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-400">{formatNumber(wallet?.energy || 0)}</p>
                  <p className="text-gray-400 text-sm">Energy</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-400">{formatNumber(wallet?.fuel || 0)}</p>
                  <p className="text-gray-400 text-sm">Fuel</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-400">{formatNumber(wallet?.yes_tokens || 0)}</p>
                  <p className="text-gray-400 text-sm">YES</p>
                </div>
              </div>
              {/* Convert Button */}
              <button
                onClick={() => setShowConvert(true)}
                disabled={(wallet?.fuel || 0) < 100}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-cyan-500 rounded-xl font-bold hover:from-orange-600 hover:to-cyan-600 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Flame className="w-5 h-5" />
                Convert Fuel → YES
              </button>
              {(wallet?.fuel || 0) < 100 && (
                <p className="text-center text-gray-500 text-xs mt-2">Need at least 100 Fuel to convert</p>
              )}
            </div>

            {/* FaucetPay Pool */}
            <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 backdrop-blur-sm border border-green-500/30 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-400" />
                Pool Balance (LTC)
              </h2>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">
                  {faucetPayBalance !== null ? formatLTC(faucetPayBalance) : '---'} LTC
                </p>
                <p className="text-gray-400 text-sm mt-1">Available for cashouts</p>
                <Link 
                  href="/cashout"
                  className="mt-4 inline-flex items-center gap-2 px-6 py-2 bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Cashout
                </Link>
              </div>
            </div>
          </div>

          {/* Planets Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-400" />
                My Planets
              </h2>
              <Link 
                href="/planets"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            {planets.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400 mb-4">You don&apos;t have any planets yet!</p>
                <Link 
                  href="/planets"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                  <Gift className="w-5 h-5" />
                  Claim Free Planet
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {planets.slice(0, 4).map((planet) => (
                  <Link 
                    key={planet.id} 
                    href={`/planet?id=${planet.id}`}
                    className="bg-black/30 rounded-xl p-4 text-center hover:bg-black/50 transition-colors group"
                  >
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 group-hover:scale-110 transition-transform" />
                    <p className="font-bold text-sm truncate">{planet.name}</p>
                    <p className="text-xs text-gray-500 mb-2">{planet.rarity}</p>
                    <span className="text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      🔍 Explore →
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Games Section */}
          <h2 className="text-2xl font-bold mb-4">Your Games</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Energy Empire - LIEN CORRIGÉ */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm border-2 border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 energy-glow flex items-center justify-center">
                    <Zap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-yellow-400">Energy Empire</h3>
                    <span className="text-xs px-2 py-1 bg-green-500 rounded-full">LIVE</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-4">Click, craft fuel, and dominate the energy cosmos!</p>
              
              <a 
                href="https://www.energy-empire.space"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold hover:from-yellow-600 hover:to-orange-600 transition-all flex items-center justify-center gap-2"
              >
                <Rocket className="w-5 h-5" />
                Play Now
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* StarForge PTC */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-sm border-2 border-blue-500/30 rounded-2xl p-6 hover:border-blue-500 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 planet-glow flex items-center justify-center animate-spin-slow">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-blue-400">StarForge PTC</h3>
                    <span className="text-xs px-2 py-1 bg-yellow-500 text-black rounded-full">COMING SOON</span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-4">Watch ads, complete tasks, earn stars!</p>
              
              <button 
                disabled
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-bold opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                Coming Soon
              </button>
            </div>
          </div>

          {/* Quick Info */}
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-1">Conversion Rate</p>
              <p className="text-lg font-bold">100 Fuel = 1 YES</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-1">Cashout Rate</p>
              <p className="text-lg font-bold">1000 YES = 0.001 LTC</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 text-center">
              <p className="text-gray-400 text-sm mb-1">Min Cashout</p>
              <p className="text-lg font-bold">100 YES (0.0001 LTC)</p>
            </div>
          </div>

          {/* AADS Banner */}
          <div className="mt-6 rounded-xl overflow-hidden border border-white/10 bg-white/5">
            <iframe
              data-aa="2426378"
              src="//acceptable.a-ads.com/2426378/?size=Adaptive"
              style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: '0 auto' }}
              title="Ad"
            />
          </div>

        </div>
      </div>

      {/* ═══ FUEL → YES CONVERSION MODAL ═══ */}
      {showConvert && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-cyan-500/30 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Convert Fuel → YES</h3>
                  <p className="text-xs text-gray-400">100 Fuel = 1 YES Token</p>
                </div>
              </div>
              <button onClick={() => { setShowConvert(false); setConvertSuccess('') }} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
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

      {/* ═══ SOS FLOATING BUTTON ═══ */}
      <button
        onClick={() => setShowSOS(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 rounded-full shadow-lg shadow-red-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        title="Need help? Send a message!"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* ═══ SOS MODAL ═══ */}
      {showSOS && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Need Help?</h3>
                  <p className="text-xs text-gray-400">Send a message to the team</p>
                </div>
              </div>
              <button onClick={() => { setShowSOS(false); setSosSent(false) }} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
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
    </div>
  )
}
