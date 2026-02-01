'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Globe, Zap, Fuel, Coins, DollarSign, LogOut, 
  Rocket, Star, ArrowRight, RefreshCw, User,
  TrendingUp, Calendar, ExternalLink, Wallet, Gift, Shield
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

  useEffect(() => {
    setMounted(true)
    loadUserData()
    loadFaucetPayBalance()
    loadRecentActivity()
  }, [])

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
              <div className="grid grid-cols-3 gap-4">
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

        </div>
      </div>
    </div>
  )
}
