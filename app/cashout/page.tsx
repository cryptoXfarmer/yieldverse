'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Coins, DollarSign, Wallet, RefreshCw,
  ArrowRight, AlertCircle, CheckCircle, ExternalLink, Mail, Zap, Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import SpotlightTour, { type SpotlightStep } from '@/components/SpotlightTour'

// ALPHA: Fee system
const REFERRER_FEE_PERCENT = 3 // 3% to referrer
const POOL_FEE_PERCENT = 2 // 2% to event pool
const FOUNDER_EMAIL = 'gtrust1985@gmail.com'

export default function CashoutPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [faucetPayBalance, setFaucetPayBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [faucetpayEmail, setFaucetpayEmail] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [canCashout, setCanCashout] = useState(true)
  const [nextCashoutTime, setNextCashoutTime] = useState<string>('')

  // AAA spotlight tour (optional) — triggered via /cashout?tour=withdraw
  const [tourOpen, setTourOpen] = useState(false)
  const [tourMode, setTourMode] = useState<string | null>(null)

  useEffect(() => {
    try {
      const t = new URLSearchParams(window.location.search).get('tour')
      if (t) {
        setTourMode(t)
        setTourOpen(true)
      }
    } catch {}
  }, [])

  const closeTour = () => {
    setTourOpen(false)
    setTourMode(null)
    try {
      const params = new URLSearchParams(window.location.search)
      params.delete('tour')
      const qs = params.toString()
      router.replace(qs ? `/cashout?${qs}` : '/cashout')
    } catch {
      router.replace('/cashout')
    }
  }

  const tourSteps: SpotlightStep[] = useMemo(() => {
    if (tourMode !== 'withdraw') return []
    return [
      {
        id: 'amount',
        title: 'Choose amount',
        body: 'Enter how many YES you want to withdraw (minimum shown in the placeholder).',
        target: '[data-tour="cashoutAmount"]',
      },
      {
        id: 'email',
        title: 'Your FaucetPay email',
        body: 'Paste the email linked to your FaucetPay account. Payout goes there instantly.',
        target: '[data-tour="faucetpayEmail"]',
      },
      {
        id: 'submit',
        title: 'Send instant cashout',
        body: 'Press Instant Cashout to send the payment (1 cashout per 24 hours).',
        target: '[data-tour="cashoutSubmit"]',
        nextLabel: 'Done',
      },
    ]
  }, [tourMode])

  const MIN_CASHOUT = 10
  const YES_TO_USD = 0.001
  const CASHOUT_COOLDOWN = 24 * 60 * 60 * 1000 // 24 heures

  useEffect(() => {
    setMounted(true)
    loadData()
    loadFaucetPayBalance()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }

      const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single()
      const { data: walletData } = await supabase.from('wallets').select('*').eq('user_id', session.user.id).single()

      setUser(userData)
      setWallet(walletData)
      if (walletData?.faucetpay_email) setFaucetpayEmail(walletData.faucetpay_email)

      // Check si peut cashout (1 par jour)
      if (userData?.last_cashout_at) {
        const lastCashout = new Date(userData.last_cashout_at).getTime()
        const nextAllowed = lastCashout + CASHOUT_COOLDOWN
        if (Date.now() < nextAllowed) {
          setCanCashout(false)
          const remaining = nextAllowed - Date.now()
          const hours = Math.floor(remaining / (60 * 60 * 1000))
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
          setNextCashoutTime(`${hours}h ${minutes}m`)
        }
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadFaucetPayBalance = async () => {
    setLoadingBalance(true)
    try {
      const response = await fetch('/api/faucetpay/balance')
      const data = await response.json()
      if (data.success) setFaucetPayBalance(data.balance)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoadingBalance(false)
    }
  }

  const formatLTC = (satoshis: number) => (satoshis / 100000000).toFixed(8)
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleInstantCashout = async () => {
    setError('')
    setSuccess('')
    const amount = parseInt(cashoutAmount)

    if (!canCashout) { setError(`You can only cashout once per day. Next cashout in ${nextCashoutTime}`); return }
    if (!amount || amount < MIN_CASHOUT) { setError(`Minimum cashout is ${MIN_CASHOUT} YES`); return }
    if (!wallet || amount > (wallet.yes_tokens || 0)) { setError('Insufficient YES tokens'); return }
    if (!faucetpayEmail || !validateEmail(faucetpayEmail)) { setError('Please enter a valid FaucetPay email'); return }

    setProcessing(true)
    try {
      // Calculer les fees
      const referrerFee = Math.floor(amount * REFERRER_FEE_PERCENT / 100)
      const poolFee = Math.floor(amount * POOL_FEE_PERCENT / 100)
      const netAmount = amount // En ALPHA, le joueur reçoit 100%
      
      const ltcValue = (netAmount * 100 / 100000000).toFixed(8)

      // 1. Envoyer le paiement INSTANT via API FaucetPay
      const payResponse = await fetch('/api/faucetpay/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: faucetpayEmail, amount_yes: netAmount })
      })
      const payData = await payResponse.json()
      if (!payData.success) throw new Error(payData.error || 'Payment failed')

      // 2. Déduire les YES du wallet
      await supabase.from('wallets').update({ 
        yes_tokens: (wallet.yes_tokens || 0) - amount,
        faucetpay_email: faucetpayEmail
      }).eq('user_id', user.id)

      // 3. Mettre à jour les stats et last_cashout_at
      await supabase.from('users').update({ 
        total_cashout_usd: (user.total_cashout_usd || 0) + (amount * YES_TO_USD),
        last_cashout_at: new Date().toISOString()
      }).eq('id', user.id)

      // 4. ALPHA: Commission au referrer (3%)
      if (user.referred_by && referrerFee > 0) {
        // Ajouter les YES au referrer
        const { data: referrerWallet } = await supabase
          .from('wallets')
          .select('yes_tokens')
          .eq('user_id', user.referred_by)
          .single()
        
        if (referrerWallet) {
          await supabase.from('wallets').update({
            yes_tokens: (referrerWallet.yes_tokens || 0) + referrerFee
          }).eq('user_id', user.referred_by)

          // Update referrer earnings
          const { data: referrerUser } = await supabase.from('users')
            .select('ref_earnings_yes')
            .eq('id', user.referred_by)
            .single()
          await supabase.from('users').update({
            ref_earnings_yes: ((referrerUser?.ref_earnings_yes as number) || 0) + referrerFee
          }).eq('id', user.referred_by)
        }

        // Log commission
        try {
          await supabase.from('referral_commissions').insert({
            referrer_id: user.referred_by,
            referred_id: user.id,
            commission_type: 'cashout',
            resource_type: 'yes',
            amount: referrerFee
          })
        } catch (e) { /* table might not exist */ }
      }

      // 5. ALPHA: Pool fee (2%)
      if (poolFee > 0) {
        try {
          await supabase.from('event_pool').insert({
            amount_yes: poolFee,
            source: 'cashout_fee',
            source_user_id: user.id
          })
        } catch (e) { /* table might not exist */ }
      }

      // 6. Enregistrer le cashout
      try {
        await supabase.from('cashouts').insert({
          user_id: user.id,
          amount: amount,
          faucetpay_email: faucetpayEmail,
          status: 'completed',
          processed_at: new Date().toISOString()
        })
      } catch (e) { /* ignore */ }

      setSuccess(`✅ INSTANT PAYMENT SENT! ${netAmount} YES (${ltcValue} LTC) sent to ${faucetpayEmail}`)
      setCashoutAmount('')
      setCanCashout(false)
      setNextCashoutTime('24h 0m')
      loadData()
      loadFaucetPayBalance()

    } catch (err: any) {
      setError(err.message || 'Cashout failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner" /></div>

  return (
    <div className="relative min-h-screen">
      <SpotlightTour open={tourOpen} steps={tourSteps} onClose={closeTour} />
      <div className="stars">{mounted && [...Array(60)].map((_, i) => <div key={i} className="star" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s` }} />)}</div>
      <div className="nebula" />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
          <div className="flex items-center gap-2"><Zap className="w-6 h-6 text-yellow-400" /><span className="text-xl font-bold">Instant Cashout</span></div>
        </div>
      </nav>

      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          
          {/* Cooldown Warning */}
          {!canCashout && (
            <div className="bg-orange-900/30 border border-orange-500/50 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <Clock className="w-6 h-6 text-orange-400" />
              <div>
                <p className="font-bold text-orange-400">Daily Limit Reached</p>
                <p className="text-sm text-orange-200">Next cashout available in <span className="font-bold">{nextCashoutTime}</span></p>
              </div>
            </div>
          )}

          {/* Pool Balance */}
          <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold flex items-center gap-2"><Wallet className="w-5 h-5 text-green-400" />Pool Balance</h2>
              <button onClick={loadFaucetPayBalance} disabled={loadingBalance} className="p-2 hover:bg-white/10 rounded-lg">
                <RefreshCw className={`w-4 h-4 ${loadingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="text-3xl font-bold text-green-400">{faucetPayBalance !== null ? formatLTC(faucetPayBalance) : '---'} LTC</div>
          </div>

          {/* Your Balance */}
          <div className="bg-white/5 border border-cyan-500/30 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Coins className="w-5 h-5 text-cyan-400" />Your YES Balance</h2>
            <div className="text-4xl font-bold text-cyan-400 yes-glow mb-2">{wallet?.yes_tokens?.toLocaleString() || 0} YES</div>
            <p className="text-gray-400">≈ ${((wallet?.yes_tokens || 0) * YES_TO_USD).toFixed(2)} USD</p>
          </div>

          {/* Instant Badge */}
          <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-2xl p-4 mb-6 text-center">
            <div className="flex items-center justify-center gap-2 text-yellow-400">
              <Zap className="w-6 h-6" /><span className="text-xl font-bold">⚡ INSTANT PAYOUTS ⚡</span><Zap className="w-6 h-6" />
            </div>
            <p className="text-gray-400 text-sm mt-1">Payments sent immediately to FaucetPay!</p>
            <p className="text-orange-300 text-xs mt-1">⏰ Limit: 1 cashout per 24 hours</p>
          </div>

          {/* Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6">Instant Cashout</h2>

            {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3"><AlertCircle className="w-5 h-5 text-red-400" /><span className="text-red-400">{error}</span></div>}
            {success && <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-center gap-3"><CheckCircle className="w-5 h-5 text-green-400" /><span className="text-green-400">{success}</span></div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (YES)</label>
                <input type="number" data-tour="cashoutAmount" value={cashoutAmount} onChange={(e) => setCashoutAmount(e.target.value)} placeholder={`Min: ${MIN_CASHOUT} YES`} className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400" disabled={!canCashout} />
                {cashoutAmount && (
                  <p className="text-sm text-green-400 mt-2 font-bold">
                    = {(parseInt(cashoutAmount) * 100 / 100000000).toFixed(8)} LTC
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2 flex items-center gap-2"><Mail className="w-4 h-4" />FaucetPay Email</label>
                <input type="email" data-tour="faucetpayEmail" value={faucetpayEmail} onChange={(e) => setFaucetpayEmail(e.target.value)} placeholder="your-email@faucetpay.io" className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400" disabled={!canCashout} />
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <p className="text-green-400 text-sm"><strong>⚡ Fixed Rate:</strong> 1000 YES = 0.001 LTC • 100 YES = 0.0001 LTC • Min: {MIN_CASHOUT} YES</p>
              </div>

              <button onClick={handleInstantCashout} data-tour="cashoutSubmit" disabled={!canCashout || processing || !cashoutAmount || parseInt(cashoutAmount) < MIN_CASHOUT || !faucetpayEmail} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                {processing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" />{canCashout ? 'Instant Cashout' : 'Cooldown Active'}</>}
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">No FaucetPay? <a href="https://faucetpay.io/?r=2983478" target="_blank" className="text-cyan-400 hover:underline">Register free</a></p>
          </div>
        </div>
      </div>
    </div>
  )
}
