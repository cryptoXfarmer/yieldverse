'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, RefreshCw, Users, Coins, Zap, 
  TrendingUp, Gift, Award, Crown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAILS = ['gtrust1985@gmail.com']

export default function AdminReferralsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalEarningsEnergy: 0,
    totalEarningsRare: 0,
    totalEarningsFuel: 0,
    totalEarningsYes: 0,
    eventPoolTotal: 0
  })
  
  const [referrals, setReferrals] = useState<any[]>([])
  const [commissions, setCommissions] = useState<any[]>([])

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) { router.push('/login'); return }
      if (!ADMIN_EMAILS.includes(session.user.email || '')) { router.push('/dashboard'); return }

      setIsAdmin(true)
      await loadAllData(session.user.id)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async (adminId: string) => {
    setRefreshing(true)
    try {
      // Charger mes stats de referral
      const { data: myStats } = await supabase
        .from('users')
        .select('total_referrals, ref_earnings_energy, ref_earnings_rare, ref_earnings_fuel, ref_earnings_yes')
        .eq('email', ADMIN_EMAILS[0])
        .single()

      // Charger mes referrals
      const { data: myReferrals } = await supabase
        .from('users')
        .select('id, username, email, created_at, total_energy_earned, total_yes_earned, total_cashout_usd')
        .eq('referred_by', adminId)
        .order('created_at', { ascending: false })

      // Charger l'event pool
      const { data: poolData } = await supabase
        .from('event_pool')
        .select('amount_yes')

      const poolTotal = poolData?.reduce((sum, p) => sum + parseFloat(p.amount_yes || 0), 0) || 0

      // Charger les dernières commissions
      const { data: recentCommissions } = await supabase
        .from('referral_commissions')
        .select('*, users!referral_commissions_referred_id_fkey(username)')
        .eq('referrer_id', adminId)
        .order('created_at', { ascending: false })
        .limit(20)

      setStats({
        totalReferrals: myStats?.total_referrals || myReferrals?.length || 0,
        totalEarningsEnergy: myStats?.ref_earnings_energy || 0,
        totalEarningsRare: myStats?.ref_earnings_rare || 0,
        totalEarningsFuel: myStats?.ref_earnings_fuel || 0,
        totalEarningsYes: myStats?.ref_earnings_yes || 0,
        eventPoolTotal: poolTotal
      })

      setReferrals(myReferrals || [])
      setCommissions(recentCommissions || [])

    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toLocaleString()
  }

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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              <span className="text-xl font-bold">Alpha Referrals</span>
            </div>
          </div>
          <button 
            onClick={() => checkAdminAndLoad()}
            disabled={refreshing}
            className="p-2 hover:bg-gray-700 rounded-lg"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-4">
            <Users className="w-6 h-6 text-purple-400 mb-2" />
            <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            <p className="text-sm text-gray-400">Total Referrals</p>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-4">
            <Zap className="w-6 h-6 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold text-yellow-400">{formatNumber(stats.totalEarningsEnergy)}</p>
            <p className="text-sm text-gray-400">Energy Earned</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 border border-orange-500/30 rounded-xl p-4">
            <Gift className="w-6 h-6 text-orange-400 mb-2" />
            <p className="text-2xl font-bold text-orange-400">{formatNumber(stats.totalEarningsFuel)}</p>
            <p className="text-sm text-gray-400">Fuel Earned</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-900/30 to-cyan-900/30 border border-green-500/30 rounded-xl p-4">
            <Coins className="w-6 h-6 text-green-400 mb-2" />
            <p className="text-2xl font-bold text-green-400">{formatNumber(stats.totalEarningsYes)}</p>
            <p className="text-sm text-gray-400">YES Earned</p>
          </div>
        </div>

        {/* Event Pool */}
        <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold">Event Pool</h2>
          </div>
          <p className="text-3xl font-bold text-cyan-400">{formatNumber(stats.eventPoolTotal)} YES</p>
          <p className="text-sm text-gray-400 mt-1">2% de chaque cashout • Pour events spéciaux</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          
          {/* Referrals List */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              My Referrals ({referrals.length})
            </h3>
            
            {referrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No referrals yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
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

          {/* Recent Commissions */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Recent Commissions
            </h3>
            
            {commissions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No commissions yet</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {commissions.map((com) => (
                  <div key={com.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{com.users?.username || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 capitalize">{com.commission_type} • {com.resource_type}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${
                        com.resource_type === 'energy' ? 'text-yellow-400' :
                        com.resource_type === 'fuel' ? 'text-orange-400' :
                        com.resource_type === 'yes' ? 'text-green-400' :
                        'text-purple-400'
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
        <div className="mt-8 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
          <p className="text-yellow-400 text-sm">
            <strong>Alpha Referral System:</strong> Tu reçois 10% de chaque Claim (Energy, Rare, Fuel) et 3% de chaque Cashout (YES). 
            2% des cashouts vont dans l'Event Pool pour des événements spéciaux.
          </p>
        </div>
      </div>
    </div>
  )
}
