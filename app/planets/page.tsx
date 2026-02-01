'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Globe, ArrowLeft, Sparkles, Zap, Diamond, Coins,
  Lock, Star, TrendingUp, Gift, RefreshCw, Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Planet = {
  id: string
  user_id: string
  name: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  max_tiles: number
  discovered_tiles: number
  base_resources_percent: number
  rare_resources_percent: number
  buildable_tiles_percent: number
  bonus_energy_production: number
  bonus_rare_drop_rate: number
  tier: number
  upgrade_cost_fuel: number
  is_nft: boolean
  is_active: boolean
  purchase_price_yes: number
  created_at: string
  updated_at: string
}

const RARITY_COLORS = {
  common: { bg: 'from-gray-600 to-gray-800', border: 'border-gray-500', text: 'text-gray-300', glow: 'shadow-gray-500/30' },
  rare: { bg: 'from-blue-600 to-blue-900', border: 'border-blue-500', text: 'text-blue-400', glow: 'shadow-blue-500/50' },
  epic: { bg: 'from-purple-600 to-purple-900', border: 'border-purple-500', text: 'text-purple-400', glow: 'shadow-purple-500/50' },
  legendary: { bg: 'from-yellow-500 to-orange-600', border: 'border-yellow-400', text: 'text-yellow-400', glow: 'shadow-yellow-500/50' }
}

const RARITY_STATS = {
  common: { tiles: [10, 20], bonus: [0, 5], rare: [0, 2] },
  rare: { tiles: [20, 40], bonus: [5, 15], rare: [2, 5] },
  epic: { tiles: [40, 70], bonus: [15, 30], rare: [5, 10] },
  legendary: { tiles: [70, 100], bonus: [30, 50], rare: [10, 20] }
}

const PLANET_NAMES = [
  'Nexus Prime', 'Aurelia', 'Zephyrus', 'Crystallia', 'Nova Terra',
  'Obsidian', 'Solaris', 'Nebulox', 'Eternia', 'Pyrrhus',
  'Glacius', 'Verdantia', 'Tempestus', 'Luminara', 'Shadowmere'
]

export default function PlanetsPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [planets, setPlanets] = useState<Planet[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null)

  useEffect(() => {
    setMounted(true)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)

      const { data: planetsData, error } = await supabase
        .from('planets')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: true })

      if (!error) setPlanets(planetsData || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateRandomPlanet = (rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common') => {
    const stats = RARITY_STATS[rarity]
    const name = PLANET_NAMES[Math.floor(Math.random() * PLANET_NAMES.length)]
    const suffix = Math.floor(Math.random() * 999) + 1
    
    return {
      name: `${name}-${suffix}`,
      rarity,
      max_tiles: Math.floor(Math.random() * (stats.tiles[1] - stats.tiles[0] + 1)) + stats.tiles[0],
      discovered_tiles: 2,
      base_resources_percent: Math.floor(Math.random() * 50) + 10,
      rare_resources_percent: Math.floor(Math.random() * 10),
      buildable_tiles_percent: Math.floor(Math.random() * 20) + 5,
      bonus_energy_production: Math.floor(Math.random() * (stats.bonus[1] - stats.bonus[0] + 1)) + stats.bonus[0],
      bonus_rare_drop_rate: Math.floor(Math.random() * (stats.rare[1] - stats.rare[0] + 1)) + stats.rare[0],
      tier: 1,
      upgrade_cost_fuel: rarity === 'common' ? 100 : rarity === 'rare' ? 500 : rarity === 'epic' ? 2000 : 10000,
      is_nft: false,
      is_active: true,
      purchase_price_yes: 0
    }
  }

  // 🎁 SECRET TESTER REWARD - Legendary Planet with MAX stats!
  const claimTesterReward = async () => {
    if (!userId || claiming) return
    setClaiming(true)

    try {
      const legendaryPlanet = {
        name: `Nexus-Prime-OMEGA`,
        rarity: 'legendary' as const,
        max_tiles: 100,
        discovered_tiles: 50,
        base_resources_percent: 100,
        rare_resources_percent: 50,
        buildable_tiles_percent: 50,
        bonus_energy_production: 50,
        bonus_rare_drop_rate: 20,
        tier: 5,
        upgrade_cost_fuel: 0,
        is_nft: true,
        is_active: true,
        purchase_price_yes: 0
      }
      
      const { data, error } = await supabase
        .from('planets')
        .insert({ user_id: userId, ...legendaryPlanet })
        .select()
        .single()

      if (error) {
        console.error('Error claiming tester reward:', error)
        alert('Error: ' + error.message)
      } else {
        // 🎁 BONUS: Also give 500 YES tokens for testing cashout!
        await supabase.from('wallets').update({ yes_tokens: 500 }).eq('user_id', userId)
        await supabase.from('users').update({ total_yes_earned: 500 }).eq('id', userId)

        setPlanets([...planets, data])
        setSelectedPlanet(data)
        alert('🎉 LEGENDARY PLANET + 500 YES TOKENS CLAIMED! Welcome, Tester!')
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setClaiming(false)
    }
  }

  const claimFreePlanet = async () => {
    if (!userId || claiming) return
    setClaiming(true)

    try {
      const newPlanet = generateRandomPlanet('common')
      
      const { data, error } = await supabase
        .from('planets')
        .insert({ user_id: userId, ...newPlanet })
        .select()
        .single()

      if (error) {
        console.error('Error claiming planet:', error)
        alert('Error claiming planet: ' + error.message)
      } else {
        setPlanets([...planets, data])
        setSelectedPlanet(data)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setClaiming(false)
    }
  }

  const renderPlanetVisual = (planet: Planet, size: 'sm' | 'md' | 'lg' = 'md') => {
    const colors = RARITY_COLORS[planet.rarity]
    const sizeClasses = { sm: 'w-16 h-16', md: 'w-24 h-24', lg: 'w-40 h-40' }
    const seed = planet.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    const rotation = seed % 360
    const rings = seed % 3 === 0
    
    return (
      <div className={`relative ${sizeClasses[size]}`}>
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${colors.bg} shadow-lg ${colors.glow}`}
          style={{ transform: `rotate(${rotation}deg)`, boxShadow: `0 0 ${size === 'lg' ? 60 : 30}px rgba(107, 33, 255, 0.4), inset -${size === 'lg' ? 20 : 10}px -${size === 'lg' ? 20 : 10}px ${size === 'lg' ? 40 : 20}px rgba(0,0,0,0.5)` }}>
          <div className="absolute inset-2 rounded-full opacity-30" style={{ background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)` }} />
          <div className="absolute w-1/4 h-1/4 rounded-full bg-black/20" style={{ top: '20%', left: '60%' }} />
          <div className="absolute w-1/6 h-1/6 rounded-full bg-black/20" style={{ top: '50%', left: '30%' }} />
        </div>
        {rings && <div className={`absolute inset-0 border-2 ${colors.border} rounded-full opacity-50`} style={{ transform: 'rotateX(70deg) scale(1.4)', borderWidth: size === 'lg' ? 3 : 2 }} />}
        <div className={`absolute inset-0 rounded-full blur-xl opacity-30 bg-gradient-to-br ${colors.bg}`} style={{ transform: 'scale(1.2)' }} />
        {size !== 'sm' && (
          <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-xs font-bold ${colors.text} bg-black/50 border ${colors.border}`}>
            {planet.rarity.toUpperCase()}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center animate-spin-slow">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-400">Scanning the cosmos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen">
      <div className="stars">
        {mounted && [...Array(80)].map((_, i) => (
          <div key={i} className="star" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 3}s`, animationDuration: `${2 + Math.random() * 2}s` }} />
        ))}
      </div>
      <div className="nebula" />

      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
            <div className="flex items-center gap-2"><Globe className="w-6 h-6 text-purple-400" /><span className="text-xl font-bold">My Planets</span></div>
          </div>
          <button onClick={loadData} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><RefreshCw className="w-5 h-5" /></button>
        </div>
      </nav>

      <div className="relative z-10 pt-24 pb-12 px-4">
        <div className="max-w-6xl mx-auto">
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 text-center">
              <Globe className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <p className="text-2xl font-bold">{planets.length}</p>
              <p className="text-gray-400 text-sm">Total Planets</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
              <p className="text-2xl font-bold">+{planets.reduce((a, p) => a + p.bonus_energy_production, 0)}%</p>
              <p className="text-gray-400 text-sm">Energy Bonus</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 text-center">
              <Diamond className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
              <p className="text-2xl font-bold">+{planets.reduce((a, p) => a + p.bonus_rare_drop_rate, 0)}%</p>
              <p className="text-gray-400 text-sm">Rare Drop</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold">{planets.reduce((a, p) => a + p.discovered_tiles, 0)}</p>
              <p className="text-gray-400 text-sm">Tiles Discovered</p>
            </div>
          </div>

          {/* Free Planet Claim */}
          {planets.length === 0 && (
            <div className="mb-8 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border-2 border-dashed border-cyan-500/50 rounded-2xl p-8 text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-2xl font-bold mb-2">Claim Your Free Starter Planet!</h2>
              <p className="text-gray-400 mb-6">Every new Pilot gets one free Common planet to start their journey.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={claimFreePlanet} disabled={claiming}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2 mx-auto">
                  {claiming ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {claiming ? 'Generating...' : 'Claim Free Planet'}
                </button>
              </div>
            </div>
          )}

          {/* Planets Grid */}
          {planets.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Your Planets</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {planets.map((planet) => {
                  const colors = RARITY_COLORS[planet.rarity]
                  return (
                    <div key={planet.id} onClick={() => setSelectedPlanet(planet)}
                      className={`relative bg-white/5 backdrop-blur-sm border-2 ${colors.border} rounded-2xl p-6 cursor-pointer hover:scale-105 transition-all ${selectedPlanet?.id === planet.id ? 'ring-2 ring-cyan-400' : ''}`}>
                      <div className="flex justify-center mb-4">{renderPlanetVisual(planet, 'md')}</div>
                      <h3 className={`text-xl font-bold text-center mb-2 ${colors.text}`}>{planet.name}</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-black/30 rounded-lg p-2 text-center">
                          <p className="text-yellow-400 font-bold">+{planet.bonus_energy_production}%</p>
                          <p className="text-gray-500 text-xs">Energy</p>
                        </div>
                        <div className="bg-black/30 rounded-lg p-2 text-center">
                          <p className="text-cyan-400 font-bold">+{planet.bonus_rare_drop_rate}%</p>
                          <p className="text-gray-500 text-xs">Rare Drop</p>
                        </div>
                        <div className="bg-black/30 rounded-lg p-2 text-center">
                          <p className="text-purple-400 font-bold">{planet.discovered_tiles}/{planet.max_tiles}</p>
                          <p className="text-gray-500 text-xs">Tiles</p>
                        </div>
                        <div className="bg-black/30 rounded-lg p-2 text-center">
                          <p className="text-green-400 font-bold">Tier {planet.tier}</p>
                          <p className="text-gray-500 text-xs">Level</p>
                        </div>
                      </div>
                      {planet.is_active && <div className="absolute top-3 right-3"><span className="px-2 py-1 bg-green-500 text-xs font-bold rounded-full">ACTIVE</span></div>}
                    </div>
                  )
                })}

                <div className="relative bg-white/5 backdrop-blur-sm border-2 border-dashed border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[280px] hover:border-purple-500 transition-colors cursor-pointer">
                  <Plus className="w-12 h-12 text-gray-500 mb-3" />
                  <p className="text-gray-400 font-bold">Get More Planets</p>
                  <p className="text-gray-600 text-sm text-center mt-2">Coming soon: Planet marketplace</p>
                </div>
              </div>
            </>
          )}

          {/* Selected Planet Details */}
          {selectedPlanet && (
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center">
                  {renderPlanetVisual(selectedPlanet, 'lg')}
                  <h2 className={`text-3xl font-bold mt-6 ${RARITY_COLORS[selectedPlanet.rarity].text}`}>{selectedPlanet.name}</h2>
                  <p className="text-gray-400 mt-1">Tier {selectedPlanet.tier} • {selectedPlanet.rarity.toUpperCase()}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" />Planet Statistics</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Energy Production Bonus</span>
                      <span className="text-yellow-400 font-bold">+{selectedPlanet.bonus_energy_production}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${selectedPlanet.bonus_energy_production}%` }} />
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-gray-400">Rare Drop Rate Bonus</span>
                      <span className="text-cyan-400 font-bold">+{selectedPlanet.bonus_rare_drop_rate}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-cyan-500 h-2 rounded-full" style={{ width: `${selectedPlanet.bonus_rare_drop_rate * 5}%` }} />
                    </div>

                    <div className="flex justify-between items-center mt-4">
                      <span className="text-gray-400">Tiles Discovered</span>
                      <span className="text-purple-400 font-bold">{selectedPlanet.discovered_tiles} / {selectedPlanet.max_tiles}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(selectedPlanet.discovered_tiles / selectedPlanet.max_tiles) * 100}%` }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-black/30 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-orange-400">{selectedPlanet.base_resources_percent}%</p>
                      <p className="text-gray-500 text-sm">Base Resources</p>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-pink-400">{selectedPlanet.rare_resources_percent}%</p>
                      <p className="text-gray-500 text-sm">Rare Resources</p>
                    </div>
                  </div>

                  <button className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />
                    Upgrade Planet ({selectedPlanet.upgrade_cost_fuel} Fuel)
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
