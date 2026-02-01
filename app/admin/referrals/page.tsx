'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, RefreshCw, Users, Coins, Zap, Fuel, Gem,
  TrendingUp, Gift, Award, Crown, Copy, CheckCircle,
  ArrowDownToLine, Trophy, Clock, ChevronDown, ChevronUp,
  Sparkles, ExternalLink, Star
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAILS = ['gtrust1985@gmail.com']

const COMMISSION_RATES = [
  { activity: 'Energy Clicks', rate: '5%', resource: 'Energy', icon: '⚡', color: 'text-yellow-400' },
  { activity: 'Rare Drops', rate: '5%', resource: 'Rare', icon: '💎', color: 'text-purple-400' },
  { activity: 'Craft / Forge', rate: '10%', resource: 'Fuel', icon: '🔥', color: 'text-orange-400' },
  { activity: 'Shop Purchases', rate: '5%', resource: 'Rare', icon: '🛒', color: 'text-purple-400' },
  { activity: 'Energy→Fuel Swap', rate: '10%', resource: 'Fuel', icon: '🔄', color: 'text-orange-400' },
  { activity: 'Cashout (YES)', rate: '3%', resource: 'YES', icon: '💰', color: 'text-green-400' },
]

export default function AdminReferralsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [adminId, setAdminId] = useState<string>('')

  // Pending (claimable)
  const [pending, setPending] = useState({ energy: 0, rare: 0, fuel: 0 })
  // Lifetime totals
  const [lifetime, setLifetime] = useState({ energy: 0, rare: 0, fuel: 0, yes: 0 })

  const [stats, setStats] = useState({
    totalReferrals: 0,
    eventPoolTotal: 0,
  })

  const [referrals, setReferrals] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])
  const [copied, setCopied] = useState(false)
  const [claiming, setClaiming] = useState<string | null>(null)
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null)
  const [showRates, setShowRates] = useState(false)

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      if (!ADMIN_EMAILS.includes(session.user.email || '')) { router.push('/dashboard'); return }

      setIsAdmin(true)
      setAdminId(session.user.id)
      await loadAllData(session.user.id)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async (uid?: string) => {
    const userId = uid || adminId
    if (!userId) return
    setRefreshing(true)
    try {
      // My user data with ref fields
      const { data: myUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (myUser) {
        setPending({
          energy: myUser.ref_pending_energy || 0,
          rare: myUser.ref_pending_rare || 0,
          fuel: myUser.ref_pending_fuel || 0,
        })
        setLifetime({
          energy: (myUser.ref_total_claimed_energy || 0) + (myUser.ref_pending_energy || 0),
          rare: (myUser.ref_total_claimed_rare || 0) + (myUser.ref_pending_rare || 0),
          fuel: (myUser.ref_total_claimed_fuel || 0) + (myUser.ref_pending_fuel || 0),
          yes: myUser.ref_earnings_yes || 0,
        })
        setStats(s => ({ ...s, totalReferrals: myUser.total_referrals || 0 }))
      }

      // My referrals
      const { data: myReferrals } = await supabase
        .from('users')
        .select('id, username, email, created_at, total_energy_earned, total_yes_earned, total_cashout_usd')
        .eq('referred_by', userId)
        .order('created_at', { ascending: false })

      setReferrals(myReferrals || [])
      if (myReferrals) setStats(s => ({ ...s, totalReferrals: myReferrals.length }))

      // Event pool
      const { data: poolData } = await supabase
        .from('event_pool')
        .select('amount_yes')

      const poolTotal = poolData?.reduce((sum, p) => sum + parseFloat(p.amount_yes || 0), 0) || 0
      setStats(s => ({ ...s, eventPoolTotal: poolTotal }))

      // Recent commissions
      const { data: recentCommissions } = await supabase
        .from('referral_commissions')
        .select('*, users!referral_commissions_referred_id_fkey(username)')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)

      setCommissions(recentCommissions || [])

    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const handleClaim = async (resource: 'energy' | 'rare' | 'fuel' | 'all') => {
    if (!adminId) return
    setClaiming(resource)
    setClaimSuccess(null)

    try {
      const res = await fetch('/api/referrals/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: adminId, resource })
      })
      const data = await res.json()

      if (data.success) {
        setClaimSuccess(resource)
        if (resource === 'all' || resource === 'energy') setPending(p => ({ ...p, energy: 0 }))
        if (resource === 'all' || resource === 'rare') setPending(p => ({ ...p, rare: 0 }))
        if (resource === 'all' || resource === 'fuel') setPending(p => ({ ...p, fuel: 0 }))
        setTimeout(() => {
          setClaimSuccess(null)
          loadAllData()
        }, 2000)
      }
    } catch (err) {
      console.error('Claim error:', err)
    } finally {
      setClaiming(null)
    }
  }

  const copyRefLink = () => {
    navigator.clipboard.writeText('https://yieldverse.io/register')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return Math.floor(num).toLocaleString()
  }

  const totalPending = pending.energy + pending.rare + pending.fuel

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-800/80 backdrop-blur border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              <span className="text-xl font-bold">Alpha Ref Panel</span>
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">ADMIN ONLY</span>
            </div>
          </div>
          <button
            onClick={() => loadAllData()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ═══ ALPHA REF LINK ═══ */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 border border-cyan-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold">Alpha Registration Link</h2>
            <span className="text-xs text-gray-500">(All signups → your ref)</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 truncate font-mono">
              https://yieldverse.io/register
            </div>
            <button
              onClick={copyRefLink}
              className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                copied ? 'bg-green-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'
              }`}
            >
              {copied ? <><CheckCircle className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
          </div>
        </div>

        {/* ═══ PENDING EARNINGS — CLAIM ZONE ═══ */}
        <div className="bg-gradient-to-br from-yellow-900/20 via-orange-900/20 to-red-900/20 border-2 border-yellow-500/40 rounded-2xl p-6 relative overflow-hidden">
          {totalPending > 0 && (
            <div className="absolute top-3 right-3">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
            </div>
          )}

          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold text-yellow-400">Pending Earnings</h2>
          </div>
          <p className="text-gray-500 text-xs mb-5">Commission from referral activity — claim when you want</p>

          {/* 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {/* Energy */}
            <div className="bg-black/30 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-sm text-gray-400">Energy</span>
              </div>
              <p className={`text-2xl font-bold text-yellow-400 mb-3 ${pending.energy > 0 ? 'animate-pulse' : ''}`}>
                {formatNumber(pending.energy)}
              </p>
              <button
                onClick={() => handleClaim('energy')}
                disabled={pending.energy === 0 || claiming !== null}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1
                  ${pending.energy > 0 ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
              >
                {claiming === 'energy' ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : claimSuccess === 'energy' ? <><CheckCircle className="w-4 h-4" /> Claimed!</>
                  : <><ArrowDownToLine className="w-4 h-4" /> Claim ⚡</>}
              </button>
            </div>

            {/* Rare */}
            <div className="bg-black/30 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gem className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-400">Rare</span>
              </div>
              <p className={`text-2xl font-bold text-purple-400 mb-3 ${pending.rare > 0 ? 'animate-pulse' : ''}`}>
                {formatNumber(pending.rare)}
              </p>
              <button
                onClick={() => handleClaim('rare')}
                disabled={pending.rare === 0 || claiming !== null}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1
                  ${pending.rare > 0 ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
              >
                {claiming === 'rare' ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : claimSuccess === 'rare' ? <><CheckCircle className="w-4 h-4" /> Claimed!</>
                  : <><ArrowDownToLine className="w-4 h-4" /> Claim 💎</>}
              </button>
            </div>

            {/* Fuel */}
            <div className="bg-black/30 border border-orange-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="w-5 h-5 text-orange-400" />
                <span className="text-sm text-gray-400">Fuel</span>
              </div>
              <p className={`text-2xl font-bold text-orange-400 mb-3 ${pending.fuel > 0 ? 'animate-pulse' : ''}`}>
                {formatNumber(pending.fuel)}
              </p>
              <button
                onClick={() => handleClaim('fuel')}
                disabled={pending.fuel === 0 || claiming !== null}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1
                  ${pending.fuel > 0 ? 'bg-orange-500 hover:bg-orange-600 text-black' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
              >
                {claiming === 'fuel' ? <RefreshCw className="w-4 h-4 animate-spin" />
                  : claimSuccess === 'fuel' ? <><CheckCircle className="w-4 h-4" /> Claimed!</>
                  : <><ArrowDownToLine className="w-4 h-4" /> Claim 🔥</>}
              </button>
            </div>
          </div>

          {/* CLAIM ALL */}
          <button
            onClick={() => handleClaim('all')}
            disabled={totalPending === 0 || claiming !== null}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2
              ${totalPending > 0
                ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:from-yellow-600 hover:via-orange-600 hover:to-red-600 text-black shadow-lg shadow-orange-500/20'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
          >
            {claiming === 'all' ? <RefreshCw className="w-5 h-5 animate-spin" />
              : claimSuccess === 'all' ? <><CheckCircle className="w-5 h-5" /> All Claimed! 🎉</>
              : <><Trophy className="w-5 h-5" /> CLAIM ALL ({formatNumber(totalPending)} total)</>}
          </button>
        </div>

        {/* ═══ LIFETIME STATS ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-4 text-center">
            <Users className="w-5 h-5 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            <p className="text-xs text-gray-500">Referrals</p>
          </div>
          <div className="bg-gray-800 border border-yellow-500/20 rounded-xl p-4 text-center">
            <Zap className="w-5 h-5 mx-auto mb-2 text-yellow-400" />
            <p className="text-2xl font-bold text-yellow-400">{formatNumber(lifetime.energy)}</p>
            <p className="text-xs text-gray-500">Lifetime ⚡</p>
          </div>
          <div className="bg-gray-800 border border-purple-500/20 rounded-xl p-4 text-center">
            <Gem className="w-5 h-5 mx-auto mb-2 text-purple-400" />
            <p className="text-2xl font-bold text-purple-400">{formatNumber(lifetime.rare)}</p>
            <p className="text-xs text-gray-500">Lifetime 💎</p>
          </div>
          <div className="bg-gray-800 border border-orange-500/20 rounded-xl p-4 text-center">
            <Fuel className="w-5 h-5 mx-auto mb-2 text-orange-400" />
            <p className="text-2xl font-bold text-orange-400">{formatNumber(lifetime.fuel)}</p>
            <p className="text-xs text-gray-500">Lifetime 🔥</p>
          </div>
          <div className="bg-gray-800 border border-green-500/20 rounded-xl p-4 text-center">
            <Coins className="w-5 h-5 mx-auto mb-2 text-green-400" />
            <p className="text-2xl font-bold text-green-400">{formatNumber(lifetime.yes)}</p>
            <p className="text-xs text-gray-500">Lifetime YES</p>
          </div>
        </div>

        {/* ═══ EVENT POOL ═══ */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-bold">Event Pool</h2>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{formatNumber(stats.eventPoolTotal)} YES</p>
          <p className="text-sm text-gray-500 mt-1">2% de chaque cashout • Pour events spéciaux en Beta</p>
        </div>

        {/* ═══ COMMISSION RATES ═══ */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowRates(!showRates)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="font-bold">Commission Rates</span>
            </div>
            {showRates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {showRates && (
            <div className="px-4 pb-4">
              <div className="space-y-2">
                {COMMISSION_RATES.map((r, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-900 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{r.icon}</span>
                      <span className="text-sm text-gray-300">{r.activity}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${r.color}`}>{r.rate}</span>
                      <span className="text-xs text-gray-500">{r.resource}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-gray-600 text-xs mt-3 text-center">
                Commissions s&apos;accumulent quand les filleuls jouent à Energy Empire
              </p>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ═══ MY REFERRALS ═══ */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-cyan-400" />
              My Referrals ({referrals.length})
            </h3>

            {referrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No referrals yet</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                    <div>
                      <p className="font-medium">{ref.username}</p>
                      <p className="text-xs text-gray-500">{ref.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400 text-sm">{formatNumber(ref.total_energy_earned || 0)} ⚡</p>
                      <p className="text-green-400 text-sm">{ref.total_yes_earned || 0} YES</p>
                      <p className="text-xs text-gray-500">{new Date(ref.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ COMMISSION LOG ═══ */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Commission Log
              {commissions.length > 0 && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                  {commissions.length}
                </span>
              )}
            </h3>

            {commissions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                <p className="text-gray-500">No commissions yet</p>
                <p className="text-gray-600 text-xs mt-1">They&apos;ll appear as referrals play</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {commissions.map((com) => (
                  <div key={com.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{com.users?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 capitalize">{com.commission_type} • {com.resource_type}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        com.resource_type === 'energy' ? 'text-yellow-400' :
                        com.resource_type === 'rare' ? 'text-purple-400' :
                        com.resource_type === 'fuel' ? 'text-orange-400' :
                        'text-green-400'
                      }`}>
                        +{formatNumber(com.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{new Date(com.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-400 text-sm">
            <strong>🤫 Alpha Mode:</strong> Toutes les inscriptions tombent sous ton ref. Les commissions s&apos;accumulent automatiquement quand tes filleuls jouent à Energy Empire. 
            En Beta, le Referral Hub sera ouvert à tous les joueurs.
          </p>
        </div>

      </div>
    </div>
  )
}
