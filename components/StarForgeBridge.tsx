'use client'

import { useState, useEffect } from 'react'
import { ArrowRightLeft, Rocket, ExternalLink, Loader2, CheckCircle2, AlertCircle, Zap, Flame } from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ═══════════════════════════════════════════
   STARFORGE BRIDGE — YieldVerse Dashboard Widget
   Shows linked StarForge account status + quick transfer
═══════════════════════════════════════════ */

interface StarForgeBridgeProps {
  userId: string
  wallet: { energy: number; fuel: number; yes_tokens: number } | null
  onRefresh: () => void
}

interface StarForgeData {
  player_id: string
  energy: number
  minerals: number
  credits: number
  yes_tokens: number
  play_time_seconds: number
  ship_count: number
}

export default function StarForgeBridge({ userId, wallet, onRefresh }: StarForgeBridgeProps) {
  const [sfData, setSfData] = useState<StarForgeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [recentTransfers, setRecentTransfers] = useState<any[]>([])

  useEffect(() => {
    loadStarForgeLink()
  }, [userId])

  const loadStarForgeLink = async () => {
    try {
      // Check if any StarForge save is linked to this user
      const { data } = await supabase
        .from('starforge_saves')
        .select('player_id, energy, minerals, credits, yes_tokens, play_time_seconds, ship_count')
        .eq('yieldverse_user_id', userId)
        .single()

      if (data) setSfData(data)

      // Load recent transfers
      const { data: transfers } = await supabase
        .from('cross_game_transfers')
        .select('*')
        .eq('yieldverse_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3)

      if (transfers) setRecentTransfers(transfers)
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="glass-card p-5" style={{ borderColor: 'rgba(34,211,238,0.15)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>StarForge Bridge</h2>
        </div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (!sfData) {
    // Not linked yet
    return (
      <div className="glass-card p-5" style={{ borderColor: 'rgba(34,211,238,0.08)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>StarForge Bridge</h2>
        </div>
        <div className="text-center py-3">
          <p className="text-[11px] text-gray-400 mb-3">
            Link your StarForge account to transfer resources between games!
          </p>
          <a
            href="https://www.starforge.live"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl"
          >
            <Rocket className="w-4 h-4" /> Play StarForge
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          <p className="text-[9px] text-gray-600 mt-2">Open the Trade Terminal in StarForge to link</p>
        </div>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div className="glass-card p-5" style={{ borderColor: 'rgba(34,211,238,0.15)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>StarForge Bridge</h2>
        </div>
        <span className="flex items-center gap-1 text-[9px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Linked
        </span>
      </div>

      {/* StarForge Resources */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <p className="text-sm font-black text-yellow-400">{sfData.energy}</p>
          <p className="text-[8px] text-gray-500">⚡ Energy</p>
        </div>
        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <p className="text-sm font-black text-purple-400">{sfData.minerals}</p>
          <p className="text-[8px] text-gray-500">💎 Minerals</p>
        </div>
        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <p className="text-sm font-black text-green-400">{sfData.credits}</p>
          <p className="text-[8px] text-gray-500">💰 Credits</p>
        </div>
        <div className="text-center p-2 rounded-xl" style={{ background: 'var(--bg-card)' }}>
          <p className="text-sm font-black text-cyan-400">{sfData.yes_tokens}</p>
          <p className="text-[8px] text-gray-500">✦ YES</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-4 px-1">
        <span>🚀 {sfData.ship_count} ships</span>
        <span>🕐 {formatTime(sfData.play_time_seconds)} played</span>
      </div>

      {/* Recent transfers */}
      {recentTransfers.length > 0 && (
        <div className="mb-4">
          <p className="text-[9px] font-bold tracking-widest text-gray-600 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>RECENT TRANSFERS</p>
          <div className="space-y-1.5">
            {recentTransfers.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-[10px] p-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <span>{t.direction === 'starforge_to_yieldverse' ? '🚀→🌐' : '🌐→🚀'}</span>
                <span className="text-gray-400 flex-1">
                  {t.direction === 'starforge_to_yieldverse'
                    ? `+${t.amount} YES from StarForge`
                    : `Sent ${t.source_amount} ${t.source_resource} → ${t.amount} ${t.resource_type}`
                  }
                </span>
                <CheckCircle2 className="w-3 h-3 text-emerald-500/40" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <a
        href="https://www.starforge.live"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
        style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(34,211,238,0.15)', color: '#22d3ee' }}
      >
        <ArrowRightLeft className="w-3.5 h-3.5" /> Open Trade Terminal in StarForge
      </a>
    </div>
  )
}
