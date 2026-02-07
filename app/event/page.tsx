'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Trophy, Zap, Clock, Crown, Medal, 
  Gift, RefreshCw, Flame, Star, ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface EventData {
  id: string
  name: string
  description: string
  status: string
  starts_at: string
  ends_at: string
  prizes: { rank: number; reward: string; emoji: string }[]
}

interface Score {
  user_id: string
  username: string
  score: number
}

export default function EventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [event, setEvent] = useState<EventData | null>(null)
  const [scores, setScores] = useState<Score[]>([])
  const [myScore, setMyScore] = useState<number>(0)
  const [myRank, setMyRank] = useState<number>(0)
  const [myUserId, setMyUserId] = useState<string>('')
  const [countdown, setCountdown] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  // We hide ended events from the UI (when an event finishes, we show "No Active Event")
  const [phase, setPhase] = useState<'upcoming' | 'active'>('upcoming')

  useEffect(() => {
    loadEvent()
    const interval = setInterval(loadEvent, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!event) return
    const timer = setInterval(() => {
      const now = Date.now()
      const start = new Date(event.starts_at).getTime()
      const end = new Date(event.ends_at).getTime()

      if (now < start) {
        setPhase('upcoming')
        setCountdown(formatDuration(start - now))
      } else if (now < end) {
        setPhase('active')
        setCountdown(formatDuration(end - now))
      } else {
        // Event finished → hide it from the UI
        setEvent(null)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [event])

  const formatDuration = (ms: number) => {
    const d = Math.floor(ms / (1000 * 60 * 60 * 24))
    const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
    const s = Math.floor((ms % (1000 * 60)) / 1000)
    if (d > 0) return `${d}d ${h}h ${m}m ${s}s`
    if (h > 0) return `${h}h ${m}m ${s}s`
    return `${m}m ${s}s`
  }

  const loadEvent = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setMyUserId(session.user.id)

      // Load active or upcoming event
      const { data: eventList } = await supabase
        .from('events')
        .select('*')
        .in('status', ['upcoming', 'active'])
        .order('starts_at', { ascending: false })
        .limit(1)

      const eventData = eventList && eventList.length > 0 ? eventList[0] : null
      if (!eventData) { setLoading(false); return }
      
      // Auto-update status based on time
      const now = Date.now()
      const start = new Date(eventData.starts_at).getTime()
      const end = new Date(eventData.ends_at).getTime()
      
      if (eventData.status === 'upcoming' && now >= start) {
        await supabase.from('events').update({ status: 'active' }).eq('id', eventData.id)
        eventData.status = 'active'
      }
      if (eventData.status === 'active' && now >= end) {
        await supabase.from('events').update({ status: 'ended' }).eq('id', eventData.id)
        eventData.status = 'ended'
      }

      // If it just ended, don't show it.
      if (eventData.status === 'ended') {
        setEvent(null)
        setScores([])
        setMyScore(0)
        setMyRank(0)
        setLoading(false)
        return
      }

      setEvent(eventData)

      // Load scores
      const { data: scoreData } = await supabase
        .from('event_scores')
        .select('user_id, username, score')
        .eq('event_id', eventData.id)
        .order('score', { ascending: false })
        .limit(50)

      const sortedScores = scoreData || []
      setScores(sortedScores)

      // Find my score/rank
      const myEntry = sortedScores.find(s => s.user_id === session.user.id)
      setMyScore(myEntry?.score || 0)
      setMyRank(myEntry ? sortedScores.indexOf(myEntry) + 1 : 0)

    } catch (err) {
      console.error('Event error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadEvent()
    setRefreshing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-400">No Active Event</h2>
          <p className="text-gray-500 mt-2">Check back soon!</p>
          <Link href="/dashboard" className="mt-6 inline-block px-6 py-3 bg-purple-600 rounded-xl font-bold hover:bg-purple-700">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-900/60 to-amber-900/60 border-yellow-500/60'
    if (rank === 2) return 'bg-gradient-to-r from-gray-700/60 to-gray-600/60 border-gray-400/60'
    if (rank === 3) return 'bg-gradient-to-r from-orange-900/60 to-amber-900/40 border-orange-500/50'
    if (rank <= 5) return 'bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/30'
    return 'bg-gray-800/50 border-gray-700/50'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-400" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />
    if (rank <= 5) return <Gift className="w-5 h-5 text-purple-400" />
    return <span className="text-gray-500 font-bold text-sm">#{rank}</span>
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-800/80 backdrop-blur border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Event
              </h1>
            </div>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="p-2 hover:bg-gray-700 rounded-lg">
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">

        {/* ═══ EVENT HERO ═══ */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-900/30 via-orange-900/20 to-red-900/30 p-6 md:p-8">
          {/* Animated bg particles */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400/20 rounded-full"
                style={{
                  left: `${10 + i * 12}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animation: `pulse ${2 + i * 0.3}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              {phase === 'active' && (
                <span className="px-3 py-1 bg-green-500 text-black text-xs font-bold rounded-full animate-pulse">
                  🔴 LIVE
                </span>
              )}
              {phase === 'upcoming' && (
                <span className="px-3 py-1 bg-yellow-500 text-black text-xs font-bold rounded-full">
                  ⏳ STARTING SOON
                </span>
              )}
            </div>

            <h2 className="text-2xl md:text-3xl font-black mb-2">{event.name}</h2>
            <p className="text-gray-300 text-sm mb-6">{event.description}</p>

            {/* Countdown */}
            <div className="bg-black/40 rounded-xl p-4 inline-block">
              <p className="text-xs text-gray-400 mb-1">
                {phase === 'upcoming' ? '⏳ Starts in' : '⏰ Ends in'}
              </p>
              <p className="text-3xl md:text-4xl font-mono font-black text-yellow-400">
                {countdown}
              </p>
            </div>

            {/* Duration info */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
              <span>📅 Start: {new Date(event.starts_at).toLocaleString()}</span>
              <span>🏁 End: {new Date(event.ends_at).toLocaleString()}</span>
              <span>⏱️ Duration: 96 hours</span>
            </div>
          </div>
        </div>

        {/* ═══ MY STATS ═══ */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/20 border border-yellow-500/30 rounded-xl p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">My Score</p>
            <p className="text-3xl font-black text-yellow-400">{myScore.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">⚡ Energy clicked</p>
          </div>
          <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 border border-purple-500/30 rounded-xl p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">My Rank</p>
            <p className="text-3xl font-black text-purple-400">
              {myRank > 0 ? `#${myRank}` : '—'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {myRank > 0 && myRank <= 5 ? '🏆 In prize zone!' : myRank > 5 ? 'Keep grinding!' : 'Start clicking!'}
            </p>
          </div>
        </div>

        {/* ═══ GO PLAY BUTTON ═══ */}
        {phase === 'active' && (
          <a
            href="https://www.energy-empire.space/dashboard"
            target="_blank"
            className="block w-full py-4 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 hover:brightness-110 rounded-xl font-black text-lg text-center text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Zap className="w-6 h-6 inline mr-2" />
            PLAY ENERGY EMPIRE NOW!
            <ChevronRight className="w-6 h-6 inline ml-1" />
          </a>
        )}

        {/* ═══ PRIZES ═══ */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            Prize Pool
          </h3>
          <div className="space-y-2">
            {event.prizes.map((prize, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg border ${getRankStyle(prize.rank)}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{prize.emoji}</span>
                  <span className="font-bold">
                    {prize.rank === 1 ? '1st' : prize.rank === 2 ? '2nd' : prize.rank === 3 ? '3rd' : `${prize.rank}th`} Place
                  </span>
                </div>
                <span className="font-bold text-yellow-400">{prize.reward}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ LEADERBOARD ═══ */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" />
            Leaderboard
            <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full ml-auto">
              {scores.length} players
            </span>
          </h3>

          {scores.length === 0 ? (
            <div className="text-center py-10">
              <Zap className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500">
                {phase === 'upcoming' ? 'Event starts soon — be ready!' : 'No scores yet. Start clicking!'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scores.map((entry, i) => {
                const rank = i + 1
                const isMe = entry.user_id === myUserId
                return (
                  <div
                    key={entry.user_id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      isMe 
                        ? 'bg-cyan-900/30 border-cyan-500/50 ring-1 ring-cyan-500/30' 
                        : getRankStyle(rank)
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center shrink-0">
                      {getRankIcon(rank)}
                    </div>

                    {/* Username */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate ${isMe ? 'text-cyan-400' : ''}`}>
                        {entry.username} {isMe && '(you)'}
                      </p>
                      {rank <= 5 && (
                        <p className="text-xs text-gray-500">
                          {event.prizes[rank - 1]?.reward}
                        </p>
                      )}
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0">
                      <p className={`font-black text-lg ${
                        rank === 1 ? 'text-yellow-400' : 
                        rank === 2 ? 'text-gray-300' : 
                        rank === 3 ? 'text-orange-400' : 
                        'text-white'
                      }`}>
                        {entry.score.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">⚡ energy</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ═══ RULES ═══ */}
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-5 text-sm text-gray-400">
          <h4 className="font-bold text-white mb-2">📋 Rules</h4>
          <ul className="space-y-1">
            <li>• Only energy earned by <strong className="text-yellow-400">clicking</strong> in Energy Empire counts</li>
            <li>• Scores update live every sync (every 10 clicks)</li>
            <li>• Prizes distributed within 24h after event ends</li>
            <li>• Top 3 earn YES tokens, Top 4-5 earn resource chests</li>
            <li>• Autoclickers and boosters are allowed! 🚀</li>
          </ul>
        </div>

        {/* AADS Banner */}
        <div className="rounded-xl overflow-hidden border border-gray-700/50 bg-gray-800/30">
          <iframe
            data-aa="2426378"
            src="//acceptable.a-ads.com/2426378/?size=Adaptive"
            style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: '0 auto' }}
            title="Ad"
          />
        </div>

      </div>
    </div>
  )
}
