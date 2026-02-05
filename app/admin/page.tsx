'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, RefreshCw, Users, Coins, DollarSign, 
  Wallet, Globe, Zap, TrendingUp, Shield, CheckCircle,
  Clock, Activity, BarChart3, MessageCircle, Eye,
  Monitor, Smartphone, Tablet, Wifi, WifiOff,
  UserCheck, UserX, Timer, Flame, LogIn, ChevronRight,
  ExternalLink, X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const ADMIN_EMAILS = ['gtrust1985@gmail.com']

type TabType = 'overview' | 'sessions' | 'users' | 'cashouts' | 'tickets'

export default function AdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  const [stats, setStats] = useState({
    totalUsers: 0, totalEnergy: 0, totalFuel: 0, totalYes: 0,
    totalCashoutUsd: 0, totalPlanets: 0, pendingCashouts: 0, completedCashouts: 0
  })

  const [sessionStats, setSessionStats] = useState({
    dau: 0, wau: 0, sessionsToday: 0, avgDuration: 0, desktopPct: 0, mobilePct: 0
  })

  const [faucetPayBalance, setFaucetPayBalance] = useState<number | null>(null)
  const [recentCashouts, setRecentCashouts] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [userActivity, setUserActivity] = useState<any[]>([])

  useEffect(() => { checkAdminAndLoad() }, [])

  const checkAdminAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      if (!ADMIN_EMAILS.includes(session.user.email || '')) { router.push('/dashboard'); return }
      setIsAdmin(true)
      await loadAllData()
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const loadAllData = async () => {
    setRefreshing(true)
    await Promise.all([loadStats(), loadFaucetPayBalance(), loadRecentCashouts(), loadRecentUsers(), loadAllUsers(), loadSessionData(), loadTickets()])
    setRefreshing(false)
  }

  const loadStats = async () => {
    try {
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true })
      const { data: usersData } = await supabase.from('users').select('total_energy_earned, total_fuel_earned, total_yes_earned, total_cashout_usd')
      let totalEnergy = 0, totalFuel = 0, totalYes = 0, totalCashout = 0
      usersData?.forEach(u => { totalEnergy += u.total_energy_earned || 0; totalFuel += u.total_fuel_earned || 0; totalYes += u.total_yes_earned || 0; totalCashout += u.total_cashout_usd || 0 })
      const { count: planetsCount } = await supabase.from('planets').select('*', { count: 'exact', head: true })
      const { data: cashouts } = await supabase.from('cashouts').select('status')
      const pending = cashouts?.filter(c => c.status === 'pending').length || 0
      const completed = cashouts?.filter(c => c.status === 'completed').length || 0
      setStats({ totalUsers: usersCount || 0, totalEnergy, totalFuel, totalYes, totalCashoutUsd: totalCashout, totalPlanets: planetsCount || 0, pendingCashouts: pending, completedCashouts: completed })
    } catch (err) { console.error('Error loading stats:', err) }
  }

  const loadFaucetPayBalance = async () => {
    try { const r = await fetch('/api/faucetpay/balance'); const d = await r.json(); if (d.success) setFaucetPayBalance(d.balance) } catch {}
  }

  const loadRecentCashouts = async () => {
    try { const { data } = await supabase.from('cashouts').select('*, users(username, email)').order('created_at', { ascending: false }).limit(10); setRecentCashouts(data || []) } catch {}
  }

  const loadRecentUsers = async () => {
    try { const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5); setRecentUsers(data || []) } catch {}
  }

  const loadAllUsers = async () => {
    try { const { data } = await supabase.from('users').select('*, wallets(energy, fuel, yes_tokens)').order('last_login', { ascending: false, nullsFirst: false }); setAllUsers(data || []) } catch {}
  }

  const loadSessionData = async () => {
    try {
      const { data: sessionsData } = await supabase.from('user_sessions').select('*, users(username)').order('session_start', { ascending: false }).limit(50)
      setSessions(sessionsData || [])
      const now = new Date()
      const dayAgo = new Date(now.getTime() - 24*60*60*1000).toISOString()
      const weekAgo = new Date(now.getTime() - 7*24*60*60*1000).toISOString()
      const { data: daySessions } = await supabase.from('user_sessions').select('user_id, duration_seconds, device_type').gte('session_start', dayAgo)
      const { data: weekSessions } = await supabase.from('user_sessions').select('user_id').gte('session_start', weekAgo)
      const uniqueDay = new Set(daySessions?.map(s => s.user_id) || [])
      const uniqueWeek = new Set(weekSessions?.map(s => s.user_id) || [])
      const durations = daySessions?.filter(s => s.duration_seconds).map(s => s.duration_seconds) || []
      const avgDur = durations.length > 0 ? durations.reduce((a: number, b: number) => a + b, 0) / durations.length / 60 : 0
      const devices = daySessions || []; const desktop = devices.filter(d => d.device_type === 'desktop').length; const mobile = devices.filter(d => d.device_type === 'mobile').length; const total = devices.length || 1
      setSessionStats({ dau: uniqueDay.size, wau: uniqueWeek.size, sessionsToday: daySessions?.length || 0, avgDuration: Math.round(avgDur * 10) / 10, desktopPct: Math.round(desktop/total*100), mobilePct: Math.round(mobile/total*100) })
      const { data: activityData } = await supabase.from('users').select('id, username, email, last_login, total_sessions, last_project, created_at').order('last_login', { ascending: false, nullsFirst: false })
      setUserActivity(activityData || [])
    } catch (err) { console.error('Error loading sessions:', err) }
  }

  const loadTickets = async () => {
    try { const { data } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(20); setTickets(data || []) } catch {}
  }

  const markTicketRead = async (ticketId: string) => {
    await supabase.from('support_tickets').update({ status: 'read' }).eq('id', ticketId)
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'read' } : t))
  }

  const formatLTC = (satoshis: number) => (satoshis / 100000000).toFixed(8)
  const formatNumber = (n: number) => { if (n >= 1000000) return (n/1000000).toFixed(2)+'M'; if (n >= 1000) return (n/1000).toFixed(1)+'K'; return n.toLocaleString() }

  const getStatusBadge = (lastLogin: string | null) => {
    if (!lastLogin) return { label: 'Never', color: 'text-gray-500', bg: 'bg-gray-500/10', dot: 'bg-gray-500' }
    const hours = (Date.now() - new Date(lastLogin).getTime()) / (1000*60*60)
    if (hours < 24) return { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' }
    if (hours < 168) return { label: 'Recent', color: 'text-yellow-400', bg: 'bg-yellow-500/10', dot: 'bg-yellow-400' }
    if (hours < 720) return { label: 'Inactive', color: 'text-orange-400', bg: 'bg-orange-500/10', dot: 'bg-orange-400' }
    return { label: 'Dormant', color: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400' }
  }

  const timeAgo = (date: string | null) => {
    if (!date) return 'Never'
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
    if (mins < 1) return 'Just now'; if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins/60); if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours/24)}d ago`
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '—'; if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds/60); if (mins < 60) return `${mins}m ${seconds%60}s`
    return `${Math.floor(mins/60)}h ${mins%60}m`
  }

  const getDeviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="w-3.5 h-3.5" />
    if (type === 'tablet') return <Tablet className="w-3.5 h-3.5" />
    return <Monitor className="w-3.5 h-3.5" />
  }

  const getProjectBadge = (project: string | null) => {
    if (!project) return null
    const c: Record<string,string> = { energy_empire: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', starforge: 'bg-purple-500/15 text-purple-400 border-purple-500/30', yieldverse: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' }
    const n: Record<string,string> = { energy_empire: '⚡ Energy Empire', starforge: '🚀 StarForge', yieldverse: '🌐 YieldVerse' }
    return <span className={`text-[10px] px-2 py-0.5 rounded-full border ${c[project] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'}`}>{n[project] || project}</span>
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
      <div className="text-center"><div className="spinner mx-auto mb-4" style={{ width: 40, height: 40 }} /><p style={{ color: 'var(--text-dim)', fontFamily: 'Orbitron, sans-serif', fontSize: 12, letterSpacing: 2 }}>LOADING ADMIN</p></div>
    </div>
  )
  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)', color: 'var(--red)' }}>Access Denied</div>

  const tabs: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sessions', label: 'Sessions', icon: Activity, badge: sessionStats.dau },
    { id: 'users', label: 'Users', icon: Users, badge: stats.totalUsers },
    { id: 'cashouts', label: 'Cashouts', icon: DollarSign, badge: stats.pendingCashouts },
    { id: 'tickets', label: 'Tickets', icon: MessageCircle, badge: tickets.filter(t => t.status === 'open').length }
  ]
  const openTickets = tickets.filter(t => t.status === 'open').length

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-deep)', color: 'var(--text-primary)' }}>
      <div className="nebula" /><div className="grid-overlay" />

      {/* NAV */}
      <nav className="nav-bar">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-lg hover:bg-white/5"><ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} /></Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--red), var(--orange))' }}><Shield className="w-5 h-5 text-white" /></div>
              <div><h1 className="text-base font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>Admin HQ</h1><p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>YieldVerse Command Center</p></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /><span className="text-xs font-bold text-emerald-400">{sessionStats.dau} online</span>
            </div>
            <button onClick={loadAllData} disabled={refreshing} className="p-2 rounded-lg hover:bg-white/5"><RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} style={{ color: 'var(--cyan)' }} /></button>
          </div>
        </div>
      </nav>

      {/* TAB BAR */}
      <div className="sticky top-[57px] z-40" style={{ background: 'rgba(5,5,16,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-dim)' }}>
        <div className="max-w-7xl mx-auto px-4"><div className="flex gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' as any }}>
          {tabs.map(tab => { const Icon = tab.icon; const isActive = activeTab === tab.id; return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all" style={{ background: isActive ? 'rgba(0,240,255,0.1)' : 'transparent', border: isActive ? '1px solid rgba(0,240,255,0.2)' : '1px solid transparent', color: isActive ? 'var(--cyan)' : 'var(--text-dim)' }}>
              <Icon className="w-4 h-4" />{tab.label}
              {tab.badge !== undefined && tab.badge > 0 && <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: isActive ? 'var(--cyan)' : 'rgba(255,255,255,0.1)', color: isActive ? 'var(--bg-deep)' : 'var(--text-secondary)' }}>{tab.badge}</span>}
            </button>
          )})}
        </div></div>
      </div>

      {/* CONTENT */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ═══ OVERVIEW ═══ */}
        {activeTab === 'overview' && (<>
          {/* FaucetPay */}
          <div className="glass-card p-6"><div className="flex items-center justify-between">
            <div><p className="section-label">FAUCETPAY POOL</p><p className="text-3xl font-bold gradient-text-cyan" style={{ fontFamily: 'Orbitron, sans-serif' }}>{faucetPayBalance !== null ? formatLTC(faucetPayBalance) : '—'} LTC</p><p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>≈ ${faucetPayBalance ? ((faucetPayBalance/100000000)*120).toFixed(2) : '—'} USD</p></div>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--emerald-glow)' }}><Wallet className="w-8 h-8" style={{ color: 'var(--emerald)' }} /></div>
          </div></div>

          {/* Main Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card energy"><div className="flex items-center gap-2 mb-3"><Users className="w-5 h-5" style={{ color: 'var(--gold)' }} /><span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>USERS</span></div><p className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>{stats.totalUsers}</p><span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 mt-2 inline-block">{sessionStats.dau} active</span></div>
            <div className="stat-card fuel"><div className="flex items-center gap-2 mb-3"><Zap className="w-5 h-5" style={{ color: 'var(--orange)' }} /><span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>ENERGY</span></div><p className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--gold)' }}>{formatNumber(stats.totalEnergy)}</p></div>
            <div className="stat-card yes"><div className="flex items-center gap-2 mb-3"><Coins className="w-5 h-5" style={{ color: 'var(--cyan)' }} /><span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>YES TOKENS</span></div><p className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--cyan)' }}>{formatNumber(stats.totalYes)}</p></div>
            <div className="stat-card usd"><div className="flex items-center gap-2 mb-3"><DollarSign className="w-5 h-5" style={{ color: 'var(--emerald)' }} /><span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>PAID OUT</span></div><p className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--emerald)' }}>${stats.totalCashoutUsd.toFixed(2)}</p></div>
          </div>

          {/* Activity Row */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="glass-card p-5"><div className="flex items-center gap-2 mb-3"><Activity className="w-4 h-4" style={{ color: 'var(--cyan)' }} /><span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>DAU / WAU</span></div><div className="flex items-baseline gap-3"><span className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--cyan)' }}>{sessionStats.dau}</span><span style={{ color: 'var(--text-dim)' }}>/</span><span className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>{sessionStats.wau}</span></div><div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-dim)' }}><div className="h-full rounded-full" style={{ width: `${Math.min((sessionStats.dau/(stats.totalUsers||1))*100,100)}%`, background: 'linear-gradient(90deg, var(--cyan), var(--purple))' }} /></div><p className="text-[11px] mt-2" style={{ color: 'var(--text-dim)' }}>{stats.totalUsers > 0 ? Math.round((sessionStats.dau/stats.totalUsers)*100) : 0}% daily retention</p></div>
            <div className="glass-card p-5"><div className="flex items-center gap-2 mb-3"><Timer className="w-4 h-4" style={{ color: 'var(--gold)' }} /><span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>AVG SESSION</span></div><p className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--gold)' }}>{sessionStats.avgDuration > 0 ? `${sessionStats.avgDuration}min` : '—'}</p><p className="text-[11px] mt-2" style={{ color: 'var(--text-dim)' }}>{sessionStats.sessionsToday} sessions today</p></div>
            <div className="glass-card p-5"><div className="flex items-center gap-2 mb-3"><Monitor className="w-4 h-4" style={{ color: 'var(--purple)' }} /><span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>DEVICES</span></div><div className="flex items-center gap-4"><div className="flex items-center gap-2"><Monitor className="w-4 h-4" style={{ color: 'var(--cyan)' }} /><span className="text-sm font-bold">{sessionStats.desktopPct}%</span></div><div className="flex items-center gap-2"><Smartphone className="w-4 h-4" style={{ color: 'var(--purple)' }} /><span className="text-sm font-bold">{sessionStats.mobilePct}%</span></div></div><div className="flex gap-1 mt-3 h-2 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${sessionStats.desktopPct}%`, background: 'var(--cyan)' }} /><div className="h-full rounded-full" style={{ width: `${sessionStats.mobilePct}%`, background: 'var(--purple)' }} /><div className="h-full rounded-full flex-1" style={{ background: 'var(--border-dim)' }} /></div></div>
          </div>

          {/* Two Column */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-5"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><DollarSign className="w-5 h-5" style={{ color: 'var(--emerald)' }} /><h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>Recent Cashouts</h3></div><Link href="/admin/cashouts" className="text-xs flex items-center gap-1" style={{ color: 'var(--cyan)' }}>View all <ChevronRight className="w-3 h-3" /></Link></div>
              {recentCashouts.length === 0 ? <p className="text-center py-6" style={{ color: 'var(--text-dim)' }}>No cashouts yet</p> : <div className="space-y-2">{recentCashouts.slice(0,5).map((c: any) => (<div key={c.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)' }}><div><p className="text-sm font-medium">{c.users?.username||'Unknown'}</p><p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{timeAgo(c.created_at)}</p></div><div className="text-right flex items-center gap-3"><span className="font-bold text-sm" style={{ color: 'var(--cyan)' }}>{c.amount} YES</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${c.status==='completed'?'bg-emerald-500/15 text-emerald-400':'bg-yellow-500/15 text-yellow-400'}`}>{c.status}</span></div></div>))}</div>}
            </div>
            <div className="glass-card p-5"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2"><Users className="w-5 h-5" style={{ color: 'var(--purple)' }} /><h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>New Players</h3></div><button onClick={() => setActiveTab('users')} className="text-xs flex items-center gap-1" style={{ color: 'var(--cyan)' }}>View all <ChevronRight className="w-3 h-3" /></button></div>
              {recentUsers.length === 0 ? <p className="text-center py-6" style={{ color: 'var(--text-dim)' }}>No users yet</p> : <div className="space-y-2">{recentUsers.map((u: any) => { const s = getStatusBadge(u.last_login); return (<div key={u.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)' }}><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${s.dot}`} /><div><p className="text-sm font-medium">{u.username}</p><p className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{timeAgo(u.created_at)}</p></div></div><span className="text-xs" style={{ color: 'var(--gold)' }}>{formatNumber(u.total_energy_earned||0)} ⚡</span></div>)})}</div>}
            </div>
          </div>

          {/* Tickets preview */}
          {tickets.length > 0 && <div className="glass-card p-5"><div className="flex items-center gap-3 mb-4"><MessageCircle className="w-5 h-5" style={{ color: 'var(--orange)' }} /><h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>Support Tickets</h3>{openTickets > 0 && <span className="badge badge-live">{openTickets} new</span>}</div><div className="space-y-2 max-h-80 overflow-y-auto">{tickets.slice(0,5).map((t: any) => (<div key={t.id} className="p-3 rounded-xl" style={{ background: t.status==='open'?'rgba(249,115,22,0.08)':'var(--bg-card)', border: t.status==='open'?'1px solid rgba(249,115,22,0.2)':'1px solid var(--border-dim)' }}><div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="font-bold text-xs">{t.username}</span><span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{t.email}</span>{t.status==='open' && <span className="badge badge-soon">NEW</span>}</div><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.message}</p><p className="text-[10px] mt-1" style={{ color: 'var(--text-dim)' }}>{timeAgo(t.created_at)}</p></div>{t.status==='open' && <button onClick={() => markTicketRead(t.id)} className="btn-emerald" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 8 }}><Eye className="w-3 h-3" /> Read</button>}</div></div>))}</div></div>}

          {/* Quick Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/admin/referrals" className="glass-card p-4 text-center"><Users className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--purple)' }} /><p className="text-xs font-bold">Referrals</p></Link>
            <a href="https://faucetpay.io/page/user-admin" target="_blank" className="glass-card p-4 text-center"><Wallet className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--emerald)' }} /><p className="text-xs font-bold">FaucetPay</p></a>
            <a href="https://supabase.com/dashboard" target="_blank" className="glass-card p-4 text-center"><BarChart3 className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--cyan)' }} /><p className="text-xs font-bold">Supabase</p></a>
            <a href="https://vercel.com/dashboard" target="_blank" className="glass-card p-4 text-center"><TrendingUp className="w-7 h-7 mx-auto mb-2" style={{ color: 'var(--gold)' }} /><p className="text-xs font-bold">Vercel</p></a>
          </div>
        </>)}

        {/* ═══ SESSIONS ═══ */}
        {activeTab === 'sessions' && (<>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card yes"><div className="flex items-center gap-2 mb-2"><UserCheck className="w-4 h-4" style={{ color: 'var(--cyan)' }} /><span className="text-[10px] font-bold" style={{ color: 'var(--text-dim)' }}>DAU</span></div><p className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--cyan)' }}>{sessionStats.dau}</p></div>
            <div className="stat-card energy"><div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4" style={{ color: 'var(--gold)' }} /><span className="text-[10px] font-bold" style={{ color: 'var(--text-dim)' }}>WAU</span></div><p className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--gold)' }}>{sessionStats.wau}</p></div>
            <div className="stat-card fuel"><div className="flex items-center gap-2 mb-2"><LogIn className="w-4 h-4" style={{ color: 'var(--orange)' }} /><span className="text-[10px] font-bold" style={{ color: 'var(--text-dim)' }}>SESSIONS TODAY</span></div><p className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--orange)' }}>{sessionStats.sessionsToday}</p></div>
            <div className="stat-card usd"><div className="flex items-center gap-2 mb-2"><Timer className="w-4 h-4" style={{ color: 'var(--emerald)' }} /><span className="text-[10px] font-bold" style={{ color: 'var(--text-dim)' }}>AVG DURATION</span></div><p className="text-3xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--emerald)' }}>{sessionStats.avgDuration > 0 ? `${sessionStats.avgDuration}m` : '—'}</p></div>
          </div>

          {/* Player Activity Table */}
          <div className="glass-card overflow-hidden">
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-dim)' }}><div className="flex items-center gap-2"><Flame className="w-5 h-5" style={{ color: 'var(--orange)' }} /><h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>Player Activity</h3></div><p className="text-xs" style={{ color: 'var(--text-dim)' }}>{userActivity.length} players</p></div>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr style={{ background: 'rgba(0,0,0,0.3)' }}>
              <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>STATUS</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>PLAYER</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>LAST SEEN</th>
              <th className="px-4 py-3 text-center text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>SESSIONS</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>LAST PROJECT</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>JOINED</th>
            </tr></thead><tbody>
              {userActivity.map((u: any) => { const s = getStatusBadge(u.last_login); return (
                <tr key={u.id} className="hover:bg-white/[0.02]" style={{ borderTop: '1px solid var(--border-dim)' }}>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}</span></td>
                  <td className="px-4 py-3"><p className="text-sm font-medium">{u.username}</p><p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{u.email}</p></td>
                  <td className="px-4 py-3 text-sm">{timeAgo(u.last_login)}</td>
                  <td className="px-4 py-3 text-center"><span className="text-sm font-bold" style={{ color: 'var(--cyan)' }}>{u.total_sessions || 0}</span></td>
                  <td className="px-4 py-3">{getProjectBadge(u.last_project)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-dim)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              )})}
            </tbody></table></div>
          </div>

          {/* Session Log */}
          <div className="glass-card p-5"><div className="flex items-center gap-2 mb-4"><Activity className="w-5 h-5" style={{ color: 'var(--cyan)' }} /><h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>Session Log</h3></div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sessions.length === 0 ? <p className="text-center py-8" style={{ color: 'var(--text-dim)' }}>No sessions recorded yet. Deploy the session tracker to see data here.</p> :
              sessions.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-dim)' }}>
                  <div className="flex items-center gap-3"><div className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>{getDeviceIcon(s.device_type||'desktop')}</div><div><div className="flex items-center gap-2"><p className="text-sm font-medium">{s.users?.username||'Unknown'}</p>{getProjectBadge(s.project)}</div><p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{s.browser||'Unknown'} • {timeAgo(s.session_start)}</p></div></div>
                  <div className="text-right"><p className="text-sm font-mono font-bold" style={{ color: s.duration_seconds ? 'var(--gold)' : 'var(--text-dim)' }}>{formatDuration(s.duration_seconds)}</p>{!s.session_end && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Live</span>}</div>
                </div>
              ))}
            </div>
          </div>
        </>)}

        {/* ═══ USERS ═══ */}
        {activeTab === 'users' && (
          <div className="glass-card overflow-hidden">
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-dim)' }}><div className="flex items-center gap-2"><Users className="w-5 h-5" style={{ color: 'var(--purple)' }} /><h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>All Players ({allUsers.length})</h3></div></div>
            <div className="overflow-x-auto"><table className="w-full"><thead><tr style={{ background: 'rgba(0,0,0,0.3)' }}>
              <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>STATUS</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>PLAYER</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>⚡ ENERGY</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>⛽ FUEL</th>
              <th className="px-4 py-3 text-right text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>🪙 YES</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>LAST SEEN</th>
              <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>JOINED</th>
            </tr></thead><tbody>
              {allUsers.map((u: any) => { const s = getStatusBadge(u.last_login); const w = Array.isArray(u.wallets) ? u.wallets[0] : u.wallets; return (
                <tr key={u.id} className="hover:bg-white/[0.02]" style={{ borderTop: '1px solid var(--border-dim)' }}>
                  <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${s.bg} ${s.color}`}><span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />{s.label}</span></td>
                  <td className="px-4 py-3"><p className="text-sm font-medium">{u.username}</p><p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{u.email}</p></td>
                  <td className="px-4 py-3 text-right text-sm font-mono" style={{ color: 'var(--gold)' }}>{formatNumber(w?.energy||0)}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono" style={{ color: 'var(--orange)' }}>{formatNumber(w?.fuel||0)}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono" style={{ color: 'var(--cyan)' }}>{formatNumber(w?.yes_tokens||0)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{timeAgo(u.last_login)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-dim)' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              )})}
            </tbody></table></div>
          </div>
        )}

        {/* ═══ CASHOUTS ═══ */}
        {activeTab === 'cashouts' && (<>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card fuel"><Clock className="w-6 h-6 mb-2" style={{ color: 'var(--orange)' }} /><p className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--orange)' }}>{stats.pendingCashouts}</p><p className="text-xs" style={{ color: 'var(--text-dim)' }}>Pending</p></div>
            <div className="stat-card usd"><CheckCircle className="w-6 h-6 mb-2" style={{ color: 'var(--emerald)' }} /><p className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--emerald)' }}>{stats.completedCashouts}</p><p className="text-xs" style={{ color: 'var(--text-dim)' }}>Completed</p></div>
            <div className="stat-card yes"><DollarSign className="w-6 h-6 mb-2" style={{ color: 'var(--cyan)' }} /><p className="text-2xl font-bold" style={{ fontFamily: 'Orbitron, sans-serif', color: 'var(--cyan)' }}>${stats.totalCashoutUsd.toFixed(2)}</p><p className="text-xs" style={{ color: 'var(--text-dim)' }}>Total Paid</p></div>
          </div>
          <div className="glass-card overflow-hidden"><div className="overflow-x-auto"><table className="w-full"><thead><tr style={{ background: 'rgba(0,0,0,0.3)' }}>
            <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>DATE</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>USER</th>
            <th className="px-4 py-3 text-left text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>FAUCETPAY</th>
            <th className="px-4 py-3 text-right text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>AMOUNT</th>
            <th className="px-4 py-3 text-center text-[10px] font-bold tracking-wider" style={{ color: 'var(--text-dim)' }}>STATUS</th>
          </tr></thead><tbody>
            {recentCashouts.map((c: any) => (
              <tr key={c.id} className="hover:bg-white/[0.02]" style={{ borderTop: '1px solid var(--border-dim)' }}>
                <td className="px-4 py-3 text-xs">{new Date(c.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm font-medium">{c.users?.username||'Unknown'}</td>
                <td className="px-4 py-3 text-xs" style={{ color: 'var(--cyan)' }}>{c.faucetpay_email}</td>
                <td className="px-4 py-3 text-right"><span className="font-bold text-sm" style={{ color: 'var(--gold)' }}>{c.amount} YES</span></td>
                <td className="px-4 py-3 text-center"><span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${c.status==='completed'?'bg-emerald-500/15 text-emerald-400':c.status==='failed'?'bg-red-500/15 text-red-400':'bg-yellow-500/15 text-yellow-400'}`}>{c.status}</span></td>
              </tr>
            ))}
          </tbody></table></div></div>
          <Link href="/admin/cashouts" className="btn-cyan w-full justify-center"><DollarSign className="w-4 h-4" />Manage Cashouts</Link>
        </>)}

        {/* ═══ TICKETS ═══ */}
        {activeTab === 'tickets' && (
          <div className="glass-card p-5"><div className="flex items-center gap-3 mb-4"><MessageCircle className="w-5 h-5" style={{ color: 'var(--orange)' }} /><h3 className="font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>All Tickets ({tickets.length})</h3>{openTickets > 0 && <span className="badge badge-live">{openTickets} new</span>}</div>
            {tickets.length === 0 ? <p className="text-center py-12" style={{ color: 'var(--text-dim)' }}>No tickets yet ✨</p> :
            <div className="space-y-3">{tickets.map((t: any) => (
              <div key={t.id} className="p-4 rounded-xl" style={{ background: t.status==='open'?'rgba(249,115,22,0.08)':'var(--bg-card)', border: t.status==='open'?'1px solid rgba(249,115,22,0.2)':'1px solid var(--border-dim)' }}>
                <div className="flex items-start justify-between gap-3"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><span className="font-bold text-sm">{t.username}</span><span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{t.email}</span>{t.status==='open' && <span className="badge badge-soon">NEW</span>}</div><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t.message}</p><p className="text-[10px] mt-2" style={{ color: 'var(--text-dim)' }}>{new Date(t.created_at).toLocaleString()}</p></div>
                {t.status==='open' && <button onClick={() => markTicketRead(t.id)} className="btn-emerald" style={{ padding: '6px 14px', fontSize: 11, borderRadius: 8 }}><Eye className="w-3 h-3" /> Mark Read</button>}</div>
              </div>
            ))}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
