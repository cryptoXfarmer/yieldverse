'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, RefreshCw, Users, Coins, DollarSign, 
  Wallet, Globe, Zap, TrendingUp, Shield, CheckCircle,
  Clock, Activity, BarChart3
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAILS = ['gtrust1985@gmail.com']

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEnergy: 0,
    totalFuel: 0,
    totalYes: 0,
    totalCashoutUsd: 0,
    totalPlanets: 0,
    pendingCashouts: 0,
    completedCashouts: 0
  })
  
  const [faucetPayBalance, setFaucetPayBalance] = useState<number | null>(null)
  const [recentCashouts, setRecentCashouts] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      if (!ADMIN_EMAILS.includes(session.user.email || '')) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await loadAllData()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadAllData = async () => {
    setRefreshing(true)
    await Promise.all([
      loadStats(),
      loadFaucetPayBalance(),
      loadRecentCashouts(),
      loadRecentUsers()
    ])
    setRefreshing(false)
  }

  const loadStats = async () => {
    try {
      // Total users
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
      
      // Total from users table
      const { data: usersData } = await supabase.from('users').select('total_energy_earned, total_fuel_earned, total_yes_earned, total_cashout_usd')
      
      let totalEnergy = 0, totalFuel = 0, totalYes = 0, totalCashout = 0
      usersData?.forEach(u => {
        totalEnergy += u.total_energy_earned || 0
        totalFuel += u.total_fuel_earned || 0
        totalYes += u.total_yes_earned || 0
        totalCashout += u.total_cashout_usd || 0
      })

      // Total planets
      const { count: planetsCount } = await supabase.from('planets').select('*', { count: 'exact', head: true })
      
      // Cashouts stats
      const { data: cashouts } = await supabase.from('cashouts').select('status')
      const pending = cashouts?.filter(c => c.status === 'pending').length || 0
      const completed = cashouts?.filter(c => c.status === 'completed').length || 0

      setStats({
        totalUsers: usersCount || 0,
        totalEnergy,
        totalFuel,
        totalYes,
        totalCashoutUsd: totalCashout,
        totalPlanets: planetsCount || 0,
        pendingCashouts: pending,
        completedCashouts: completed
      })
    } catch (err) {
      console.error('Error loading stats:', err)
    }
  }

  const loadFaucetPayBalance = async () => {
    try {
      const response = await fetch('/api/faucetpay/balance')
      const data = await response.json()
      if (data.success) setFaucetPayBalance(data.balance)
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const loadRecentCashouts = async () => {
    try {
      const { data } = await supabase
        .from('cashouts')
        .select('*, users(username, email)')
        .order('created_at', { ascending: false })
        .limit(10)
      setRecentCashouts(data || [])
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const loadRecentUsers = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentUsers(data || [])
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const formatLTC = (satoshis: number) => (satoshis / 100000000).toFixed(8)
  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toLocaleString()
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-cyan-400" /></div>
  }

  if (!isAdmin) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">Access Denied</div>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-700 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-400" />
              <span className="text-xl font-bold">Admin Dashboard</span>
            </div>
          </div>
          <button onClick={loadAllData} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* FaucetPay Balance - IMPORTANT */}
        <div className="bg-gradient-to-r from-green-900/50 to-cyan-900/50 border-2 border-green-500 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg text-gray-400 mb-1">FaucetPay Pool Balance</h2>
              <p className="text-4xl font-bold text-green-400">
                {faucetPayBalance !== null ? formatLTC(faucetPayBalance) : '---'} LTC
              </p>
              <p className="text-gray-500 mt-1">≈ ${faucetPayBalance ? ((faucetPayBalance / 100000000) * 120).toFixed(2) : '---'} USD</p>
            </div>
            <Wallet className="w-16 h-16 text-green-400 opacity-50" />
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 border border-purple-500/30 rounded-xl p-4">
            <Users className="w-8 h-8 text-purple-400 mb-2" />
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-gray-400 text-sm">Total Users</p>
          </div>
          <div className="bg-gray-800 border border-yellow-500/30 rounded-xl p-4">
            <Zap className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-3xl font-bold text-yellow-400">{formatNumber(stats.totalEnergy)}</p>
            <p className="text-gray-400 text-sm">Total Energy</p>
          </div>
          <div className="bg-gray-800 border border-orange-500/30 rounded-xl p-4">
            <Activity className="w-8 h-8 text-orange-400 mb-2" />
            <p className="text-3xl font-bold text-orange-400">{formatNumber(stats.totalFuel)}</p>
            <p className="text-gray-400 text-sm">Total Fuel</p>
          </div>
          <div className="bg-gray-800 border border-cyan-500/30 rounded-xl p-4">
            <Coins className="w-8 h-8 text-cyan-400 mb-2" />
            <p className="text-3xl font-bold text-cyan-400">{formatNumber(stats.totalYes)}</p>
            <p className="text-gray-400 text-sm">Total YES</p>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 border border-green-500/30 rounded-xl p-4">
            <DollarSign className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-3xl font-bold text-green-400">${stats.totalCashoutUsd.toFixed(2)}</p>
            <p className="text-gray-400 text-sm">Total Paid Out</p>
          </div>
          <div className="bg-gray-800 border border-blue-500/30 rounded-xl p-4">
            <Globe className="w-8 h-8 text-blue-400 mb-2" />
            <p className="text-3xl font-bold text-blue-400">{stats.totalPlanets}</p>
            <p className="text-gray-400 text-sm">Total Planets</p>
          </div>
          <div className="bg-gray-800 border border-yellow-500/30 rounded-xl p-4">
            <Clock className="w-8 h-8 text-yellow-400 mb-2" />
            <p className="text-3xl font-bold text-yellow-400">{stats.pendingCashouts}</p>
            <p className="text-gray-400 text-sm">Pending Cashouts</p>
          </div>
          <div className="bg-gray-800 border border-green-500/30 rounded-xl p-4">
            <CheckCircle className="w-8 h-8 text-green-400 mb-2" />
            <p className="text-3xl font-bold text-green-400">{stats.completedCashouts}</p>
            <p className="text-gray-400 text-sm">Completed Cashouts</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Recent Cashouts */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              Recent Cashouts
            </h3>
            {recentCashouts.length === 0 ? (
              <p className="text-gray-500">No cashouts yet</p>
            ) : (
              <div className="space-y-3">
                {recentCashouts.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                    <div>
                      <p className="font-medium">{c.users?.username || c.faucetpay_email}</p>
                      <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-cyan-400 font-bold">{c.amount} YES</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              Recent Users
            </h3>
            {recentUsers.length === 0 ? (
              <p className="text-gray-500">No users yet</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                    <div>
                      <p className="font-medium">{u.username}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-yellow-400">{formatNumber(u.total_energy_earned || 0)} ⚡</p>
                      <p className="text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-4 gap-4">
          <Link href="/admin/referrals" className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 hover:from-purple-900/50 hover:to-pink-900/50 border border-purple-500/30 rounded-xl p-4 text-center transition-colors">
            <Users className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <p className="font-medium">Referrals</p>
          </Link>
          <a href="https://faucetpay.io/page/user-admin" target="_blank" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 text-center transition-colors">
            <Wallet className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="font-medium">FaucetPay</p>
          </a>
          <a href="https://supabase.com/dashboard" target="_blank" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 text-center transition-colors">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
            <p className="font-medium">Supabase</p>
          </a>
          <a href="https://vercel.com/dashboard" target="_blank" className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl p-4 text-center transition-colors">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-400" />
            <p className="font-medium">Vercel</p>
          </a>
        </div>

      </div>
    </div>
  )
}
