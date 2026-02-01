'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Globe, Zap, Diamond, Factory, Star, 
  Compass, RefreshCw, Info, ChevronUp, Coins, Clock, Gift, Home
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import HexGrid, { Tile, TileType } from '@/components/HexGrid'

const EXPLORE_COST = 100 // Fuel pour explorer
const CLAIM_INTERVAL = 6 * 60 * 60 * 1000 // 6 heures en millisecondes

const TILE_PROBABILITIES: { type: TileType; weight: number }[] = [
  { type: 'empty', weight: 35 },
  { type: 'energy', weight: 30 },
  { type: 'crystal', weight: 18 },
  { type: 'factory', weight: 12 },
  { type: 'artifact', weight: 5 },
]

const TILE_BONUSES: Record<TileType, { base: number; perLevel: number; resource: string }> = {
  unknown: { base: 0, perLevel: 0, resource: '' },
  empty: { base: 0, perLevel: 0, resource: '' },
  hq: { base: 0, perLevel: 0, resource: '' },
  energy: { base: 5, perLevel: 3, resource: 'Fuel/day' },
  crystal: { base: 10, perLevel: 5, resource: 'YES/day' },
  factory: { base: 2, perLevel: 1, resource: 'Fuel/day' },
  artifact: { base: 25, perLevel: 15, resource: 'YES bonus' },
}

function PlanetExploreContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planetId = searchParams.get('id')
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [planet, setPlanet] = useState<any>(null)
  const [tiles, setTiles] = useState<Tile[]>([])
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null)
  const [exploring, setExploring] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [nextClaimTime, setNextClaimTime] = useState<number>(0)
  const [timeLeft, setTimeLeft] = useState<string>('')

  useEffect(() => {
    loadData()
  }, [planetId])

  // Timer pour le prochain claim
  useEffect(() => {
    const interval = setInterval(() => {
      if (nextClaimTime > 0) {
        const remaining = nextClaimTime - Date.now()
        if (remaining <= 0) {
          setTimeLeft('Ready!')
        } else {
          const hours = Math.floor(remaining / (60 * 60 * 1000))
          const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
          const seconds = Math.floor((remaining % (60 * 1000)) / 1000)
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
        }
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [nextClaimTime])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Load user & wallet
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setUser(userData)

      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', session.user.id)
        .single()
      setWallet(walletData)

      // Load planet
      let planetQuery = supabase.from('planets').select('*')
      
      if (planetId) {
        planetQuery = planetQuery.eq('id', planetId)
      } else {
        planetQuery = planetQuery.eq('user_id', session.user.id).limit(1)
      }

      const { data: planetData } = await planetQuery.single()

      if (planetData) {
        setPlanet(planetData)
        await loadOrGenerateTiles(planetData, session.user.id)
        
        // Calculer le prochain claim
        const lastClaim = planetData.last_claim_at ? new Date(planetData.last_claim_at).getTime() : 0
        setNextClaimTime(lastClaim + CLAIM_INTERVAL)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fonction de claim des ressources
  const claimResources = async () => {
    if (!user || !wallet || !planet || claiming) return
    if (nextClaimTime > Date.now()) {
      setMessage({ type: 'error', text: 'Not ready yet! Wait for the timer.' })
      return
    }

    setClaiming(true)
    setMessage(null)

    try {
      // Calculer les bonus totaux des tiles
      const fuelBonus = tiles
        .filter(t => t.type === 'energy' || t.type === 'factory')
        .reduce((sum, t) => sum + t.bonus, 0)
      
      const yesBonus = tiles
        .filter(t => t.type === 'crystal' || t.type === 'artifact')
        .reduce((sum, t) => sum + t.bonus, 0)

      // Diviser par 4 car c'est toutes les 6h (pas 24h)
      const fuelToClaim = Math.floor(fuelBonus / 4)
      const yesToClaim = Math.floor(yesBonus / 4)

      // Update wallet
      await supabase.from('wallets').update({
        fuel: (wallet.fuel || 0) + fuelToClaim,
        yes_tokens: (wallet.yes_tokens || 0) + yesToClaim
      }).eq('user_id', user.id)

      // Update planet last_claim_at
      await supabase.from('planets').update({
        last_claim_at: new Date().toISOString()
      }).eq('id', planet.id)

      // Update local state
      setWallet({
        ...wallet,
        fuel: (wallet.fuel || 0) + fuelToClaim,
        yes_tokens: (wallet.yes_tokens || 0) + yesToClaim
      })
      setNextClaimTime(Date.now() + CLAIM_INTERVAL)

      setMessage({ 
        type: 'success', 
        text: `🎁 Claimed! +${fuelToClaim} Fuel, +${yesToClaim} YES` 
      })

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setClaiming(false)
    }
  }

  const loadOrGenerateTiles = async (planet: any, userId: string) => {
    const { data: existingTiles } = await supabase
      .from('tiles')
      .select('*')
      .eq('planet_id', planet.id)

    if (existingTiles && existingTiles.length > 0) {
      setTiles(existingTiles)
    } else {
      const newTiles = generateHexGrid(planet.id, planet.max_tiles || 37)
      setTiles(newTiles)
      
      // Save tiles
      await supabase.from('tiles').insert(newTiles)
    }
  }

  const generateHexGrid = (planetId: string, maxTiles: number): Tile[] => {
    const tiles: Tile[] = []
    const radius = Math.ceil(Math.sqrt(maxTiles / 3))
    
    let count = 0
    for (let q = -radius; q <= radius && count < maxTiles; q++) {
      for (let r = -radius; r <= radius && count < maxTiles; r++) {
        const s = -q - r
        if (Math.abs(s) <= radius) {
          tiles.push({
            id: `${planetId}-${q}-${r}`,
            planet_id: planetId,
            q,
            r,
            type: 'unknown',
            discovered: false,
            level: 0,
            bonus: 0,
          })
          count++
        }
      }
    }

    // Center tile always discovered with energy
    const center = tiles.find(t => t.q === 0 && t.r === 0)
    if (center) {
      center.discovered = true
      center.type = 'energy'
      center.level = 1
      center.bonus = TILE_BONUSES.energy.base
    }

    return tiles
  }

  const rollTileType = (): TileType => {
    const total = TILE_PROBABILITIES.reduce((sum, p) => sum + p.weight, 0)
    let random = Math.random() * total
    for (const prob of TILE_PROBABILITIES) {
      random -= prob.weight
      if (random <= 0) return prob.type
    }
    return 'empty'
  }

  const exploreTile = async () => {
    if (!selectedTile || selectedTile.discovered || exploring || !wallet) return
    if (wallet.fuel < EXPLORE_COST) {
      setMessage({ type: 'error', text: `Need ${EXPLORE_COST} Fuel to explore!` })
      return
    }

    setExploring(true)
    setMessage(null)

    try {
      // Deduct fuel
      const newFuel = wallet.fuel - EXPLORE_COST
      await supabase.from('wallets').update({ fuel: newFuel }).eq('user_id', user.id)
      setWallet({ ...wallet, fuel: newFuel })

      // Roll tile type
      const newType = rollTileType()
      const bonus = TILE_BONUSES[newType]
      
      const updatedTile: Tile = {
        ...selectedTile,
        discovered: true,
        type: newType,
        level: newType !== 'empty' ? 1 : 0,
        bonus: bonus.base
      }

      await supabase.from('tiles').update({
        discovered: true,
        type: newType,
        level: updatedTile.level,
        bonus: updatedTile.bonus
      }).eq('id', selectedTile.id)

      setTiles(prev => prev.map(t => t.id === selectedTile.id ? updatedTile : t))
      setSelectedTile(updatedTile)

      // Update planet discovered count
      const newCount = tiles.filter(t => t.discovered).length + 1
      await supabase.from('planets').update({ discovered_tiles: newCount }).eq('id', planet.id)

      const messages: Record<TileType, string> = {
        unknown: '',
        empty: '💨 Empty void... nothing here.',
        energy: `⚡ Energy Vein! +${bonus.base} ${bonus.resource}`,
        crystal: `💎 Crystal Formation! +${bonus.base} ${bonus.resource}`,
        factory: `🏭 Ancient Factory! +${bonus.base} ${bonus.resource}`,
        artifact: `⭐ RARE ARTIFACT! +${bonus.base} ${bonus.resource}`,
      }
      
      setMessage({ 
        type: newType === 'empty' ? 'error' : 'success', 
        text: messages[newType] 
      })

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setExploring(false)
    }
  }

  const upgradeTile = async () => {
    if (!selectedTile || !selectedTile.discovered || selectedTile.type === 'empty' || upgrading) return
    
    const upgradeCost = selectedTile.level * 50 // 50, 100, 150 Fuel
    if (wallet.fuel < upgradeCost) {
      setMessage({ type: 'error', text: `Need ${upgradeCost} Fuel to upgrade!` })
      return
    }

    setUpgrading(true)
    setMessage(null)

    try {
      const newFuel = wallet.fuel - upgradeCost
      await supabase.from('wallets').update({ fuel: newFuel }).eq('user_id', user.id)
      setWallet({ ...wallet, fuel: newFuel })

      const bonus = TILE_BONUSES[selectedTile.type]
      const newLevel = selectedTile.level + 1
      const newBonus = bonus.base + (bonus.perLevel * (newLevel - 1))

      const updatedTile: Tile = {
        ...selectedTile,
        level: newLevel,
        bonus: newBonus
      }

      await supabase.from('tiles').update({
        level: newLevel,
        bonus: newBonus
      }).eq('id', selectedTile.id)

      setTiles(prev => prev.map(t => t.id === selectedTile.id ? updatedTile : t))
      setSelectedTile(updatedTile)

      setMessage({ type: 'success', text: `Upgraded to Lv${newLevel}! +${newBonus} ${bonus.resource}` })

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setUpgrading(false)
    }
  }

  const discoveredCount = tiles.filter(t => t.discovered).length
  const canExplore = wallet && wallet.fuel >= EXPLORE_COST

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (!planet) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Globe className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-4">No planet found!</p>
          <Link href="/planets" className="text-cyan-400 hover:underline">Go to Planets</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <nav className="bg-gray-800/80 backdrop-blur border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-gray-700 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold flex items-center gap-2">
                <Globe className="w-5 h-5 text-purple-400" />
                {planet.name}
              </h1>
              <p className="text-xs text-gray-400 capitalize">{planet.rarity} • Tier {planet.tier}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-gray-400 text-xs">Explored</p>
              <p className="font-bold text-cyan-400">{discoveredCount}/{tiles.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">Fuel</p>
              <p className="font-bold text-orange-400">{wallet?.fuel?.toLocaleString() || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-xs">YES</p>
              <p className="font-bold text-green-400">{wallet?.yes_tokens?.toLocaleString() || 0}</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Hex Grid */}
          <div className="lg:col-span-2">
            <HexGrid 
              tiles={tiles}
              onTileClick={setSelectedTile}
              selectedTile={selectedTile}
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            
            {/* HQ Claim Panel */}
            <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/40 rounded-xl border-2 border-emerald-500/50 p-5">
              <h2 className="font-bold mb-3 flex items-center gap-2">
                <Home className="w-5 h-5 text-emerald-400" />
                Headquarters
              </h2>
              
              {/* Timer */}
              <div className="bg-black/30 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-400 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" /> Next Claim
                  </span>
                  <span className={`font-mono font-bold ${timeLeft === 'Ready!' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {timeLeft || 'Loading...'}
                  </span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-green-400 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${Math.min(100, Math.max(0, 100 - ((nextClaimTime - Date.now()) / CLAIM_INTERVAL) * 100))}%` 
                    }}
                  />
                </div>
              </div>

              {/* Pending Rewards */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">Pending Fuel</p>
                  <p className="text-orange-400 font-bold">
                    +{Math.floor(tiles.filter(t => t.type === 'energy' || t.type === 'factory').reduce((s, t) => s + t.bonus, 0) / 4)}
                  </p>
                </div>
                <div className="bg-black/30 rounded-lg p-2 text-center">
                  <p className="text-xs text-gray-400">Pending YES</p>
                  <p className="text-green-400 font-bold">
                    +{Math.floor(tiles.filter(t => t.type === 'crystal' || t.type === 'artifact').reduce((s, t) => s + t.bonus, 0) / 4)}
                  </p>
                </div>
              </div>

              {/* Claim Button */}
              <button
                onClick={claimResources}
                disabled={claiming || (nextClaimTime > Date.now())}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  nextClaimTime <= Date.now() 
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:brightness-110 animate-pulse' 
                    : 'bg-gray-700 cursor-not-allowed'
                }`}
              >
                {claiming ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    {nextClaimTime <= Date.now() ? 'Claim Rewards!' : 'Waiting...'}
                  </>
                )}
              </button>
            </div>

            {/* Selected Tile */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <h2 className="font-bold mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-cyan-400" />
                {selectedTile ? 'Selected Tile' : 'Select a Tile'}
              </h2>

              {selectedTile ? (
                <div className="space-y-3">
                  {/* Check if HQ */}
                  {selectedTile.q === 0 && selectedTile.r === 0 ? (
                    <div className="text-center py-4">
                      <Home className="w-12 h-12 mx-auto text-emerald-400 mb-2" />
                      <p className="text-emerald-300 font-bold">Command Center</p>
                      <p className="text-gray-400 text-sm mt-1">Click "Claim Rewards" above to collect resources!</p>
                    </div>
                  ) : selectedTile.discovered ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type</span>
                        <span className="capitalize font-medium">
                          {selectedTile.type === 'energy' && '⚡ '}
                          {selectedTile.type === 'crystal' && '💎 '}
                          {selectedTile.type === 'factory' && '🏭 '}
                          {selectedTile.type === 'artifact' && '⭐ '}
                          {selectedTile.type}
                        </span>
                      </div>
                      
                      {selectedTile.type !== 'empty' && (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Level</span>
                            <span className="text-cyan-400 font-bold">{selectedTile.level}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Bonus</span>
                            <span className="text-green-400">+{selectedTile.bonus} {TILE_BONUSES[selectedTile.type].resource}</span>
                          </div>
                          
                          <button
                            onClick={upgradeTile}
                            disabled={upgrading || (wallet?.fuel || 0) < selectedTile.level * 50}
                            className="w-full mt-3 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                          >
                            {upgrading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                              <><ChevronUp className="w-4 h-4" /> Upgrade ({selectedTile.level * 50} Fuel)</>
                            )}
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-gray-500 text-center py-6">🔒 Unexplored Territory</p>
                      
                      <button
                        onClick={exploreTile}
                        disabled={exploring || !canExplore}
                        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 disabled:from-gray-600 disabled:to-gray-700 rounded-lg font-bold flex items-center justify-center gap-2 transition-all"
                      >
                        {exploring ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                          <><Compass className="w-4 h-4" /> Explore ({EXPLORE_COST} Fuel)</>
                        )}
                      </button>
                      
                      {!canExplore && (
                        <p className="text-red-400 text-xs text-center mt-2">Need {EXPLORE_COST} Fuel!</p>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Click a hexagon to explore</p>
              )}
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl text-sm ${
                message.type === 'success' 
                  ? 'bg-green-900/50 border border-green-500 text-green-200'
                  : 'bg-red-900/50 border border-red-500 text-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Planet Bonuses */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" />
                Daily Production
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">⚡ Energy Tiles</span>
                  <span className="text-yellow-400 font-medium">
                    +{tiles.filter(t => t.type === 'energy').reduce((s, t) => s + t.bonus, 0)} Fuel/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">💎 Crystal Tiles</span>
                  <span className="text-purple-400 font-medium">
                    +{tiles.filter(t => t.type === 'crystal').reduce((s, t) => s + t.bonus, 0)} YES/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">🏭 Factory Tiles</span>
                  <span className="text-orange-400 font-medium">
                    +{tiles.filter(t => t.type === 'factory').reduce((s, t) => s + t.bonus, 0)} Fuel/day
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">⭐ Artifacts</span>
                  <span className="text-cyan-400 font-medium">
                    +{tiles.filter(t => t.type === 'artifact').reduce((s, t) => s + t.bonus, 0)} YES
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function PlanetExplorePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    }>
      <PlanetExploreContent />
    </Suspense>
  )
}
