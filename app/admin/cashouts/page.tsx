'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, RefreshCw, CheckCircle, XCircle, Clock, 
  DollarSign, Send, AlertCircle, Users, Coins, Shield
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Cashout = {
  id: string
  user_id: string
  amount: number
  faucetpay_email: string
  status: 'pending' | 'completed' | 'failed'
  created_at: string
  user?: {
    username: string
    email: string
  }
}

// Admin emails autorisés
const ADMIN_EMAILS = ['gtrust1985@gmail.com']

export default function AdminCashoutsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [cashouts, setCashouts] = useState<Cashout[]>([])
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [stats, setStats] = useState({ pending: 0, completed: 0, totalPending: 0 })

  useEffect(() => {
    setMounted(true)
    checkAdminAndLoad()
  }, [])

  const checkAdminAndLoad = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Vérifier si admin
      if (!ADMIN_EMAILS.includes(session.user.email || '')) {
        router.push('/dashboard')
        return
      }

      setIsAdmin(true)
      await loadCashouts()

    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCashouts = async () => {
    try {
      // Charger les wallets avec cashouts pending (yes_tokens négatifs ou faucetpay_email défini)
      // On va plutôt créer une table cashouts ou utiliser les users avec total_cashout_usd
      
      // Pour l'instant, on charge les users qui ont fait des cashouts récemment
      // En regardant ceux qui ont un faucetpay_email et total_cashout_usd > 0
      
      const { data: walletsData, error } = await supabase
        .from('wallets')
        .select('*, users!inner(username, email, total_cashout_usd)')
        .not('faucetpay_email', 'is', null)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Charger aussi depuis une table cashouts si elle existe
      const { data: cashoutsData } = await supabase
        .from('cashouts')
        .select('*')
        .order('created_at', { ascending: false })

      if (cashoutsData && cashoutsData.length > 0) {
        setCashouts(cashoutsData)
        
        const pending = cashoutsData.filter(c => c.status === 'pending')
        const completed = cashoutsData.filter(c => c.status === 'completed')
        
        setStats({
          pending: pending.length,
          completed: completed.length,
          totalPending: pending.reduce((a, c) => a + (c.amount || 0), 0)
        })
      } else {
        // Pas de table cashouts, afficher un message
        setCashouts([])
      }

    } catch (err: any) {
      console.error('Error loading cashouts:', err)
      // Si la table n'existe pas, on crée une liste vide
      setCashouts([])
    }
  }

  const processCashout = async (cashout: Cashout) => {
    if (processing) return
    setProcessing(cashout.id)
    setMessage(null)

    try {
      // Appeler l'API pour envoyer le paiement
      const response = await fetch('/api/admin/process-cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashout_id: cashout.id,
          email: cashout.faucetpay_email,
          amount_usd: cashout.amount * 0.001 // 1000 YES = $1
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessage({ type: 'success', text: `Payment sent to ${cashout.faucetpay_email}!` })
        await loadCashouts()
      } else {
        throw new Error(data.error || 'Failed to process cashout')
      }

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setProcessing(null)
    }
  }

  const markAsCompleted = async (cashoutId: string) => {
    try {
      const { error } = await supabase
        .from('cashouts')
        .update({ status: 'completed' })
        .eq('id', cashoutId)

      if (error) throw error
      
      setMessage({ type: 'success', text: 'Marked as completed!' })
      await loadCashouts()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  const markAsFailed = async (cashoutId: string) => {
    try {
      const { error } = await supabase
        .from('cashouts')
        .update({ status: 'failed' })
        .eq('id', cashoutId)

      if (error) throw error
      
      setMessage({ type: 'success', text: 'Marked as failed!' })
      await loadCashouts()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="spinner" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-red-400">Access Denied</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-red-400" />
              <span className="text-xl font-bold">Admin - Cashouts</span>
            </div>
          </div>
          <button
            onClick={loadCashouts}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-gray-400">Pending</p>
          </div>
          <div className="bg-green-900/30 border border-green-500/30 rounded-xl p-6 text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-3xl font-bold text-green-400">{stats.completed}</p>
            <p className="text-gray-400">Completed</p>
          </div>
          <div className="bg-cyan-900/30 border border-cyan-500/30 rounded-xl p-6 text-center">
            <Coins className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
            <p className="text-3xl font-bold text-cyan-400">{stats.totalPending} YES</p>
            <p className="text-gray-400">Total Pending</p>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-900/30 border border-green-500/50 text-green-400' 
              : 'bg-red-900/30 border border-red-500/50 text-red-400'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Create Cashouts Table Info */}
        {cashouts.length === 0 && (
          <div className="bg-blue-900/30 border border-blue-500/30 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold mb-4 text-blue-400">📋 Setup Required</h3>
            <p className="text-gray-300 mb-4">Pour tracker les cashouts, crée cette table dans Supabase :</p>
            <pre className="bg-black/50 p-4 rounded-lg text-sm overflow-x-auto text-green-400">
{`CREATE TABLE cashouts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  amount INTEGER NOT NULL,
  faucetpay_email VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);`}
            </pre>
            <p className="text-gray-400 mt-4 text-sm">
              Ensuite, modifie la page cashout pour insérer dans cette table lors d'une demande.
            </p>
          </div>
        )}

        {/* Cashouts Table */}
        {cashouts.length > 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Date</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">User</th>
                  <th className="px-4 py-3 text-left text-sm text-gray-400">Email FaucetPay</th>
                  <th className="px-4 py-3 text-right text-sm text-gray-400">Amount</th>
                  <th className="px-4 py-3 text-center text-sm text-gray-400">Status</th>
                  <th className="px-4 py-3 text-center text-sm text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {cashouts.map((cashout) => (
                  <tr key={cashout.id} className="border-t border-gray-700 hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm">
                      {new Date(cashout.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {cashout.user?.username || cashout.user_id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-cyan-400">
                      {cashout.faucetpay_email}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="text-yellow-400 font-bold">{cashout.amount} YES</span>
                      <br />
                      <span className="text-gray-500 text-xs">${(cashout.amount * 0.001).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cashout.status === 'pending' && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>
                      )}
                      {cashout.status === 'completed' && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Completed</span>
                      )}
                      {cashout.status === 'failed' && (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Failed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {cashout.status === 'pending' && (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => processCashout(cashout)}
                            disabled={processing === cashout.id}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                          >
                            {processing === cashout.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Send
                          </button>
                          <button
                            onClick={() => markAsCompleted(cashout.id)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                          >
                            ✓ Done
                          </button>
                          <button
                            onClick={() => markAsFailed(cashout.id)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                          >
                            ✗ Fail
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Manual Process Info */}
        <div className="mt-8 bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-4">📤 Process Manually on FaucetPay</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Go to <a href="https://faucetpay.io/page/send-payment" target="_blank" className="text-cyan-400 hover:underline">FaucetPay Send Payment</a></li>
            <li>Select <strong>LTC (Litecoin)</strong></li>
            <li>Enter the user's <strong>FaucetPay email</strong></li>
            <li>Enter the <strong>USD amount</strong> (100 YES = $0.10)</li>
            <li>Click <strong>Send</strong></li>
            <li>Come back here and click <strong>"✓ Done"</strong> to mark as completed</li>
          </ol>
        </div>

      </div>
    </div>
  )
}
