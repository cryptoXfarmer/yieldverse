'use client'

import { useState, useEffect } from 'react'
import { Flame, Gift, X, Check, Clock, Star, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const STREAK_REWARDS = [2, 3, 5, 7, 10, 15, 25] // Day 1-7 YES rewards
const DAY_LABELS = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']

interface StreakData {
  streak_count: number
  best_streak: number
  last_claim_date: string | null
  total_claimed_yes: number
}

export default function DailyStreak({ userId }: { userId: string }) {
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [canClaim, setCanClaim] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimResult, setClaimResult] = useState<{ reward: number; streak: number } | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStreak()
  }, [userId])

  // Reminder notification — 10s after load if streak available
  useEffect(() => {
    if (!canClaim || !streak) return
    const dismissed = sessionStorage.getItem('yv_streak_reminder')
    if (dismissed) return
    const timer = setTimeout(() => setShowReminder(true), 10000)
    return () => clearTimeout(timer)
  }, [canClaim, streak])

  const loadStreak = async () => {
    try {
      // Get or create streak
      const { data, error } = await supabase
        .from('daily_streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('game', 'yieldverse')
        .maybeSingle()

      if (!data) {
        // First time — create streak record
        const { data: newData } = await supabase
          .from('daily_streaks')
          .insert({ user_id: userId, game: 'yieldverse', streak_count: 0, best_streak: 0 })
          .select()
          .single()
        setStreak(newData || { streak_count: 0, best_streak: 0, last_claim_date: null, total_claimed_yes: 0 })
        setCanClaim(true)
      } else {
        setStreak(data)
        // Check if already claimed today
        const today = new Date().toISOString().split('T')[0]
        setCanClaim(data.last_claim_date !== today)
      }
    } catch (err) {
      console.error('Failed to load streak:', err)
      setStreak({ streak_count: 0, best_streak: 0, last_claim_date: null, total_claimed_yes: 0 })
      setCanClaim(true)
    } finally {
      setLoading(false)
    }
  }

  const claimStreak = async () => {
    if (!canClaim || claiming) return
    setClaiming(true)
    try {
      const { data, error } = await supabase.rpc('claim_daily_streak', {
        p_user_id: userId,
        p_game: 'yieldverse'
      })

      if (error) throw error
      if (data?.success) {
        setClaimResult({ reward: data.reward, streak: data.streak_count })
        setCanClaim(false)
        setStreak(prev => prev ? {
          ...prev,
          streak_count: data.streak_count,
          best_streak: data.best_streak,
          last_claim_date: new Date().toISOString().split('T')[0],
          total_claimed_yes: data.total_claimed,
        } : prev)
        // Auto-hide result after 4s
        setTimeout(() => setClaimResult(null), 4000)
      } else if (data?.error === 'already_claimed') {
        setCanClaim(false)
      }
    } catch (err) {
      console.error('Failed to claim streak:', err)
    } finally {
      setClaiming(false)
    }
  }

  if (loading) return null

  const currentDay = streak?.streak_count || 0
  // Next day to claim (0 = day 1, currentDay if already claimed today, currentDay+1 if not)
  const nextDay = canClaim ? currentDay : currentDay // Display current if claimed, or what's coming

  return (
    <>
      {/* ═══ STREAK BANNER — Always visible on dashboard ═══ */}
      <div 
        onClick={() => setShowPanel(true)}
        className="relative overflow-hidden rounded-xl border cursor-pointer transition-all hover:brightness-110 group"
        style={{
          background: canClaim 
            ? 'linear-gradient(135deg, rgba(234,88,12,0.15), rgba(220,38,38,0.1))' 
            : 'linear-gradient(135deg, rgba(55,65,81,0.3), rgba(55,65,81,0.2))',
          borderColor: canClaim ? 'rgba(234,88,12,0.3)' : 'rgba(75,85,99,0.3)',
        }}
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              canClaim 
                ? 'bg-gradient-to-br from-orange-500 to-red-500 shadow-lg shadow-orange-500/30' 
                : 'bg-gray-700'
            }`}>
              <Flame className={`w-6 h-6 ${canClaim ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm">Daily Streak</p>
                {currentDay > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20 font-bold">
                    🔥 {currentDay}/7
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {canClaim 
                  ? `Claim today for ${STREAK_REWARDS[currentDay > 6 ? 0 : currentDay]} YES!` 
                  : `Claimed! Come back tomorrow for Day ${currentDay >= 7 ? 1 : currentDay + 1}`
                }
              </p>
            </div>
          </div>

          {canClaim ? (
            <button
              onClick={(e) => { e.stopPropagation(); claimStreak() }}
              disabled={claiming}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:brightness-110 font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-orange-500/20"
            >
              {claiming ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Gift className="w-4 h-4" />
              )}
              Claim
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-500 text-xs">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">Done</span>
            </div>
          )}
        </div>

        {/* Mini progress dots */}
        <div className="px-4 pb-3 flex gap-1.5">
          {STREAK_REWARDS.map((reward, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-800">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  i < currentDay ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                  i === currentDay && canClaim ? 'bg-orange-500/40 animate-pulse' :
                  'bg-transparent'
                }`} 
                style={{ width: i < currentDay ? '100%' : i === currentDay && canClaim ? '100%' : '0%' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ═══ CLAIM RESULT TOAST ═══ */}
      {claimResult && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[999]" style={{ animation: 'streakToast 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div className="bg-gradient-to-r from-orange-900/90 to-red-900/90 backdrop-blur-lg border border-orange-500/30 rounded-2xl px-6 py-4 shadow-2xl shadow-orange-500/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <span className="text-xl">🎁</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">Day {claimResult.streak} Claimed! 🔥</p>
              <p className="text-orange-300 text-xs">+{claimResult.reward} YES tokens earned</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STREAK DETAIL PANEL ═══ */}
      {showPanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPanel(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}
            style={{ animation: 'streakPanel 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <h2 className="font-bold text-lg">Daily Streak</h2>
              </div>
              <button onClick={() => setShowPanel(false)} className="text-gray-500 hover:text-white p-1"><X className="w-5 h-5" /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/50">
                <p className="text-2xl font-bold text-orange-400">{currentDay}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">CURRENT</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/50">
                <p className="text-2xl font-bold text-yellow-400">{streak?.best_streak || 0}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">BEST</p>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-3 text-center border border-gray-700/50">
                <p className="text-2xl font-bold text-cyan-400">{streak?.total_claimed_yes || 0}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">TOTAL YES</p>
              </div>
            </div>

            {/* Reward grid */}
            <div className="space-y-2">
              {STREAK_REWARDS.map((reward, i) => {
                const isPast = i < currentDay
                const isCurrent = i === currentDay && canClaim
                const isNext = i === currentDay && !canClaim
                return (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isPast ? 'bg-green-500/5 border-green-500/20' :
                    isCurrent ? 'bg-orange-500/10 border-orange-500/30 ring-1 ring-orange-500/20' :
                    isNext ? 'bg-blue-500/5 border-blue-500/20' :
                    'bg-gray-800/30 border-gray-700/30 opacity-50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isPast ? 'bg-green-500/20 text-green-400' :
                        isCurrent ? 'bg-orange-500/20 text-orange-400' :
                        'bg-gray-700 text-gray-500'
                      }`}>
                        {isPast ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span className="text-sm font-medium">{DAY_LABELS[i]}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star className={`w-3.5 h-3.5 ${isPast ? 'text-green-400' : isCurrent ? 'text-orange-400' : 'text-gray-600'}`} />
                      <span className={`font-bold text-sm ${isPast ? 'text-green-400' : isCurrent ? 'text-orange-400' : 'text-gray-500'}`}>
                        {reward} YES
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-center text-[10px] text-gray-600 mt-4">
              Claim every day to keep your streak! Miss a day and it resets. After Day 7, the cycle restarts.
            </p>
          </div>
        </div>
      )}

      {/* ═══ 24H REMINDER NOTIFICATION ═══ */}
      {showReminder && (
        <div className="fixed bottom-6 left-6 z-[998]" style={{ animation: 'streakReminder 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-orange-500/30 rounded-2xl p-4 shadow-2xl shadow-orange-500/10 max-w-xs">
            <button 
              onClick={() => { setShowReminder(false); sessionStorage.setItem('yv_streak_reminder', '1') }}
              className="absolute top-2 right-2 text-gray-600 hover:text-white transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="absolute -top-1 left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent rounded-full" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🔥</span>
              </div>
              <div>
                <p className="font-bold text-white text-xs">Don't lose your streak!</p>
                <p className="text-gray-400 text-[11px] mt-0.5">
                  Claim Day {currentDay > 6 ? 1 : currentDay + 1} for <span className="text-orange-400 font-bold">{STREAK_REWARDS[currentDay > 6 ? 0 : currentDay]} YES</span>
                </p>
                <button
                  onClick={() => { setShowReminder(false); sessionStorage.setItem('yv_streak_reminder', '1'); claimStreak() }}
                  className="mt-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-[11px] font-bold hover:brightness-110 transition-all"
                >
                  Claim Now 🎁
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes streakToast {
          0% { transform: translateX(-50%) translateY(-20px) scale(0.95); opacity: 0; }
          100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        }
        @keyframes streakPanel {
          0% { transform: scale(0.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes streakReminder {
          0% { transform: translateY(20px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </>
  )
}
