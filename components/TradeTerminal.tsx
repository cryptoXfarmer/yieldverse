'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Link2, ArrowRightLeft, Zap, Gem, Coins, ArrowRight, Loader2, CheckCircle2, AlertCircle, ExternalLink, History, Unlink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getPlayerId } from '@/lib/gameSave'

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
interface TradeTerminalProps {
  open: boolean
  onClose: () => void
  resources: { energy: number; minerals: number; credits: number; yes: number }
  onResourcesChange: (res: { energy: number; minerals: number; credits: number; yes: number }) => void
}

interface YieldVerseLink {
  userId: string
  username: string
}

interface YVWallet {
  energy: number
  fuel: number
  yes_tokens: number
}

interface TransferLog {
  id: string
  direction: string
  resource_type: string
  amount: number
  source_resource: string | null
  source_amount: number | null
  created_at: string
}

/* ═══════════════════════════════════════════
   CONVERSION RATES (StarForge internal)
═══════════════════════════════════════════ */
const CONVERT_RATES: Record<string, Record<string, number>> = {
  energy:   { minerals: 0.65, credits: 0.5 },   // 100 Energy → 65 Minerals or 50 Credits
  minerals: { energy: 0.65, credits: 0.5 },      // 100 Minerals → 65 Energy or 50 Credits
  credits:  { energy: 0.35, minerals: 0.35 },    // 100 Credits → 35 Energy or 35 Minerals
}

const RES_INFO: Record<string, { icon: string; label: string; color: string; colorClass: string }> = {
  energy:   { icon: '⚡', label: 'Energy',   color: '#facc15', colorClass: 'text-yellow-400' },
  minerals: { icon: '💎', label: 'Minerals', color: '#c084fc', colorClass: 'text-purple-400' },
  credits:  { icon: '💰', label: 'Credits',  color: '#4ade80', colorClass: 'text-green-400' },
  yes:      { icon: '✦',  label: 'YES',      color: '#22d3ee', colorClass: 'text-cyan-400' },
  fuel:     { icon: '🔥', label: 'Fuel',     color: '#fb923c', colorClass: 'text-orange-400' },
}

/* ═══════════════════════════════════════════
   TRADE TERMINAL COMPONENT
═══════════════════════════════════════════ */
export default function TradeTerminal({ open, onClose, resources, onResourcesChange }: TradeTerminalProps) {
  const [tab, setTab] = useState<'link' | 'transfer' | 'convert' | 'history'>('link')
  const [link, setLink] = useState<YieldVerseLink | null>(null)
  const [yvWallet, setYvWallet] = useState<YVWallet | null>(null)
  const [loading, setLoading] = useState(false)

  // Link
  const [linkUsername, setLinkUsername] = useState('')
  const [linkStatus, setLinkStatus] = useState<'idle' | 'searching' | 'found' | 'notfound' | 'linked' | 'error'>('idle')

  // Transfer YES → YieldVerse
  const [yesAmount, setYesAmount] = useState('')
  const [transferStatus, setTransferStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [transferMsg, setTransferMsg] = useState('')

  // Import from YieldVerse
  const [importSource, setImportSource] = useState<'energy' | 'fuel'>('energy')
  const [importTarget, setImportTarget] = useState<'energy' | 'minerals' | 'credits'>('energy')
  const [importAmount, setImportAmount] = useState('')
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [importMsg, setImportMsg] = useState('')

  // Convert
  const [convertFrom, setConvertFrom] = useState<'energy' | 'minerals' | 'credits'>('energy')
  const [convertTo, setConvertTo] = useState<'energy' | 'minerals' | 'credits'>('minerals')
  const [convertAmount, setConvertAmount] = useState('')

  // History
  const [transfers, setTransfers] = useState<TransferLog[]>([])

  // ═══ LOAD LINK STATUS ═══
  useEffect(() => {
    if (!open) return
    loadLink()
  }, [open])

  const loadLink = async () => {
    const playerId = getPlayerId()
    try {
      const { data } = await supabase
        .from('starforge_saves')
        .select('yieldverse_user_id, yieldverse_username')
        .eq('player_id', playerId)
        .single()

      if (data?.yieldverse_user_id) {
        setLink({ userId: data.yieldverse_user_id, username: data.yieldverse_username || '???' })
        setTab('transfer')
        loadYVWallet(data.yieldverse_user_id)
        loadTransferHistory(data.yieldverse_user_id)
      }
    } catch {}
  }

  const loadYVWallet = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('wallets')
        .select('energy, fuel, yes_tokens')
        .eq('user_id', userId)
        .single()
      if (data) setYvWallet(data)
    } catch {}
  }

  const loadTransferHistory = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('cross_game_transfers')
        .select('*')
        .eq('yieldverse_user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setTransfers(data)
    } catch {}
  }

  // ═══ LINK ACCOUNT ═══
  const handleLink = async () => {
    if (!linkUsername.trim()) return
    setLinkStatus('searching')

    try {
      // Look up username in users table
      const { data, error } = await supabase
        .from('users')
        .select('id, username')
        .ilike('username', linkUsername.trim())
        .single()

      if (error || !data) {
        setLinkStatus('notfound')
        return
      }

      setLinkStatus('found')

      // Save link to starforge_saves
      const playerId = getPlayerId()
      const { error: updateErr } = await supabase
        .from('starforge_saves')
        .update({
          yieldverse_user_id: data.id,
          yieldverse_username: data.username
        })
        .eq('player_id', playerId)

      if (updateErr) {
        setLinkStatus('error')
        return
      }

      setLink({ userId: data.id, username: data.username })
      setLinkStatus('linked')
      loadYVWallet(data.id)
      loadTransferHistory(data.id)

      setTimeout(() => {
        setTab('transfer')
        setLinkStatus('idle')
      }, 1500)
    } catch {
      setLinkStatus('error')
    }
  }

  // ═══ UNLINK ACCOUNT ═══
  const handleUnlink = async () => {
    const playerId = getPlayerId()
    await supabase
      .from('starforge_saves')
      .update({ yieldverse_user_id: null, yieldverse_username: null })
      .eq('player_id', playerId)
    setLink(null)
    setYvWallet(null)
    setTab('link')
  }

  // ═══ TRANSFER YES → YIELDVERSE ═══
  const handleTransferYES = async () => {
    const amount = parseInt(yesAmount)
    if (!amount || amount < 1 || !link) return
    if (amount > resources.yes) {
      setTransferMsg('Insufficient YES tokens!')
      setTransferStatus('error')
      return
    }

    setTransferStatus('processing')
    try {
      const playerId = getPlayerId()
      const { data, error } = await supabase.rpc('transfer_yes_to_yieldverse', {
        p_starforge_player_id: playerId,
        p_yieldverse_user_id: link.userId,
        p_amount: amount
      })

      if (error) throw error
      if (data?.success) {
        // Update local resources
        onResourcesChange({ ...resources, yes: resources.yes - amount })
        setTransferMsg(`✦ ${amount} YES sent to YieldVerse!`)
        setTransferStatus('success')
        setYesAmount('')
        loadYVWallet(link.userId)
        loadTransferHistory(link.userId)
      } else {
        setTransferMsg(data?.error || 'Transfer failed')
        setTransferStatus('error')
      }
    } catch (err: any) {
      setTransferMsg(err.message || 'Transfer failed')
      setTransferStatus('error')
    }
    setTimeout(() => setTransferStatus('idle'), 3000)
  }

  // ═══ IMPORT FROM YIELDVERSE ═══
  const handleImport = async () => {
    const amount = parseInt(importAmount)
    if (!amount || amount < 1 || !link) return

    const maxAvail = importSource === 'energy' ? (yvWallet?.energy || 0) : (yvWallet?.fuel || 0)
    if (amount > maxAvail) {
      setImportMsg(`Not enough ${importSource} in YieldVerse!`)
      setImportStatus('error')
      setTimeout(() => setImportStatus('idle'), 3000)
      return
    }

    setImportStatus('processing')
    try {
      const playerId = getPlayerId()
      const { data, error } = await supabase.rpc('transfer_to_starforge', {
        p_starforge_player_id: playerId,
        p_yieldverse_user_id: link.userId,
        p_source_resource: importSource,
        p_source_amount: amount,
        p_target_resource: importTarget
      })

      if (error) throw error
      if (data?.success) {
        const converted = data.converted
        // Update local resources
        const newRes = { ...resources }
        if (importTarget === 'energy') newRes.energy += converted
        else if (importTarget === 'minerals') newRes.minerals += converted
        else if (importTarget === 'credits') newRes.credits += converted
        onResourcesChange(newRes)

        setImportMsg(`${RES_INFO[importSource].icon} ${amount} ${importSource} → ${RES_INFO[importTarget].icon} ${converted} ${importTarget}!`)
        setImportStatus('success')
        setImportAmount('')
        loadYVWallet(link.userId)
        loadTransferHistory(link.userId)
      } else {
        setImportMsg(data?.error || 'Import failed')
        setImportStatus('error')
      }
    } catch (err: any) {
      setImportMsg(err.message || 'Import failed')
      setImportStatus('error')
    }
    setTimeout(() => setImportStatus('idle'), 3000)
  }

  // ═══ CONVERT RESOURCES (LOCAL) ═══
  const handleConvert = useCallback(() => {
    const amount = parseInt(convertAmount)
    if (!amount || amount < 10 || convertFrom === convertTo) return

    const available = resources[convertFrom]
    if (amount > available) return

    const rate = CONVERT_RATES[convertFrom]?.[convertTo] || 0
    const received = Math.floor(amount * rate)
    if (received < 1) return

    const newRes = { ...resources }
    newRes[convertFrom] -= amount
    newRes[convertTo] += received
    onResourcesChange(newRes)
    setConvertAmount('')
  }, [convertAmount, convertFrom, convertTo, resources, onResourcesChange])

  // Preview
  const convertPreview = (() => {
    const amount = parseInt(convertAmount) || 0
    if (amount < 10 || convertFrom === convertTo) return 0
    return Math.floor(amount * (CONVERT_RATES[convertFrom]?.[convertTo] || 0))
  })()

  const importPreview = (() => {
    const amount = parseInt(importAmount) || 0
    if (amount < 1) return 0
    const rate = importSource === 'energy' ? 0.2 : 0.5
    return Math.floor(amount * rate)
  })()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Wormhole effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse, rgba(34,211,238,0.3) 0%, rgba(139,92,246,0.15) 40%, transparent 70%)', animation: 'pulse-glow 4s ease-in-out infinite' }} />
      </div>

      {/* Terminal Panel */}
      <div
        className="relative w-[95vw] max-w-[520px] max-h-[85vh] rounded-2xl overflow-hidden animate-warp-in flex flex-col"
        style={{ background: 'rgba(4,8,20,0.97)', border: '1px solid rgba(34,211,238,0.2)', boxShadow: '0 0 80px rgba(34,211,238,0.08), 0 0 40px rgba(139,92,246,0.06), inset 0 1px 0 rgba(255,255,255,0.05)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Scan line */}
        <div className="absolute inset-0 pointer-events-none scan-line opacity-30" />

        {/* ═══ HEADER ═══ */}
        <div className="relative px-5 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(139,92,246,0.15))', border: '1px solid rgba(34,211,238,0.2)' }}>
                🌀
              </div>
              <div>
                <h2 className="font-bold text-sm tracking-wide" style={{ fontFamily: 'Orbitron, sans-serif' }}>GALACTIC TRADE TERMINAL</h2>
                <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  StarForge ↔ YieldVerse Bridge
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Link status badge */}
          {link && (
            <div className="mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[11px] font-medium">Linked to <strong>{link.username}</strong></span>
              <span className="text-[10px] text-gray-600 ml-auto">on YieldVerse</span>
            </div>
          )}

          {/* ═══ TABS ═══ */}
          <div className="flex gap-1 mt-3">
            {[
              { id: 'link' as const, icon: '🔗', label: 'Link' },
              { id: 'transfer' as const, icon: '🚀', label: 'Transfer' },
              { id: 'convert' as const, icon: '⚗️', label: 'Convert' },
              { id: 'history' as const, icon: '📜', label: 'History' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                disabled={t.id !== 'link' && t.id !== 'convert' && !link}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium transition-all ${
                  tab === t.id
                    ? 'bg-white/[0.08] text-white border border-cyan-500/20'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <span className="text-sm">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ CONTENT ═══ */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: 'calc(85vh - 180px)' }}>

          {/* ════════════════════════════════════ */}
          {/* TAB: LINK ACCOUNT                   */}
          {/* ════════════════════════════════════ */}
          {tab === 'link' && (
            <div className="space-y-4">
              {!link ? (
                <>
                  <div className="text-center py-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl"
                      style={{ background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(34,211,238,0.15)' }}>
                      🔗
                    </div>
                    <h3 className="font-bold text-sm mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>Connect YieldVerse</h3>
                    <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      Link your YieldVerse account to transfer YES tokens and import resources across games.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[11px] font-medium text-gray-400">YieldVerse Username</label>
                    <input
                      type="text"
                      value={linkUsername}
                      onChange={e => { setLinkUsername(e.target.value); setLinkStatus('idle') }}
                      onKeyDown={e => e.key === 'Enter' && handleLink()}
                      placeholder="Enter your YieldVerse username..."
                      className="w-full px-4 py-3 rounded-xl text-sm transition-all outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: linkStatus === 'notfound' ? '1px solid rgba(239,68,68,0.4)' : linkStatus === 'found' || linkStatus === 'linked' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        color: '#fff'
                      }}
                    />
                    
                    {linkStatus === 'notfound' && (
                      <p className="text-red-400 text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" /> Username not found on YieldVerse
                      </p>
                    )}
                    {linkStatus === 'linked' && (
                      <p className="text-emerald-400 text-[11px] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3" /> Account linked successfully!
                      </p>
                    )}
                    {linkStatus === 'error' && (
                      <p className="text-red-400 text-[11px] flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3" /> Error linking account. Try again.
                      </p>
                    )}

                    <button
                      onClick={handleLink}
                      disabled={!linkUsername.trim() || linkStatus === 'searching' || linkStatus === 'linked'}
                      className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg, #0891b2, #7c3aed)', border: 'none', color: '#fff' }}
                    >
                      {linkStatus === 'searching' ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> :
                       linkStatus === 'linked' ? <><CheckCircle2 className="w-4 h-4" /> Linked!</> :
                       <><Link2 className="w-4 h-4" /> Connect Account</>}
                    </button>
                  </div>

                  <div className="mt-4 p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      No YieldVerse account?{' '}
                      <a href="https://yieldverse.io/register" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline inline-flex items-center gap-0.5">
                        Create one <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </p>
                  </div>
                </>
              ) : (
                /* ═══ ALREADY LINKED ═══ */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)' }}>
                    <div className="text-3xl mb-2">✅</div>
                    <h3 className="font-bold text-sm text-emerald-400 mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>ACCOUNT LINKED</h3>
                    <p className="text-white text-sm font-bold">{link.username}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>YieldVerse Account</p>
                  </div>

                  {/* YieldVerse Wallet Preview */}
                  {yvWallet && (
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="text-[10px] font-bold tracking-widest text-gray-500 mb-3" style={{ fontFamily: 'Orbitron, sans-serif' }}>YIELDVERSE WALLET</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <p className="text-yellow-400 font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>{yvWallet.energy.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-500">⚡ Energy</p>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <p className="text-orange-400 font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>{yvWallet.fuel.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-500">🔥 Fuel</p>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                          <p className="text-cyan-400 font-bold text-sm" style={{ fontFamily: 'Orbitron, sans-serif' }}>{yvWallet.yes_tokens.toLocaleString()}</p>
                          <p className="text-[9px] text-gray-500">✦ YES</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleUnlink}
                    className="w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all"
                    style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171' }}
                  >
                    <Unlink className="w-3 h-3" /> Unlink Account
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════ */}
          {/* TAB: CROSS-GAME TRANSFER            */}
          {/* ════════════════════════════════════ */}
          {tab === 'transfer' && link && (
            <div className="space-y-5">
              {/* ═══ SECTION 1: Send YES → YieldVerse ═══ */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.1)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: 'rgba(34,211,238,0.1)' }}>🚀</div>
                  <div>
                    <h3 className="text-xs font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>EXPORT YES → YIELDVERSE</h3>
                    <p className="text-[9px] text-gray-500">Send YES tokens to your YieldVerse wallet (1:1)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={yesAmount}
                      onChange={e => setYesAmount(e.target.value)}
                      placeholder="Amount"
                      min="1"
                      max={resources.yes}
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none pr-16"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                    />
                    <button
                      onClick={() => setYesAmount(String(resources.yes))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3 text-[11px]">
                  <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-cyan-400 font-bold">{resources.yes}</span>
                    <span className="text-gray-500 ml-1">✦ SF</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-gray-600" />
                  <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-cyan-400 font-bold">{yvWallet?.yes_tokens || 0}</span>
                    <span className="text-gray-500 ml-1">✦ YV</span>
                  </div>
                </div>

                {transferStatus === 'success' && <p className="text-emerald-400 text-[11px] mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {transferMsg}</p>}
                {transferStatus === 'error' && <p className="text-red-400 text-[11px] mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {transferMsg}</p>}

                <button
                  onClick={handleTransferYES}
                  disabled={!yesAmount || parseInt(yesAmount) < 1 || parseInt(yesAmount) > resources.yes || transferStatus === 'processing'}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: '#fff' }}
                >
                  {transferStatus === 'processing' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Transferring...</> :
                   <>Send {yesAmount || '0'} YES → YieldVerse</>}
                </button>
              </div>

              {/* ═══ SECTION 2: Import from YieldVerse ═══ */}
              <div className="p-4 rounded-xl" style={{ background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.1)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: 'rgba(139,92,246,0.1)' }}>📦</div>
                  <div>
                    <h3 className="text-xs font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>IMPORT FROM YIELDVERSE</h3>
                    <p className="text-[9px] text-gray-500">Convert YV resources into StarForge materials</p>
                  </div>
                </div>

                {/* Source selector */}
                <div className="mb-3">
                  <p className="text-[10px] text-gray-500 mb-1.5">Send from YieldVerse:</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['energy', 'fuel'] as const).map(res => (
                      <button key={res} onClick={() => setImportSource(res)}
                        className={`p-2 rounded-lg text-[11px] font-medium transition-all ${importSource === res ? 'ring-1 ring-cyan-500/40' : ''}`}
                        style={{ background: importSource === res ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <span>{RES_INFO[res].icon}</span> <span className={RES_INFO[res].colorClass}>{(res === 'energy' ? yvWallet?.energy : yvWallet?.fuel) || 0}</span> <span className="text-gray-600">{res}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target selector */}
                <div className="mb-3">
                  <p className="text-[10px] text-gray-500 mb-1.5">Receive in StarForge:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(['energy', 'minerals', 'credits'] as const).map(res => (
                      <button key={res} onClick={() => setImportTarget(res)}
                        className={`p-2 rounded-lg text-[11px] font-medium text-center transition-all ${importTarget === res ? 'ring-1 ring-purple-500/40' : ''}`}
                        style={{ background: importTarget === res ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {RES_INFO[res].icon} <span className="text-gray-400">{RES_INFO[res].label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount + preview */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      value={importAmount}
                      onChange={e => setImportAmount(e.target.value)}
                      placeholder={`${importSource === 'energy' ? '500 min' : '100 min'}`}
                      min="1"
                      className="w-full px-3 py-2.5 rounded-lg text-sm outline-none pr-16"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                    />
                    <button
                      onClick={() => setImportAmount(String(importSource === 'energy' ? yvWallet?.energy || 0 : yvWallet?.fuel || 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {importPreview > 0 && (
                  <div className="mb-3 p-2 rounded-lg text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-[11px] text-gray-400">
                      {RES_INFO[importSource].icon} {importAmount} {importSource}
                    </span>
                    <span className="text-gray-600 mx-2">→</span>
                    <span className={`text-[11px] font-bold ${RES_INFO[importTarget].colorClass}`}>
                      {RES_INFO[importTarget].icon} {importPreview} {importTarget}
                    </span>
                  </div>
                )}

                <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <p className="text-[9px] text-gray-600">
                    Rate: {importSource === 'energy' ? '500 YV Energy → 100 SF' : '100 YV Fuel → 50 SF'} • Choose what you need!
                  </p>
                </div>

                {importStatus === 'success' && <p className="text-emerald-400 text-[11px] mb-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {importMsg}</p>}
                {importStatus === 'error' && <p className="text-red-400 text-[11px] mb-2 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {importMsg}</p>}

                <button
                  onClick={handleImport}
                  disabled={!importAmount || importPreview < 1 || importStatus === 'processing'}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff' }}
                >
                  {importStatus === 'processing' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Importing...</> :
                   <>Import {importPreview || 0} {RES_INFO[importTarget].icon} {importTarget}</>}
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════ */}
          {/* TAB: RESOURCE CONVERTER              */}
          {/* ════════════════════════════════════ */}
          {tab === 'convert' && (
            <div className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(139,92,246,0.1))', border: '1px solid rgba(245,158,11,0.15)' }}>
                  ⚗️
                </div>
                <h3 className="font-bold text-xs mb-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>RESOURCE CONVERTER</h3>
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Transform StarForge resources into what you need</p>
              </div>

              {/* Current resources */}
              <div className="grid grid-cols-3 gap-2">
                {(['energy', 'minerals', 'credits'] as const).map(res => (
                  <div key={res} className="text-center p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className={`text-lg font-black ${RES_INFO[res].colorClass}`} style={{ fontFamily: 'Orbitron, sans-serif' }}>{resources[res]}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{RES_INFO[res].icon} {RES_INFO[res].label}</p>
                  </div>
                ))}
              </div>

              {/* FROM selector */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>FROM</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['energy', 'minerals', 'credits'] as const).map(res => (
                    <button key={res} onClick={() => { setConvertFrom(res); if (res === convertTo) setConvertTo(res === 'energy' ? 'minerals' : 'energy') }}
                      className={`p-3 rounded-xl text-center transition-all ${convertFrom === res ? 'ring-1 ring-cyan-500/40' : ''}`}
                      style={{
                        background: convertFrom === res ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}>
                      <span className="text-lg">{RES_INFO[res].icon}</span>
                      <p className={`text-[10px] mt-1 ${convertFrom === res ? RES_INFO[res].colorClass : 'text-gray-500'}`}>{RES_INFO[res].label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <ArrowRightLeft className="w-4 h-4 text-gray-500" />
                </div>
              </div>

              {/* TO selector */}
              <div>
                <p className="text-[10px] font-bold tracking-widest text-gray-500 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>TO</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['energy', 'minerals', 'credits'] as const).filter(r => r !== convertFrom).map(res => (
                    <button key={res} onClick={() => setConvertTo(res)}
                      className={`p-3 rounded-xl text-center transition-all ${convertTo === res ? 'ring-1 ring-purple-500/40' : ''}`}
                      style={{
                        background: convertTo === res ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)'
                      }}>
                      <span className="text-lg">{RES_INFO[res].icon}</span>
                      <p className={`text-[10px] mt-1 ${convertTo === res ? RES_INFO[res].colorClass : 'text-gray-500'}`}>{RES_INFO[res].label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[10px] text-gray-500">Amount to convert (min 10)</p>
                  <p className="text-[10px] text-gray-600">
                    Rate: {((CONVERT_RATES[convertFrom]?.[convertTo] || 0) * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    value={convertAmount}
                    onChange={e => setConvertAmount(e.target.value)}
                    placeholder="Enter amount..."
                    min="10"
                    max={resources[convertFrom]}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-16"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' }}
                  />
                  <button
                    onClick={() => setConvertAmount(String(resources[convertFrom]))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Preview */}
              {convertPreview > 0 && (
                <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className={`text-lg font-bold ${RES_INFO[convertFrom].colorClass}`}>{convertAmount}</span>
                  <span className="text-gray-500 text-sm"> {RES_INFO[convertFrom].icon}</span>
                  <span className="text-gray-600 mx-3">→</span>
                  <span className={`text-lg font-bold ${RES_INFO[convertTo].colorClass}`}>{convertPreview}</span>
                  <span className="text-gray-500 text-sm"> {RES_INFO[convertTo].icon}</span>
                </div>
              )}

              <button
                onClick={handleConvert}
                disabled={!convertAmount || convertPreview < 1 || parseInt(convertAmount) > resources[convertFrom]}
                className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#000' }}
              >
                ⚗️ Convert {convertAmount || 0} {RES_INFO[convertFrom].label} → {convertPreview || 0} {RES_INFO[convertTo].label}
              </button>

              {/* Rates table */}
              <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)' }}>
                <p className="text-[9px] font-bold tracking-widest text-gray-600 mb-2" style={{ fontFamily: 'Orbitron, sans-serif' }}>CONVERSION RATES</p>
                <div className="space-y-1 text-[10px] text-gray-500">
                  <p>⚡ 100 Energy → 💎 65 Minerals <span className="text-gray-700">|</span> 💰 50 Credits</p>
                  <p>💎 100 Minerals → ⚡ 65 Energy <span className="text-gray-700">|</span> 💰 50 Credits</p>
                  <p>💰 100 Credits → ⚡ 35 Energy <span className="text-gray-700">|</span> 💎 35 Minerals</p>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════ */}
          {/* TAB: TRANSFER HISTORY                */}
          {/* ════════════════════════════════════ */}
          {tab === 'history' && link && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold" style={{ fontFamily: 'Orbitron, sans-serif' }}>TRANSFER HISTORY</h3>
                <button onClick={() => loadTransferHistory(link.userId)} className="text-[10px] text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                  <History className="w-3 h-3" /> Refresh
                </button>
              </div>

              {transfers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 text-sm">No transfers yet</p>
                  <p className="text-[10px] text-gray-700 mt-1">Your cross-game transfers will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transfers.map(t => (
                    <div key={t.id} className="p-3 rounded-xl flex items-center gap-3"
                      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        t.direction === 'starforge_to_yieldverse' ? 'bg-cyan-500/10' : 'bg-purple-500/10'
                      }`}>
                        {t.direction === 'starforge_to_yieldverse' ? '🚀' : '📦'}
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-medium text-white">
                          {t.direction === 'starforge_to_yieldverse'
                            ? `Sent ${t.amount} ${RES_INFO[t.resource_type]?.icon || ''} ${t.resource_type} → YV`
                            : `Imported ${t.source_amount || t.amount} ${RES_INFO[t.source_resource || t.resource_type]?.icon || ''} → ${t.amount} ${RES_INFO[t.resource_type]?.icon || ''}`
                          }
                        </p>
                        <p className="text-[9px] text-gray-600">{new Date(t.created_at).toLocaleString()}</p>
                      </div>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/40" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="px-5 py-3 border-t border-white/[0.04] flex-shrink-0">
          <div className="flex items-center justify-between text-[9px] text-gray-600">
            <span>StarForge ↔ YieldVerse Bridge v1.0</span>
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
