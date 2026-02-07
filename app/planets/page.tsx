'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Globe, ArrowLeft, Sparkles, Zap, Diamond,
  Star, TrendingUp, Gift, RefreshCw, Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AnimatedPlanet from '@/components/AnimatedPlanet'
import SpotlightTour, { type SpotlightStep } from '@/components/SpotlightTour'
import {
  type PlanetRarity, type PlanetVisualType,
  generateRandomVisuals, getVisualName, RARITY_GLOW_COLORS,
} from '@/lib/planetSpriteConfig'

type Planet = {
  id: string
  user_id: string
  name: string
  rarity: PlanetRarity
  sprite_sheet: number      // which sheet file (0-4)
  visual_type: PlanetVisualType  // which row (0-4)
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
  common: { border: 'border-gray-500', text: 'text-gray-300' },
  rare: { border: 'border-blue-500', text: 'text-blue-400' },
  epic: { border: 'border-purple-500', text: 'text-purple-400' },
  legendary: { border: 'border-yellow-400', text: 'text-yellow-400' }
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
  const [revealPlanet, setRevealPlanet] = useState<Planet | null>(null)
  const [revealPhase, setRevealPhase] = useState<'idle' | 'scanning' | 'reveal' | 'done'>('idle')

  // AAA style guided tour (optional) — triggered via /planets?tour=claim
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
      router.replace(qs ? `/planets?${qs}` : '/planets')
    } catch {
      router.replace('/planets')
    }
  }

  const tourSteps: SpotlightStep[] = useMemo(() => {
    if (tourMode !== 'claim') return []

    const hasPlanets = (planets?.length || 0) > 0
    return [
      {
        id: 'claim',
        title: 'Claim your starter planet',
        body: hasPlanets
          ? 'You already have planets — nice. Select one to see details and bonuses.'
          : 'Click here to claim your free starter planet. It gives bonuses and unlocks tile gameplay.',
        target: hasPlanets ? '[data-tour="planetGrid"]' : '[data-tour="claimFreePlanet"]',
      },
      {
        id: 'next',
        title: 'Next: convert Fuel → YES',
        body: 'After you play Energy Empire and craft Fuel, you can convert it to YES on your dashboard.',
        target: '[data-tour="planetGrid"]',
        nextHref: '/dashboard?convert=1&tour=convertModal',
        nextLabel: 'Go to Dashboard',
      },
    ]
  }, [tourMode, planets])

  useEffect(() => { setMounted(true); loadData() }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/login'); return }
      setUserId(session.user.id)
      const { data, error } = await supabase.from('planets').select('*')
        .eq('user_id', session.user.id).order('created_at', { ascending: true })
      if (!error) setPlanets(data || [])
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  const generateRandomPlanet = (rarity: PlanetRarity = 'common') => {
    const stats = RARITY_STATS[rarity]
    const name = PLANET_NAMES[Math.floor(Math.random() * PLANET_NAMES.length)]
    const suffix = Math.floor(Math.random() * 999) + 1
    const visuals = generateRandomVisuals(rarity) // 🎲 random sheet + row!
    return {
      name: `${name}-${suffix}`, rarity,
      sprite_sheet: visuals.sprite_sheet,
      visual_type: visuals.visual_type,
      max_tiles: Math.floor(Math.random() * (stats.tiles[1] - stats.tiles[0] + 1)) + stats.tiles[0],
      discovered_tiles: 2,
      base_resources_percent: Math.floor(Math.random() * 50) + 10,
      rare_resources_percent: Math.floor(Math.random() * 10),
      buildable_tiles_percent: Math.floor(Math.random() * 20) + 5,
      bonus_energy_production: Math.floor(Math.random() * (stats.bonus[1] - stats.bonus[0] + 1)) + stats.bonus[0],
      bonus_rare_drop_rate: Math.floor(Math.random() * (stats.rare[1] - stats.rare[0] + 1)) + stats.rare[0],
      tier: 1,
      upgrade_cost_fuel: rarity === 'common' ? 100 : rarity === 'rare' ? 500 : rarity === 'epic' ? 2000 : 10000,
      is_nft: false, is_active: true, purchase_price_yes: 0
    }
  }

  const claimTesterReward = async () => {
    if (!userId || claiming) return
    setClaiming(true)
    try {
      const visuals = generateRandomVisuals('legendary')
      const legendaryPlanet = {
        name: `Nexus-Prime-OMEGA`, rarity: 'legendary' as const,
        sprite_sheet: visuals.sprite_sheet, visual_type: visuals.visual_type,
        max_tiles: 100, discovered_tiles: 50, base_resources_percent: 100,
        rare_resources_percent: 50, buildable_tiles_percent: 50,
        bonus_energy_production: 50, bonus_rare_drop_rate: 20,
        tier: 5, upgrade_cost_fuel: 0, is_nft: true, is_active: true, purchase_price_yes: 0
      }
      const { data, error } = await supabase.from('planets')
        .insert({ user_id: userId, ...legendaryPlanet }).select().single()
      if (error) { alert('Error: ' + error.message) }
      else {
        await supabase.from('wallets').update({ yes_tokens: 500 }).eq('user_id', userId)
        await supabase.from('users').update({ total_yes_earned: 500 }).eq('id', userId)
        setPlanets([...planets, data]); triggerReveal(data)
      }
    } catch (err) { console.error('Error:', err) }
    finally { setClaiming(false) }
  }

  const claimFreePlanet = async () => {
    if (!userId || claiming) return
    setClaiming(true)
    try {
      const newPlanet = generateRandomPlanet('common')
      const { data, error } = await supabase.from('planets')
        .insert({ user_id: userId, ...newPlanet }).select().single()
      if (error) { alert('Error: ' + error.message) }
      else { setPlanets([...planets, data]); triggerReveal(data) }
    } catch (err) { console.error('Error:', err) }
    finally { setClaiming(false) }
  }

  const triggerReveal = (planet: Planet) => {
    setRevealPlanet(planet); setRevealPhase('scanning')
    setTimeout(() => setRevealPhase('reveal'), 1500)
    setTimeout(() => setRevealPhase('done'), 5500)
  }

  const closeReveal = () => {
    setRevealPhase('idle'); setRevealPlanet(null)
    if (revealPlanet) setSelectedPlanet(revealPlanet)
  }

  // Resolve sprite visuals — fallback for old planets without sprite_sheet
  const getSheet = (p: Planet) => p.sprite_sheet ?? 0
  const getVT = (p: Planet): PlanetVisualType => (p.visual_type ?? (p.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 5)) as PlanetVisualType

  const renderPlanetVisual = (planet: Planet, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeMap = { sm: 56, md: 90, lg: 160 }
    return (
      <AnimatedPlanet rarity={planet.rarity} sheetIndex={getSheet(planet)}
        visualType={getVT(planet)} size={sizeMap[size]} showLabel={size !== 'sm'} />
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center animate-spin-slow">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <p className="text-gray-400">Scanning the cosmos...</p>
      </div>
    </div>
  )

  return (
    <div className="relative min-h-screen">
      <SpotlightTour open={tourOpen} steps={tourSteps} onClose={closeTour} />
      <div className="stars">{mounted && [...Array(80)].map((_, i) => (
        <div key={i} className="star" style={{ left: `${Math.random()*100}%`, top: `${Math.random()*100}%`, animationDelay: `${Math.random()*3}s`, animationDuration: `${2+Math.random()*2}s` }} />
      ))}</div>
      <div className="nebula" />

      {/* ═══ CLAIM REVEAL OVERLAY ═══ */}
      {revealPhase !== 'idle' && revealPlanet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md"
          onClick={revealPhase === 'done' ? closeReveal : undefined}>
          <div className="text-center">
            {revealPhase === 'scanning' && (
              <div className="animate-pulse">
                <div className="w-32 h-32 mx-auto mb-6 rounded-full border-2 border-cyan-500/50 flex items-center justify-center"
                  style={{ animation: 'spin 2s linear infinite', boxShadow: '0 0 40px rgba(34,211,238,0.3)' }}>
                  <Globe className="w-12 h-12 text-cyan-400" />
                </div>
                <p className="text-cyan-400 text-lg font-bold animate-pulse" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                  SCANNING DEEP SPACE...
                </p>
                <p className="text-gray-500 text-sm mt-2">Analyzing planet signature</p>
              </div>
            )}
            {(revealPhase === 'reveal' || revealPhase === 'done') && (
              <div style={{ animation: 'fadeInScale 0.6s ease-out' }}>
                <p className="text-gray-500 text-xs mb-4 tracking-widest uppercase">Planet Discovered!</p>
                <div className="mb-6" style={{ animation: 'float 3s ease-in-out infinite' }}>
                  <AnimatedPlanet rarity={revealPlanet.rarity} sheetIndex={getSheet(revealPlanet)}
                    visualType={getVT(revealPlanet)} size={180} />
                </div>
                <h2 className={`text-3xl font-bold mb-2 ${RARITY_COLORS[revealPlanet.rarity].text}`}
                  style={{ fontFamily: 'Orbitron, sans-serif' }}>{revealPlanet.name}</h2>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border ${RARITY_GLOW_COLORS[revealPlanet.rarity].label}`}>
                    {revealPlanet.rarity.toUpperCase()}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {getVisualName(revealPlanet.rarity, getVT(revealPlanet), getSheet(revealPlanet))}
                  </span>
                </div>
                <div className="flex gap-4 justify-center mb-6">
                  <div className="bg-white/5 rounded-lg px-4 py-2">
                    <p className="text-yellow-400 font-bold">+{revealPlanet.bonus_energy_production}%</p>
                    <p className="text-gray-500 text-xs">Energy</p>
                  </div>
                  <div className="bg-white/5 rounded-lg px-4 py-2">
                    <p className="text-cyan-400 font-bold">+{revealPlanet.bonus_rare_drop_rate}%</p>
                    <p className="text-gray-500 text-xs">Rare Drop</p>
                  </div>
                  <div className="bg-white/5 rounded-lg px-4 py-2">
                    <p className="text-purple-400 font-bold">{revealPlanet.max_tiles}</p>
                    <p className="text-gray-500 text-xs">Tiles</p>
                  </div>
                </div>
                {revealPhase === 'done' && (
                  <button onClick={closeReveal}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4 inline mr-2" />Awesome!
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 text-center">
              <Globe className="w-6 h-6 mx-auto mb-2 text-purple-400" /><p className="text-2xl font-bold">{planets.length}</p><p className="text-gray-400 text-sm">Total Planets</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 text-center">
              <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" /><p className="text-2xl font-bold">+{planets.reduce((a,p)=>a+p.bonus_energy_production,0)}%</p><p className="text-gray-400 text-sm">Energy Bonus</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-4 text-center">
              <Diamond className="w-6 h-6 mx-auto mb-2 text-cyan-400" /><p className="text-2xl font-bold">+{planets.reduce((a,p)=>a+p.bonus_rare_drop_rate,0)}%</p><p className="text-gray-400 text-sm">Rare Drop</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 text-center">
              <Star className="w-6 h-6 mx-auto mb-2 text-green-400" /><p className="text-2xl font-bold">{planets.reduce((a,p)=>a+p.discovered_tiles,0)}</p><p className="text-gray-400 text-sm">Tiles Discovered</p>
            </div>
          </div>

          {/* Free Claim */}
          {planets.length === 0 && (
            <div className="mb-8 bg-gradient-to-r from-purple-900/30 to-cyan-900/30 border-2 border-dashed border-cyan-500/50 rounded-2xl p-8 text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h2 className="text-2xl font-bold mb-2">Claim Your Free Starter Planet!</h2>
              <p className="text-gray-400 mb-6">Every new Pilot gets one free Common planet to start their journey.</p>
              <button onClick={claimFreePlanet} data-tour="claimFreePlanet" disabled={claiming}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2 mx-auto">
                {claiming ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {claiming ? 'Scanning Deep Space...' : 'Claim Free Planet'}
              </button>
            </div>
          )}

          {/* Planet Grid */}
          {planets.length > 0 && (
            <>
              <h2 className="text-2xl font-bold mb-6">Your Planets</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" data-tour="planetGrid">
                {planets.map((planet) => {
                  const colors = RARITY_COLORS[planet.rarity]
                  return (
                    <div key={planet.id} onClick={() => setSelectedPlanet(planet)}
                      className={`relative bg-white/5 backdrop-blur-sm border-2 ${colors.border} rounded-2xl p-6 cursor-pointer hover:scale-105 transition-all ${selectedPlanet?.id === planet.id ? 'ring-2 ring-cyan-400' : ''}`}>
                      <div className="flex justify-center mb-4">{renderPlanetVisual(planet, 'md')}</div>
                      <h3 className={`text-xl font-bold text-center mb-1 ${colors.text}`}>{planet.name}</h3>
                      <p className="text-gray-500 text-xs text-center mb-3">
                        {getVisualName(planet.rarity, getVT(planet), getSheet(planet))}
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-black/30 rounded-lg p-2 text-center"><p className="text-yellow-400 font-bold">+{planet.bonus_energy_production}%</p><p className="text-gray-500 text-xs">Energy</p></div>
                        <div className="bg-black/30 rounded-lg p-2 text-center"><p className="text-cyan-400 font-bold">+{planet.bonus_rare_drop_rate}%</p><p className="text-gray-500 text-xs">Rare Drop</p></div>
                        <div className="bg-black/30 rounded-lg p-2 text-center"><p className="text-purple-400 font-bold">{planet.discovered_tiles}/{planet.max_tiles}</p><p className="text-gray-500 text-xs">Tiles</p></div>
                        <div className="bg-black/30 rounded-lg p-2 text-center"><p className="text-green-400 font-bold">Tier {planet.tier}</p><p className="text-gray-500 text-xs">Level</p></div>
                      </div>
                      {planet.is_active && <div className="absolute top-3 right-3"><span className="px-2 py-1 bg-green-500 text-xs font-bold rounded-full">ACTIVE</span></div>}
                    </div>
                  )
                })}
                <div className="relative bg-white/5 backdrop-blur-sm border-2 border-dashed border-gray-600 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[280px] hover:border-purple-500 transition-colors cursor-pointer">
                  <Plus className="w-12 h-12 text-gray-500 mb-3" /><p className="text-gray-400 font-bold">Get More Planets</p>
                  <p className="text-gray-600 text-sm text-center mt-2">Coming soon: Planet marketplace</p>
                </div>
              </div>
            </>
          )}

          {/* Selected Planet Detail */}
          {selectedPlanet && (
            <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center">
                  {renderPlanetVisual(selectedPlanet, 'lg')}
                  <h2 className={`text-3xl font-bold mt-6 ${RARITY_COLORS[selectedPlanet.rarity].text}`}>{selectedPlanet.name}</h2>
                  <p className="text-gray-400 mt-1">Tier {selectedPlanet.tier} • {selectedPlanet.rarity.toUpperCase()} • {getVisualName(selectedPlanet.rarity, getVT(selectedPlanet), getSheet(selectedPlanet))}</p>
                </div>
                <div className="space-y-4">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-cyan-400" />Planet Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between"><span className="text-gray-400">Energy Bonus</span><span className="text-yellow-400 font-bold">+{selectedPlanet.bonus_energy_production}%</span></div>
                    <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{width:`${selectedPlanet.bonus_energy_production}%`}} /></div>
                    <div className="flex justify-between mt-4"><span className="text-gray-400">Rare Drop Bonus</span><span className="text-cyan-400 font-bold">+{selectedPlanet.bonus_rare_drop_rate}%</span></div>
                    <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-cyan-500 h-2 rounded-full" style={{width:`${selectedPlanet.bonus_rare_drop_rate*5}%`}} /></div>
                    <div className="flex justify-between mt-4"><span className="text-gray-400">Tiles</span><span className="text-purple-400 font-bold">{selectedPlanet.discovered_tiles}/{selectedPlanet.max_tiles}</span></div>
                    <div className="w-full bg-gray-800 rounded-full h-2"><div className="bg-purple-500 h-2 rounded-full" style={{width:`${(selectedPlanet.discovered_tiles/selectedPlanet.max_tiles)*100}%`}} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-black/30 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-orange-400">{selectedPlanet.base_resources_percent}%</p><p className="text-gray-500 text-sm">Base Resources</p></div>
                    <div className="bg-black/30 rounded-xl p-4 text-center"><p className="text-2xl font-bold text-pink-400">{selectedPlanet.rare_resources_percent}%</p><p className="text-gray-500 text-sm">Rare Resources</p></div>
                  </div>
                  <button className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Zap className="w-5 h-5" />Upgrade Planet ({selectedPlanet.upgrade_cost_fuel} Fuel)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeInScale { from { opacity:0; transform:scale(0.5) } to { opacity:1; transform:scale(1) } }
        @keyframes float { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
      `}</style>
    </div>
  )
}
