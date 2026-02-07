'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Globe, Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, Gift } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ALPHA: Tous les nouveaux joueurs sont sous la tutelle du Founder
const ALPHA_FOUNDER_EMAIL = 'gtrust1985@gmail.com'

export default function RegisterPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const generatePilotId = () => {
    return `Pilot-${Math.floor(1000 + Math.random() * 9000)}`
  }

  const generateReferralCode = () => {
    return `YV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // ALPHA: Trouver le Founder pour l'assigner comme referrer
        const { data: founderData } = await supabase
          .from('users')
          .select('id')
          .eq('email', ALPHA_FOUNDER_EMAIL)
          .single()

        const founderId = founderData?.id || null

        // Create user profile avec referral
        const pilotId = generatePilotId()
        const refCode = generateReferralCode()
        
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            username: pilotId,
            email: email,
            total_energy_earned: 0,
            total_fuel_earned: 0,
            total_yes_earned: 0,
            total_cashout_usd: 0,
            referred_by: founderId, // ALPHA: Auto-référé par le Founder
            referral_code: refCode
          })

        if (profileError) {
          console.error('Profile error:', profileError)
        }

        // Incrémenter le compteur de referrals du Founder
        if (founderId) {
          await supabase.rpc('increment_referrals', { user_id: founderId })
        }

        // Create wallet
        const { error: walletError } = await supabase
          .from('wallets')
          .insert({
            user_id: authData.user.id,
            energy: 0,
            fuel: 0,
            yes_tokens: 0,
            rare_resources: 0
          })

        if (walletError) {
          console.error('Wallet error:', walletError)
        }

        setSuccess(true)
        
        // Auto login after registration
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err: any) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="stars">
          {mounted && [...Array(80)].map((_, i) => (
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
        
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Welcome to YieldVerse!</h1>
          <p className="text-gray-400 mb-4">Your Pilot account has been created</p>
          <p className="text-cyan-400">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      {/* Stars */}
      <div className="stars">
        {mounted && [...Array(80)].map((_, i) => (
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

      {/* Nebula */}
      <div className="nebula" />

      {/* Register Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 planet-glow flex items-center justify-center animate-spin-slow">
            <Globe className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            YIELDVERSE
          </span>
        </Link>

        {/* Alpha Badge */}
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-3 mb-6 text-center">
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <Gift className="w-5 h-5" />
            <span className="font-bold">ALPHA ACCESS</span>
          </div>
          <p className="text-xs text-yellow-200/70 mt-1">Join the first wave of Pilots!</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">Become a Pilot</h1>
          <p className="text-gray-400 text-center mb-8">Create your account and start earning</p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="pilot@yieldverse.com"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl focus:border-cyan-400 transition-colors"
                  required
                />
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-300">Your Pilot ID will be auto-generated</p>
                  <p className="text-xs text-gray-500">Example: Pilot-4521</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="spinner" />
              ) : (
                <>
                  Create Pilot Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-6">
            Already a Pilot?{' '}
            <Link href="/login" className="text-cyan-400 hover:underline">
              Login
            </Link>
          </p>
          <p className="text-center text-gray-600 mt-3 text-sm">
            New here?{' '}
            <Link href="/help" className="text-cyan-400 hover:underline">
              Read the New Player Guide
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
