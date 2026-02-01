'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Coins, DollarSign, Wallet, RefreshCw,
  ArrowRight, AlertCircle, CheckCircle, ExternalLink
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function CashoutPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [faucetPayBalance, setFaucetPayBalance] = useState<number | null>(null)
  const [loadingBalance, setLoadingBalance] = useState(false)
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [ltcAddress, setLtcAddress] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const MIN_CASHOUT = 100 // 100 YES = $0.10
  const YES_TO_USD = 0.001 // 1 YES = $0.001 (1000 YES = $1)

  useEffect(() => {
    setMounted(true)
    loadData()
    loadFaucetPayBalance()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      setUser(userData)
      setWallet(walletData)
      if (walletData?.litecoin_address) {
        setLtcAddress(walletData.litecoin_address)
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
      
      if (data.success) {
        setFaucetPayBalance(data.balance)
      }
    } catch (err) {
      console.error('Error loading FaucetPay balance:', err)
    } finally {
      setLoadingBalance(false)
    }
  }

  const formatLTC = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(8)
  }

  const handleCashout = async () => {
    setError('')
    setSuccess('')

    const amount = parseInt(cashoutAmount)

    if (!amount || amount < MIN_CASHOUT) {
      setError(`Minimum cashout is ${MIN_CASHOUT} YES`)
      return
    }

    if (!wallet || amount > (wallet.yes_tokens || 0)) {
      setError('Insufficient YES tokens')
      return
    }

    if (!ltcAddress || !ltcAddress.startsWith('L') && !ltcAddress.startsWith('M') && !ltcAddress.startsWith('ltc1')) {
      setError('Please enter a valid Litecoin address')
      return
    }

    setProcessing(true)

    try {
      // Calculate USD value
      const usdValue = amount * YES_TO_USD

      // Deduct YES from wallet
      const { error: walletError } = await supabase
        .from('wallets')
        .update({ 
          yes_tokens: (wallet.yes_tokens || 0) - amount,
          litecoin_address: ltcAddress
        })
        .eq('user_id', user.id)

      if (walletError) throw walletError

      // Update user stats
      const { error: userError } = await supabase
        .from('users')
        .update({
          total_cashout_usd: (user.total_cashout_usd || 0) + usdValue
        })
        .eq('id', user.id)

      if (userError) throw userError

      // Record transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'cashout',
          amount: amount,
          currency: 'YES',
          usd_value: usdValue,
          status: 'pending',
          destination_address: ltcAddress
        })

      if (txError) console.error('Transaction log error:', txError)

      setSuccess(`Cashout of ${amount} YES ($${usdValue.toFixed(2)}) submitted! Payment will be processed within 24h.`)
      setCashoutAmount('')
      
      // Reload data
      loadData()

    } catch (err: any) {
      setError(err.message || 'Cashout failed')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
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
            }}
          />
        ))}
      </div>
      <div className="nebula" />

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              <span className="text-xl font-bold">Cashout</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          
          {/* FaucetPay Pool Balance */}
          <div className="bg-gradient-to-r from-green-900/30 to-cyan-900/30 border border-green-500/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-green-400" />
                YieldVerse Pool Balance
              </h2>
              <button
                onClick={loadFaucetPayBalance}
                disabled={loadingBalance}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingBalance ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-green-400">
                {faucetPayBalance !== null ? formatLTC(faucetPayBalance) : '---'} LTC
              </div>
              <span className="text-gray-400 text-sm">Available for payouts</span>
            </div>
          </div>

          {/* Your Balance */}
          <div className="bg-white/5 border border-cyan-500/30 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Coins className="w-5 h-5 text-cyan-400" />
              Your YES Balance
            </h2>
            <div className="text-4xl font-bold text-cyan-400 yes-glow mb-2">
              {wallet?.yes_tokens?.toLocaleString() || 0} YES
            </div>
            <p className="text-gray-400">
              ≈ ${((wallet?.yes_tokens || 0) * YES_TO_USD).toFixed(2)} USD
            </p>
          </div>

          {/* Cashout Form */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6">Request Cashout</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-red-400">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400">{success}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Amount (YES)</label>
                <input
                  type="number"
                  value={cashoutAmount}
                  onChange={(e) => setCashoutAmount(e.target.value)}
                  placeholder={`Min: ${MIN_CASHOUT} YES`}
                  min={MIN_CASHOUT}
                  max={wallet?.yes_tokens || 0}
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 transition-colors"
                />
                {cashoutAmount && (
                  <p className="text-sm text-gray-400 mt-2">
                    = ${(parseInt(cashoutAmount) * YES_TO_USD).toFixed(2)} USD
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">Litecoin Address</label>
                <input
                  type="text"
                  value={ltcAddress}
                  onChange={(e) => setLtcAddress(e.target.value)}
                  placeholder="Your LTC address (starts with L, M, or ltc1)"
                  className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 transition-colors"
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-400 text-sm">
                  <strong>Rates:</strong><br/>
                  • 1000 YES = $1.00 LTC<br/>
                  • Minimum: {MIN_CASHOUT} YES ($0.10)<br/>
                  • Processing: Within 24 hours
                </p>
              </div>

              <button
                onClick={handleCashout}
                disabled={processing || !cashoutAmount || parseInt(cashoutAmount) < MIN_CASHOUT}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-cyan-600 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="w-5 h-5" />
                    Request Cashout
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="mt-6 text-center">
            <a 
              href="https://faucetpay.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-cyan-400 transition-colors text-sm flex items-center justify-center gap-1"
            >
              Powered by FaucetPay
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>
      </div>
    </div>
  )
}
