'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { Rocket, Zap, Gem, Coins, Menu, Map, Bell, Star, RefreshCw, X, Save, CloudOff, Cloud, Loader2, ArrowRightLeft } from 'lucide-react'
import GalaxyMap, { CelestialObject, Ship, ShipType } from '@/components/GalaxyMap'
import InfoPanel from '@/components/InfoPanel'
import PlanetView, { Building, BuildingType, BUILDING_DEFS } from '@/components/PlanetView'
import { saveGame, loadGame, getPlayerId, type GameSave } from '@/lib/gameSave'
import TradeTerminal from '@/components/TradeTerminal'

/* ═══════════════════════════════════════════
   NAMES
═══════════════════════════════════════════ */
const SHIP_NAMES: Record<ShipType, string[]> = {
  scout: ['Eagle Eye', 'Pathfinder', 'Hawk', 'Voyager', 'Nebula', 'Horizon', 'Aurora', 'Comet'],
  miner: ['Gold Rush', 'Deep Dig', 'Rock Eater', 'Ore Hound', 'Crystal', 'Drill', 'Magma'],
  fighter: ['Iron Fist', 'Shadow', 'Thunder', 'Viper', 'Wraith', 'Storm', 'Blade', 'Fury'],
}
const ASTEROID_NAMES = ['Kryos Field','Ferro Belt','Dust Nebula','Titan Rock','Nova Debris','Dark Matter','Ice Sector','Iron Reef','Crystal Zone','Magma Rift','Stone Orbit','Gold Sector','Silver Void','Cobalt Ring','Obsidian Field']
const DEBRIS_NAMES = ['Wreck Alpha','Lost Cargo','Broken Hull','Satellite-7','Drift Metal','Junk Orbit','Old Module','Scrap Field','Dead Probe','Hull Fragment']
const PLANET_NAMES = ['Kepler-7b','Proxima-III','Andromeda-9','Titan Prime','Nova Terra','Helios-V','Orion-IV','Cygnus-X','Lyra Prime','Vega-II','Draco-8','Aquila-6']
const ENEMY_NAMES = ['Pirate Drifter','Rogue Drone','Void Raider','Scrap Sentinel','Dark Scout','Phantom Ship','Wraith Patrol','Corsair','Bandit Cruiser','Shadow Stalker']
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)]

/* ═══════════════════════════════════════════
   WORLD GEN
═══════════════════════════════════════════ */
function genWorld(hx: number, hy: number): CelestialObject[] {
  const objs: CelestialObject[] = []
  let id = 0
  const mkObj = (dist: number, count: number, enemyChance: number, lvlBase: number, resBase: number) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const r = dist + (Math.random() - 0.5) * 60
      const x = hx + Math.cos(angle) * r, y = hy + Math.sin(angle) * r
      const isEnemy = Math.random() < enemyChance
      const roll = Math.random()
      const type: CelestialObject['type'] = isEnemy ? 'enemy' : roll < 0.45 ? 'asteroid' : roll < 0.65 ? 'debris' : roll < 0.80 ? 'anomaly' : 'planet'
      const hp = (40 + lvlBase * 20) + Math.floor(Math.random() * 40)
      const isHostile = type === 'planet' && Math.random() < 0.4 // 40% hostile planets
      const getName = (t: string) => {
        if (t === 'enemy') return pick(ENEMY_NAMES)
        if (t === 'asteroid') return pick(ASTEROID_NAMES)
        if (t === 'debris') return pick(DEBRIS_NAMES)
        if (t === 'planet') return pick(PLANET_NAMES)
        if (t === 'station') return `Station-${Math.floor(Math.random() * 99)}`
        return `Anomaly-${Math.floor(Math.random() * 999)}`
      }
      objs.push({
        id: `obj-${id++}`, x, y, type,
        name: getName(type),
        discovered: false, level: lvlBase + Math.floor(Math.random() * 2),
        resources: type !== 'enemy' ? { energy: resBase + Math.floor(Math.random() * resBase), minerals: resBase + Math.floor(Math.random() * (resBase * 1.5)), credits: Math.floor(resBase * 0.5) + Math.floor(Math.random() * resBase) } : undefined,
        enemyHP: (type === 'enemy' || isHostile) ? hp : undefined,
        enemyMaxHP: (type === 'enemy' || isHostile) ? hp : undefined,
        loot: type === 'enemy' ? `${20 + lvlBase * 10} Cred + ${10 + lvlBase * 5} Min` : isHostile ? `Planet conquest + ${resBase * 3} resources` : undefined,
        depleted: false,
        hostile: isHostile,
      } as CelestialObject)
    }
  }
  mkObj(140, 8, 0.2, 1, 25)
  mkObj(270, 10, 0.3, 2, 50)
  mkObj(430, 10, 0.4, 4, 80)
  return objs
}

/* ═══════════════════════════════════════════
   EVENT POPUP
═══════════════════════════════════════════ */
type GameEvent = {
  id: number
  title: string
  message: string
  type: 'discovery' | 'combat' | 'mining' | 'info'
  actions: { label: string; action: string; color: string }[]
  shipId?: string
  targetId?: string
}

/* ═══════════════════════════════════════════
   GAME PAGE
═══════════════════════════════════════════ */
export default function ForgePage() {
  const HOME = { x: 500, y: 500, name: 'Nexus-Prime-OMEGA' }

  const [loading, setLoading] = useState(true)
  const [objects, setObjects] = useState<CelestialObject[]>([])
  const [ships, setShips] = useState<Ship[]>([])
  const [scannedAreas, setScannedAreas] = useState<{ x: number; y: number; radius: number }[]>([])
  const [selectedShip, setSelectedShip] = useState<Ship | null>(null)
  const [resources, setResources] = useState({ energy: 300, minerals: 200, credits: 500, yes: 25 })
  const [notifications, setNotifications] = useState<{ id: number; text: string }[]>([])
  const [events, setEvents] = useState<GameEvent[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<'galaxy' | 'planet'>('galaxy')
  const [viewedPlanet, setViewedPlanet] = useState<CelestialObject | null>(null)
  const [buildings, setBuildings] = useState<Building[]>([
    { type: 'hangar', level: 0 },
    { type: 'repair_bay', level: 0 },
    { type: 'barracks', level: 0 },
    { type: 'mining_hub', level: 0 },
    { type: 'radar', level: 0 },
    { type: 'shield', level: 0 },
    { type: 'fuel_refinery', level: 0 },
    { type: 'trading_post', level: 0 },
  ])
  const shipCount = useRef(0)
  const notifCount = useRef(0)
  const eventCount = useRef(0)
  const playTimeRef = useRef(0)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'offline'>('idle')
  const [lastSaveTime, setLastSaveTime] = useState<number>(0)
  const [showTrade, setShowTrade] = useState(false)

  // ════════════════════════════════
  // BUILDING EFFECTS
  // ════════════════════════════════
  const getBLvl = (type: BuildingType) => buildings.find(b => b.type === type)?.level || 0
  const buildingBonuses = {
    fogRadius: 100 + getBLvl('radar') * 50,
    refuelRate: 5 + getBLvl('fuel_refinery') * 2,
    repairRate: getBLvl('repair_bay') * 2,
    miningBonus: 1 + getBLvl('mining_hub') * 0.1,
    cargoBonus: getBLvl('mining_hub') >= 3 ? (getBLvl('mining_hub') - 2) * 20 : 0,
    fighterAtkBonus: 1 + getBLvl('barracks') * 0.1,
    fighterDefBonus: getBLvl('barracks') >= 3 ? (getBLvl('barracks') - 2) * 10 : 0,
    maxShips: 3 + getBLvl('hangar') * 2,
    buildCostReduction: getBLvl('hangar') >= 3 ? (getBLvl('hangar') - 2) * 0.2 : 0,
    yesPerHour: getBLvl('trading_post') >= 3 ? (getBLvl('trading_post') - 2) : 0,
  }

  // Tick
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 500)
    return () => clearInterval(t)
  }, [])

  // ════════════════════════════════
  // INIT — Load save or generate new world
  // ════════════════════════════════
  useEffect(() => {
    async function init() {
      const { save, error } = await loadGame()

      if (save && save.world.length > 0) {
        // ── Restore saved state ──
        setResources(save.resources)
        setBuildings(save.buildings)
        setShips(save.ships)
        setObjects(save.world)
        setScannedAreas(save.scannedAreas)
        shipCount.current = save.shipCount
        playTimeRef.current = save.stats.playTimeSeconds
        setSaveStatus('saved')
      } else {
        // ── New game ──
        setObjects(genWorld(HOME.x, HOME.y))
        shipCount.current = 3
        setShips([
          { id: 'ship-1', type: 'scout', name: 'Eagle Eye', x: HOME.x, y: HOME.y, targetX: null, targetY: null, speed: 40, status: 'docked', hp: 30, maxHp: 30, cargo: 0, maxCargo: 0, departTime: null, arriveTime: null, fuel: 100, maxFuel: 100, fuelPerMove: 8 },
          { id: 'ship-2', type: 'miner', name: 'Gold Rush', x: HOME.x, y: HOME.y, targetX: null, targetY: null, speed: 25, status: 'docked', hp: 50, maxHp: 50, cargo: 0, maxCargo: 100, departTime: null, arriveTime: null, fuel: 80, maxFuel: 80, fuelPerMove: 12 },
          { id: 'ship-3', type: 'fighter', name: 'Iron Fist', x: HOME.x, y: HOME.y, targetX: null, targetY: null, speed: 50, status: 'docked', hp: 80, maxHp: 80, cargo: 0, maxCargo: 20, departTime: null, arriveTime: null, fuel: 120, maxFuel: 120, fuelPerMove: 10 },
        ])
        if (error) setSaveStatus('offline')
      }
      setLoading(false)
    }
    init()
  }, [])

  const addNotif = useCallback((text: string) => {
    const id = notifCount.current++
    setNotifications(n => [...n.slice(-4), { id, text }])
    setTimeout(() => setNotifications(n => n.filter(nn => nn.id !== id)), 4000)
  }, [])

  // Trading Post: passive YES income every ~60s
  useEffect(() => {
    if (tick > 0 && tick % 120 === 0 && buildingBonuses.yesPerHour > 0) {
      setResources(r => ({ ...r, yes: r.yes + buildingBonuses.yesPerHour }))
    }
  }, [tick, buildingBonuses.yesPerHour])

  // ════════════════════════════════
  // SAVE SYSTEM
  // ════════════════════════════════
  // Play time counter (every second)
  useEffect(() => {
    const t = setInterval(() => { playTimeRef.current += 1 }, 1000)
    return () => clearInterval(t)
  }, [])

  // Collect current game state for saving
  const getGameState = useCallback((): GameSave => ({
    resources,
    buildings,
    ships,
    world: objects,
    scannedAreas,
    shipCount: shipCount.current,
    stats: {
      totalEnemiesKilled: 0,
      totalResourcesMined: 0,
      totalAnomaliesScanned: 0,
      playTimeSeconds: playTimeRef.current,
    },
  }), [resources, buildings, ships, objects, scannedAreas])

  // Manual save
  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    const result = await saveGame(getGameState())
    if (result.success) {
      setSaveStatus('saved')
      setLastSaveTime(Date.now())
      addNotif('💾 Game saved to cloud!')
    } else {
      setSaveStatus('error')
      addNotif(`❌ Save failed: ${result.error}`)
    }
    setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 3000)
  }, [getGameState, addNotif])

  // Auto-save every 30 seconds
  useEffect(() => {
    if (loading) return
    const interval = setInterval(async () => {
      const result = await saveGame(getGameState())
      if (result.success) {
        setSaveStatus('saved')
        setLastSaveTime(Date.now())
        setTimeout(() => setSaveStatus(prev => prev === 'saved' ? 'idle' : prev), 2000)
      } else {
        setSaveStatus('offline')
      }
    }, 30000) // 30s
    return () => clearInterval(interval)
  }, [loading, getGameState])

  // Save on page unload
  useEffect(() => {
    const handleUnload = () => {
      const state = getGameState()
      // Use sendBeacon for reliable save on close
      const playerId = getPlayerId()
      const blob = new Blob([JSON.stringify({
        player_id: playerId,
        energy: state.resources.energy,
        minerals: state.resources.minerals,
        credits: state.resources.credits,
        yes_tokens: state.resources.yes,
        buildings: state.buildings,
        ships: state.ships,
        world: state.world,
        scanned_areas: state.scannedAreas,
        ship_count: state.shipCount,
        play_time_seconds: playTimeRef.current,
      })], { type: 'application/json' })
      // Fallback: save to localStorage as backup
      try {
        localStorage.setItem('starforge_backup', JSON.stringify(state))
      } catch {}
    }
    window.addEventListener('beforeunload', handleUnload)
    return () => window.removeEventListener('beforeunload', handleUnload)
  }, [getGameState])

  const addEvent = useCallback((evt: Omit<GameEvent, 'id'>) => {
    const id = eventCount.current++
    setEvents(e => [...e, { ...evt, id }])
  }, [])

  const dismissEvent = useCallback((id: number) => {
    setEvents(e => e.filter(ev => ev.id !== id))
  }, [])

  // ════════════════════════════════
  // SHIP MOVEMENT HELPER
  // ════════════════════════════════
  const moveShip = useCallback((shipId: string, tx: number, ty: number, newStatus: Ship['status']) => {
    setShips(prev => prev.map(s => {
      if (s.id !== shipId) return s
      const dist = Math.hypot(tx - s.x, ty - s.y)
      const time = (dist / s.speed) * 1000
      return { ...s, targetX: tx, targetY: ty, status: 'moving' as Ship['status'], departTime: Date.now(), arriveTime: Date.now() + time }
    }))
  }, [])

  const dockShip = useCallback((shipId: string) => {
    setShips(prev => prev.map(s =>
      s.id === shipId ? { ...s, status: 'docked', x: HOME.x, y: HOME.y, targetX: null, targetY: null, departTime: null, arriveTime: null } : s
    ))
  }, [])

  const returnShip = useCallback((shipId: string) => {
    setShips(prev => prev.map(s => {
      if (s.id !== shipId) return s
      const dist = Math.hypot(HOME.x - s.x, HOME.y - s.y)
      if (dist < 15) return { ...s, status: 'docked', x: HOME.x, y: HOME.y, targetX: null, targetY: null, departTime: null, arriveTime: null }
      const time = (dist / s.speed) * 1000
      return { ...s, targetX: HOME.x, targetY: HOME.y, status: 'moving', departTime: Date.now(), arriveTime: Date.now() + time }
    }))
    addNotif('📡 Ship returning to base')
  }, [addNotif])

  // ════════════════════════════════
  // SCOUT — AUTO EXPLORE
  // ════════════════════════════════
  const launchScout = useCallback((shipId: string) => {
    // Pick random unexplored direction
    const angle = Math.random() * Math.PI * 2
    const dist = 120 + Math.random() * 150
    const tx = HOME.x + Math.cos(angle) * dist
    const ty = HOME.y + Math.sin(angle) * dist
    moveShip(shipId, tx, ty, 'scouting')
    addNotif('🔭 Scout launched — auto exploring...')
  }, [moveShip, addNotif])

  // ════════════════════════════════
  // MINER — GO MINE
  // ════════════════════════════════
  const launchMiner = useCallback((shipId: string, targetId: string) => {
    const target = objects.find(o => o.id === targetId)
    if (!target) return
    moveShip(shipId, target.x, target.y, 'moving')
    // Store target ID + autoLoop on ship
    setShips(prev => prev.map(s => s.id === shipId ? { ...s, miningTarget: targetId, autoLoop: true, cargo: 0 } as any : s))
    addNotif(`⛏️ Miner heading to ${target.name} (auto-loop ON)`)
  }, [objects, moveShip, addNotif])

  // ════════════════════════════════
  // FIGHTER — ATTACK
  // ════════════════════════════════
  const launchFighterAttack = useCallback((shipId: string, targetId: string) => {
    const target = objects.find(o => o.id === targetId)
    if (!target) return
    moveShip(shipId, target.x, target.y, 'moving')
    setShips(prev => prev.map(s => s.id === shipId ? { ...s, attackTarget: targetId } as any : s))
    addNotif(`⚔️ Fighter engaging ${target.name}!`)
  }, [objects, moveShip, addNotif])

  // ════════════════════════════════
  // FIGHTER — DEFENSE MODE
  // ════════════════════════════════
  const setDefender = useCallback((shipId: string) => {
    setShips(prev => prev.map(s => s.id === shipId ? { ...s, status: 'defending' as Ship['status'] } : s))
    addNotif('🛡️ Fighter on defense standby')
  }, [addNotif])

  // ════════════════════════════════
  // ARRIVAL LOGIC (every tick)
  // ════════════════════════════════
  useEffect(() => {
    const now = Date.now()
    setShips(prev => prev.map(ship => {
      // ── REFUELING at base ──
      if ((ship.status === 'docked' || ship.status === 'refueling') && ship.fuel < ship.maxFuel) {
        const refuelRate = buildingBonuses.refuelRate
        const newFuel = Math.min(ship.maxFuel, ship.fuel + refuelRate)
        const repaired = ship.hp < ship.maxHp && buildingBonuses.repairRate > 0
          ? Math.min(ship.maxHp, ship.hp + buildingBonuses.repairRate) : ship.hp
        return { ...ship, fuel: newFuel, hp: repaired, status: newFuel >= ship.maxFuel ? 'docked' as Ship['status'] : 'refueling' as Ship['status'] }
      }
      // ── REPAIR at base (docked, fuel full) ──
      if (ship.status === 'docked' && ship.hp < ship.maxHp && buildingBonuses.repairRate > 0) {
        return { ...ship, hp: Math.min(ship.maxHp, ship.hp + buildingBonuses.repairRate) }
      }

      if (ship.status !== 'moving' && ship.status !== 'scouting' || !ship.arriveTime || now < ship.arriveTime) return ship
      const originalStatus = ship.status // save before overwrite

      // ── Consume fuel on arrival ──
      const dist = Math.hypot((ship.targetX || 0) - ship.x, (ship.targetY || 0) - ship.y)
      const fuelUsed = Math.ceil((dist / 100) * ship.fuelPerMove)
      const newFuel = Math.max(0, ship.fuel - fuelUsed)
      const arrived = { ...ship, x: ship.targetX!, y: ship.targetY!, targetX: null as number | null, targetY: null as number | null, departTime: null as number | null, arriveTime: null as number | null, fuel: newFuel }

      // If returning home
      if (Math.hypot(arrived.x - HOME.x, arrived.y - HOME.y) < 20) {
        addNotif(`📡 ${ship.name} returned to base`)
        return { ...arrived, status: 'refueling' as Ship['status'], x: HOME.x, y: HOME.y, cargo: 0 }
      }

      // ── LOW FUEL CHECK — auto return ──
      const distHome = Math.hypot(arrived.x - HOME.x, arrived.y - HOME.y)
      const fuelToReturn = Math.ceil((distHome / 100) * ship.fuelPerMove) + 5 // +5 safety margin
      if (arrived.fuel <= fuelToReturn) {
        addNotif(`⛽ ${ship.name} low fuel — returning to base!`)
        const tHome = (distHome / ship.speed) * 1000
        return {
          ...arrived,
          targetX: HOME.x as number | null,
          targetY: HOME.y as number | null,
          status: 'moving' as Ship['status'],
          departTime: Date.now() as number | null,
          arriveTime: (Date.now() + tHome) as number | null,
        }
      }

      // ── SCOUT ARRIVAL ──
      if (ship.type === 'scout') {
        const wasScouting = originalStatus === 'scouting'

        // Set scanning status — will scan for 3s then reveal + decide
        arrived.status = 'scanning' as Ship['status']
        addNotif(`🔭 ${ship.name} scanning area...`)
        
        setTimeout(() => {
          // Reveal fog
          setScannedAreas(a => [...a, { x: arrived.x, y: arrived.y, radius: 140 }])
          // Discover objects
          const found: CelestialObject[] = []
          setObjects(objs => objs.map(o => {
            if (!o.discovered && Math.hypot(o.x - arrived.x, o.y - arrived.y) < 140) {
              found.push({ ...o, discovered: true })
              return { ...o, discovered: true }
            }
            return o
          }))

          if (found.length > 0) {
            // Found something! Stop and popup
            setShips(s => s.map(ss => ss.id === ship.id ? { ...ss, status: 'waiting' as Ship['status'] } : ss))
            const enemies = found.filter(f => f.type === 'enemy')
            const asteroids = found.filter(f => f.type === 'asteroid' || f.type === 'debris')
            const others = found.filter(f => f.type !== 'enemy' && f.type !== 'asteroid' && f.type !== 'debris')

            let msg = `Found: `
            if (asteroids.length) msg += `${asteroids.length} asteroid(s), `
            if (enemies.length) msg += `${enemies.length} enemy(ies)! ⚠️ `
            if (others.length) msg += `${others.length} other object(s), `

            const actions: GameEvent['actions'] = [
              { label: '🔭 Continue Scouting', action: 'scout_continue', color: 'sky' },
              { label: '📡 Return to Base', action: 'scout_return', color: 'gray' },
            ]
            if (enemies.length > 0) {
              actions.unshift({ label: '🚨 Call Reinforcements!', action: 'call_reinforcements', color: 'red' })
            }

            addEvent({
              title: `🔭 ${ship.name} — Discovery!`,
              message: msg,
              type: enemies.length > 0 ? 'combat' : 'discovery',
              actions,
              shipId: ship.id,
            })
            addNotif(`🔭 ${ship.name} found ${found.length} object(s)!`)
          } else if (wasScouting) {
            // Nothing found + was auto-scouting → continue to next waypoint
            const angle = Math.random() * Math.PI * 2
            const dist = 150 + Math.random() * 180
            const nx = arrived.x + Math.cos(angle) * dist
            const ny = arrived.y + Math.sin(angle) * dist
            const d = Math.hypot(nx - arrived.x, ny - arrived.y)
            setShips(s => s.map(ss => ss.id === ship.id ? {
              ...ss,
              targetX: nx,
              targetY: ny,
              status: 'scouting' as Ship['status'],
              departTime: Date.now(),
              arriveTime: Date.now() + (d / ss.speed) * 1000,
            } : ss))
          } else {
            // Manual waypoint arrived → just wait for next command
            setShips(s => s.map(ss => ss.id === ship.id ? { ...ss, status: 'waiting' as Ship['status'] } : ss))
            addNotif(`🔭 ${ship.name} arrived at waypoint — awaiting orders`)
          }
        }, 3000) // 3 second scan animation
        
        return arrived
      }

      // ── MINER ARRIVAL ──
      if (ship.type === 'miner') {
        const targetId = (ship as any).miningTarget
        const target = objects.find(o => o.id === targetId)
        if (target && !target.depleted) {
          arrived.status = 'mining' as Ship['status']
          addNotif(`⛏️ ${ship.name} mining ${target.name}...`)
          
          // Mining loop — mine every 4s until cargo full or depleted
          const mineLoop = () => {
            setShips(currentShips => {
              const currentShip = currentShips.find(s => s.id === ship.id)
              if (!currentShip || currentShip.status !== 'mining') return currentShips
              
              setObjects(currentObjs => {
                const currentTarget = currentObjs.find(o => o.id === targetId)
                if (!currentTarget || currentTarget.depleted || !currentTarget.resources) {
                  // Asteroid depleted — return home
                  addNotif(`🪨 ${currentTarget?.name || 'Target'} depleted!`)
                  returnShip(ship.id)
                  return currentObjs
                }
                
                const mineAmount = {
                  energy: Math.min(currentTarget.resources.energy, Math.round((12 + Math.floor(Math.random() * 10)) * buildingBonuses.miningBonus)),
                  minerals: Math.min(currentTarget.resources.minerals, Math.round((15 + Math.floor(Math.random() * 12)) * buildingBonuses.miningBonus)),
                  credits: Math.min(currentTarget.resources.credits, Math.round((8 + Math.floor(Math.random() * 8)) * buildingBonuses.miningBonus)),
                }
                const totalMined = mineAmount.energy + mineAmount.minerals + mineAmount.credits
                
                // Check cargo space
                const cargoUsed = currentShip.cargo + totalMined
                if (cargoUsed >= currentShip.maxCargo) {
                  // Cargo full — take what fits, return home
                  setResources(r => ({ ...r, energy: r.energy + mineAmount.energy, minerals: r.minerals + mineAmount.minerals, credits: r.credits + mineAmount.credits }))
                  addNotif(`📦 ${ship.name} cargo full! +${mineAmount.energy}⚡ +${mineAmount.minerals}💎 — heading home`)
                  setShips(s => s.map(ss => ss.id === ship.id ? { ...ss, cargo: currentShip.maxCargo } : ss))
                  
                  // Update asteroid
                  const newR = { energy: currentTarget.resources.energy - mineAmount.energy, minerals: currentTarget.resources.minerals - mineAmount.minerals, credits: currentTarget.resources.credits - mineAmount.credits }
                  const dep = newR.energy <= 0 && newR.minerals <= 0 && newR.credits <= 0
                  
                  // Auto-loop: return home, dump cargo, go back
                  const isAutoLoop = (ship as any).autoLoop && !dep
                  returnShip(ship.id)
                  
                  if (isAutoLoop) {
                    // After return + refuel, auto-relaunch
                    const returnDist = Math.hypot(HOME.x - currentShip.x, HOME.y - currentShip.y)
                    const returnTime = (returnDist / currentShip.speed) * 1000 + 3000 // travel + buffer
                    setTimeout(() => {
                      setShips(s => {
                        const cur = s.find(ss => ss.id === ship.id)
                        if (!cur || (cur.status !== 'docked' && cur.status !== 'refueling')) return s
                        // Reset cargo and relaunch
                        addNotif(`🔄 ${ship.name} auto-relaunch to mine!`)
                        const target2 = objects.find(o => o.id === targetId)
                        if (!target2 || target2.depleted) {
                          addNotif(`🪨 Target depleted — auto-loop stopped`)
                          return s.map(ss => ss.id === ship.id ? { ...ss, cargo: 0 } : ss)
                        }
                        const d = Math.hypot(target2.x - HOME.x, target2.y - HOME.y)
                        return s.map(ss => ss.id === ship.id ? {
                          ...ss,
                          cargo: 0,
                          x: HOME.x, y: HOME.y,
                          targetX: target2.x, targetY: target2.y,
                          status: 'moving' as Ship['status'],
                          departTime: Date.now(),
                          arriveTime: Date.now() + (d / ss.speed) * 1000,
                        } : ss)
                      })
                    }, returnTime + 5000) // wait for return + 5s refuel
                  }
                  
                  return currentObjs.map(o => o.id === targetId ? { ...o, resources: newR, depleted: dep } : o)
                }
                
                // Mine and continue
                setResources(r => ({ ...r, energy: r.energy + mineAmount.energy, minerals: r.minerals + mineAmount.minerals, credits: r.credits + mineAmount.credits }))
                setShips(s => s.map(ss => ss.id === ship.id ? { ...ss, cargo: ss.cargo + totalMined } : ss))
                addNotif(`⛏️ +${mineAmount.energy}⚡ +${mineAmount.minerals}💎 +${mineAmount.credits}💰`)
                
                // Update asteroid resources
                const newR = { energy: currentTarget.resources.energy - mineAmount.energy, minerals: currentTarget.resources.minerals - mineAmount.minerals, credits: currentTarget.resources.credits - mineAmount.credits }
                const dep = newR.energy <= 0 && newR.minerals <= 0 && newR.credits <= 0
                if (dep) {
                  addNotif(`🪨 ${currentTarget.name} depleted!`)
                  returnShip(ship.id)
                } else {
                  // Continue mining — next cycle
                  setTimeout(mineLoop, 4000)
                }
                return currentObjs.map(o => o.id === targetId ? { ...o, resources: newR, depleted: dep } : o)
              })
              return currentShips
            })
          }
          setTimeout(mineLoop, 4000) // first mine after 4s
        } else {
          addNotif(`⛏️ Target depleted, returning...`)
          returnShip(ship.id)
        }
        return arrived
      }

      // ── FIGHTER ARRIVAL ──
      if (ship.type === 'fighter') {
        const targetId = (ship as any).attackTarget
        const target = objects.find(o => o.id === targetId)

        // Check if target is a hostile planet
        if (target && target.type === 'planet' && target.hostile && (target.enemyHP || 0) > 0) {
          arrived.status = 'fighting' as Ship['status']
          addNotif(`⚔️ ${ship.name} attacking ${target.name} defenses!`)
          setScannedAreas(a => [...a, { x: arrived.x, y: arrived.y, radius: 80 }])

          // Combat loop against planet defenses
          const combatLoop = () => {
            setShips(currentShips => {
              const currentShip = currentShips.find(s => s.id === ship.id)
              if (!currentShip || currentShip.status !== 'fighting') return currentShips

              setObjects(currentObjs => {
                const currentTarget = currentObjs.find(o => o.id === targetId)
                if (!currentTarget || !currentTarget.enemyHP || currentTarget.enemyHP <= 0) {
                  // Planet conquered!
                  returnShip(ship.id)
                  return currentObjs
                }

                const dmg = Math.round((20 + Math.floor(Math.random() * 20)) * buildingBonuses.fighterAtkBonus)
                const planetDmg = Math.max(1, (5 + Math.floor(Math.random() * (currentTarget.level * 4))) - buildingBonuses.fighterDefBonus)
                const newHP = Math.max(0, currentTarget.enemyHP - dmg)

                // Fighter takes damage
                setShips(s => s.map(ss => {
                  if (ss.id !== ship.id) return ss
                  const newShipHp = Math.max(0, ss.hp - planetDmg)
                  if (newShipHp <= 0) {
                    addNotif(`💥 ${ss.name} destroyed by ${currentTarget.name} defenses!`)
                    addEvent({
                      title: '💥 Ship Lost!',
                      message: `${ss.name} was destroyed by ${currentTarget.name}'s planetary defenses!`,
                      type: 'combat',
                      actions: [{ label: 'OK', action: 'dismiss', color: 'gray' }],
                    })
                    return { ...ss, hp: 0, status: 'docked' as Ship['status'], x: HOME.x, y: HOME.y }
                  }
                  return { ...ss, hp: newShipHp }
                }))

                if (newHP <= 0) {
                  // Planet conquered!
                  const lootCredits = 50 + currentTarget.level * 25
                  const lootMinerals = 30 + currentTarget.level * 15
                  const lootEnergy = 30 + currentTarget.level * 15
                  setResources(r => ({ ...r, credits: r.credits + lootCredits, minerals: r.minerals + lootMinerals, energy: r.energy + lootEnergy }))
                  addNotif(`🏴 ${currentTarget.name} conquered! +${lootCredits}💰 +${lootMinerals}💎 +${lootEnergy}⚡`)
                  addEvent({
                    title: '🏴 Planet Conquered!',
                    message: `${ship.name} defeated ${currentTarget.name}'s defenses!\n\nLoot: +${lootEnergy}⚡ +${lootMinerals}💎 +${lootCredits}💰\n\nThe planet is now safe for mining!`,
                    type: 'discovery',
                    actions: [{ label: '📡 Return to Base', action: 'fighter_return', color: 'green' }],
                    shipId: ship.id,
                  })
                  return currentObjs.map(o => o.id === targetId ? { ...o, hostile: false, enemyHP: 0 } : o)
                } else {
                  addNotif(`⚔️ ${ship.name} dealt ${dmg} dmg to ${currentTarget.name} — Defenses: ${newHP}/${currentTarget.enemyMaxHP}`)
                  setTimeout(combatLoop, 3000)
                  return currentObjs.map(o => o.id === targetId ? { ...o, enemyHP: newHP } : o)
                }
              })
              return currentShips
            })
          }
          setTimeout(combatLoop, 3000)
        } else if (target && target.type === 'enemy' && (target.enemyHP || 0) > 0) {
          arrived.status = 'fighting' as Ship['status']
          addNotif(`⚔️ ${ship.name} engaging ${target.name}!`)
          // Fighter reveals small fog
          setScannedAreas(a => [...a, { x: arrived.x, y: arrived.y, radius: 60 }])
          setObjects(objs => objs.map(o => {
            if (!o.discovered && Math.hypot(o.x - arrived.x, o.y - arrived.y) < 60) return { ...o, discovered: true }
            return o
          }))
          
          // Combat loop — auto fight every 3s
          const combatLoop = () => {
            setShips(currentShips => {
              const currentShip = currentShips.find(s => s.id === ship.id)
              if (!currentShip || currentShip.status !== 'fighting') return currentShips
              
              setObjects(currentObjs => {
                const currentTarget = currentObjs.find(o => o.id === targetId)
                if (!currentTarget || currentTarget.type !== 'enemy' || !currentTarget.enemyHP || currentTarget.enemyHP <= 0) {
                  // Already dead
                  returnShip(ship.id)
                  return currentObjs
                }
                
                const dmg = Math.round((25 + Math.floor(Math.random() * 25)) * buildingBonuses.fighterAtkBonus)
                const enemyDmg = Math.max(1, (8 + Math.floor(Math.random() * (currentTarget.level * 5))) - buildingBonuses.fighterDefBonus)
                const newHP = Math.max(0, currentTarget.enemyHP - dmg)
                
                // Take damage
                setShips(s => s.map(ss => {
                  if (ss.id !== ship.id) return ss
                  const newShipHp = Math.max(0, ss.hp - enemyDmg)
                  if (newShipHp <= 0) {
                    // Ship destroyed!
                    addNotif(`💥 ${ss.name} was destroyed!`)
                    addEvent({
                      title: '💥 Ship Lost!',
                      message: `${ss.name} was destroyed by ${currentTarget.name}!`,
                      type: 'combat',
                      actions: [{ label: 'OK', action: 'dismiss', color: 'gray' }],
                    })
                    return { ...ss, hp: 0, status: 'docked' as Ship['status'], x: HOME.x, y: HOME.y }
                  }
                  return { ...ss, hp: newShipHp }
                }))
                
                if (newHP <= 0) {
                  // Enemy destroyed!
                  const lootCredits = 20 + currentTarget.level * 15
                  const lootMinerals = 10 + currentTarget.level * 8
                  setResources(r => ({ ...r, credits: r.credits + lootCredits, minerals: r.minerals + lootMinerals }))
                  addNotif(`🎉 ${currentTarget.name} destroyed! +${lootCredits}💰 +${lootMinerals}💎`)
                  addEvent({
                    title: '🎉 Victory!',
                    message: `${ship.name} defeated ${currentTarget.name}!\nLoot: +${lootCredits} Credits, +${lootMinerals} Minerals\n${ship.name} took ${enemyDmg} damage.`,
                    type: 'combat',
                    actions: [{ label: '📡 Return to Base', action: 'fighter_return', color: 'green' }],
                    shipId: ship.id,
                  })
                  return currentObjs.filter(o => o.id !== targetId)
                } else {
                  // Enemy survived — show combat report + continue fighting
                  addNotif(`⚔️ ${ship.name} dealt ${dmg} dmg — Enemy HP: ${newHP}/${currentTarget.enemyMaxHP}`)
                  setTimeout(combatLoop, 3000) // next attack in 3s
                  return currentObjs.map(o => o.id === targetId ? { ...o, enemyHP: newHP } : o)
                }
              })
              return currentShips
            })
          }
          setTimeout(combatLoop, 3000) // first attack after 3s
        } else {
          returnShip(ship.id)
        }
        return arrived
      }

      return { ...arrived, status: 'docked' }
    }))
  }, [tick, objects, addNotif, addEvent, returnShip])

  // ════════════════════════════════
  // EVENT HANDLERS
  // ════════════════════════════════
  const handleEventAction = useCallback((event: GameEvent, action: string) => {
    dismissEvent(event.id)
    
    switch (action) {
      case 'scout_continue':
        if (event.shipId) launchScout(event.shipId)
        break
      case 'scout_return':
      case 'fighter_return':
        if (event.shipId) returnShip(event.shipId)
        break
      case 'call_reinforcements': {
        // Find a defending fighter
        const defender = ships.find(s => s.type === 'fighter' && s.status === 'defending')
        if (defender && event.shipId) {
          const scout = ships.find(s => s.id === event.shipId)
          if (scout) {
            moveShip(defender.id, scout.x, scout.y, 'moving')
            // Find nearest enemy to scout
            const nearestEnemy = objects.filter(o => o.type === 'enemy' && o.discovered).sort((a, b) =>
              Math.hypot(a.x - scout.x, a.y - scout.y) - Math.hypot(b.x - scout.x, b.y - scout.y)
            )[0]
            if (nearestEnemy) {
              setShips(prev => prev.map(s => s.id === defender.id ? { ...s, attackTarget: nearestEnemy.id } as any : s))
            }
            addNotif(`🛡️ ${defender.name} responding to distress call!`)
          }
        } else {
          addNotif('❌ No defenders available!')
        }
        // Scout retreats
        if (event.shipId) returnShip(event.shipId)
        break
      }
      case 'fighter_attack_again':
        if (event.shipId && event.targetId) {
          const target = objects.find(o => o.id === event.targetId)
          if (target) {
            moveShip(event.shipId, target.x, target.y, 'moving')
            setShips(prev => prev.map(s => s.id === event.shipId ? { ...s, attackTarget: event.targetId } as any : s))
          }
        }
        break
      case 'dismiss':
        // Just close the popup
        break
    }
  }, [ships, objects, dismissEvent, launchScout, returnShip, moveShip, addNotif])

  // ════════════════════════════════
  // BUILD SHIP
  // ════════════════════════════════
  const buildShip = useCallback((type: ShipType) => {
    if (getBLvl('hangar') < 1) { addNotif('❌ Build a Hangar first!'); return }
    if (ships.length >= buildingBonuses.maxShips) { addNotif(`❌ Hangar full! (${ships.length}/${buildingBonuses.maxShips})`); return }

    const baseCosts: Record<ShipType, { e: number; m: number; c: number }> = {
      scout: { e: 150, m: 100, c: 50 }, miner: { e: 200, m: 150, c: 100 }, fighter: { e: 300, m: 200, c: 150 },
    }
    const base = baseCosts[type]
    const disc = buildingBonuses.buildCostReduction
    const cost = { e: Math.round(base.e * (1 - disc)), m: Math.round(base.m * (1 - disc)), c: Math.round(base.c * (1 - disc)) }
    if (resources.energy < cost.e || resources.minerals < cost.m || resources.credits < cost.c) {
      addNotif(`❌ Need ${cost.e}⚡ ${cost.m}💎 ${cost.c}💰`); return
    }

    shipCount.current++
    const n = shipCount.current
    const newShip: Ship = {
      id: `ship-${n}`, type, name: `${pick(SHIP_NAMES[type])} ${n}`,
      x: HOME.x, y: HOME.y, targetX: null, targetY: null,
      speed: type === 'scout' ? 40 : type === 'miner' ? 25 : 50,
      status: 'docked', hp: type === 'scout' ? 30 : type === 'miner' ? 50 : 80,
      maxHp: type === 'scout' ? 30 : type === 'miner' ? 50 : 80,
      cargo: 0, maxCargo: type === 'miner' ? 100 : 20, departTime: null, arriveTime: null,
      fuel: type === 'scout' ? 100 : type === 'miner' ? 80 : 120,
      maxFuel: type === 'scout' ? 100 : type === 'miner' ? 80 : 120,
      fuelPerMove: type === 'scout' ? 8 : type === 'miner' ? 12 : 10,
    }
    setShips(s => [...s, newShip])
    setResources(r => ({ ...r, energy: r.energy - cost.e, minerals: r.minerals - cost.m, credits: r.credits - cost.c }))
    addNotif(`🔨 Built: ${newShip.name}`)
  }, [resources, ships.length, buildingBonuses, addNotif])

  // ════════════════════════════════
  // BUILDING UPGRADE
  // ════════════════════════════════
  const handleUpgradeBuilding = useCallback((type: BuildingType) => {
    const building = buildings.find(b => b.type === type)
    if (!building || building.level >= 5) return
    const def = BUILDING_DEFS[type]
    const nextLevel = def.levels[building.level]
    if (!nextLevel) return
    if (resources.energy < nextLevel.cost.energy || resources.minerals < nextLevel.cost.minerals) {
      addNotif('❌ Not enough resources!')
      return
    }
    setResources(r => ({
      ...r,
      energy: r.energy - nextLevel.cost.energy,
      minerals: r.minerals - nextLevel.cost.minerals,
    }))
    setBuildings(prev => prev.map(b => b.type === type ? { ...b, level: b.level + 1 } : b))
    addNotif(`🔨 ${def.icon} ${def.name} upgraded to Level ${building.level + 1}!`)
  }, [buildings, resources, addNotif])

  // ════════════════════════════════
  // PLANET CLICK — zoom into planet
  // ════════════════════════════════
  const handlePlanetClick = useCallback((obj: CelestialObject) => {
    if (obj.type === 'planet') {
      setViewedPlanet(obj)
      setViewMode('planet')
    }
  }, [])

  const handleHomeBaseClick = useCallback(() => {
    setViewedPlanet(null)
    setViewMode('planet')
  }, [])

  // ════════════════════════════════
  // ANOMALY SCAN (Scout → 2-5 min timer → random loot)
  // ════════════════════════════════
  const SCAN_LOOT_TABLE = [
    { name: '⚡ Energy Cache', energy: 50, minerals: 0, credits: 0, yes: 0, rarity: 'common' },
    { name: '💎 Mineral Deposit', energy: 0, minerals: 40, credits: 0, yes: 0, rarity: 'common' },
    { name: '💰 Lost Cargo', energy: 10, minerals: 10, credits: 30, yes: 0, rarity: 'common' },
    { name: '⚡💎 Rich Vein', energy: 80, minerals: 60, credits: 20, yes: 0, rarity: 'uncommon' },
    { name: '🌟 Rare Artifact', energy: 30, minerals: 30, credits: 50, yes: 2, rarity: 'rare' },
    { name: '🔮 Void Crystal', energy: 0, minerals: 100, credits: 0, yes: 3, rarity: 'rare' },
    { name: '✨ Ancient Tech', energy: 100, minerals: 80, credits: 100, yes: 5, rarity: 'epic' },
    { name: '💀 Empty... Trap!', energy: -20, minerals: -10, credits: 0, yes: 0, rarity: 'trap' },
  ]

  const rollLoot = useCallback(() => {
    const roll = Math.random()
    if (roll < 0.05) return SCAN_LOOT_TABLE[7] // 5% trap
    if (roll < 0.15) return SCAN_LOOT_TABLE[6] // 10% epic
    if (roll < 0.35) return SCAN_LOOT_TABLE[4 + Math.floor(Math.random() * 2)] // 20% rare
    if (roll < 0.55) return SCAN_LOOT_TABLE[3] // 20% uncommon
    return SCAN_LOOT_TABLE[Math.floor(Math.random() * 3)] // 45% common
  }, [])

  const handleScanAnomaly = useCallback((shipId: string, targetId: string) => {
    const target = objects.find(o => o.id === targetId)
    if (!target || target.type !== 'anomaly') return

    // Check if anomaly is depleted (max 3 uses)
    if ((target.anomalyUses || 0) >= 3) {
      addNotif(`❌ ${target.name} is depleted — no more scans possible`)
      return
    }

    // Check cooldown (10 min between scans)
    if (target.anomalyCooldownEnd && Date.now() < target.anomalyCooldownEnd) {
      const remaining = Math.ceil((target.anomalyCooldownEnd - Date.now()) / 60000)
      addNotif(`⏳ ${target.name} on cooldown — ${remaining} min remaining`)
      return
    }

    // Move scout to anomaly
    moveShip(shipId, target.x, target.y, 'moving')

    // Set scan timer (2-5 min)
    const scanTime = 120000 + Math.floor(Math.random() * 180000)
    const arrivalTime = (Math.hypot(target.x - HOME.x, target.y - HOME.y) / 40) * 1000
    const scanEnd = Date.now() + arrivalTime + scanTime

    setObjects(prev => prev.map(o => o.id === targetId ? { ...o, anomalyScanning: true, anomalyScanEnd: scanEnd } : o))
    addNotif(`🌀 Scout heading to ${target.name} — Scan: ${Math.round(scanTime / 60000)} min`)

    // After arrival, hide the scout (enters the anomaly)
    setTimeout(() => {
      setShips(prev => prev.map(s => s.id === shipId ? { ...s, status: 'scanning' as Ship['status'], x: -9999, y: -9999, targetX: null, targetY: null, departTime: null, arriveTime: null } : s))
      addNotif(`🔭 Scout entered ${target.name} — scanning...`)
    }, arrivalTime)

    setTimeout(() => {
      const loot = rollLoot()
      const rarityColors: Record<string, string> = { common: '⬜', uncommon: '🟢', rare: '🔵', epic: '🟣', trap: '🔴' }
      const uses = (target.anomalyUses || 0) + 1
      const isDepleted = uses >= 3

      // Diminishing returns: reduce loot by 30% per use
      const mult = 1 - (target.anomalyUses || 0) * 0.3
      const energy = Math.round(Math.max(0, loot.energy * mult))
      const minerals = Math.round(Math.max(0, loot.minerals * mult))
      const credits = Math.round(Math.max(0, loot.credits * mult))
      const yes = Math.round(Math.max(0, loot.yes * mult))

      setResources(r => ({
        ...r,
        energy: Math.max(0, r.energy + energy),
        minerals: Math.max(0, r.minerals + minerals),
        credits: Math.max(0, r.credits + credits),
        yes: Math.max(0, r.yes + yes),
      }))

      // 10 min cooldown between scans, mark uses, deplete if max
      const cooldownEnd = isDepleted ? null : Date.now() + 600000
      setObjects(prev => prev.map(o => o.id === targetId ? {
        ...o,
        anomalyScanning: false, anomalyScanEnd: null, anomalyScanned: true,
        anomalyUses: uses,
        anomalyCooldownEnd: cooldownEnd,
        depleted: isDepleted,
      } : o))

      // Restore scout at anomaly position, then return to base
      setShips(prev => prev.map(s => s.id === shipId ? { ...s, x: target.x, y: target.y, status: 'waiting' as Ship['status'] } : s))
      returnShip(shipId)

      // Special mission chance (15%): spawn a ship blueprint!
      const specialRoll = Math.random()
      let specialMsg = ''
      if (specialRoll < 0.05) {
        // 5% chance: free scout ship!
        const newShip: Ship = {
          id: `ship-found-${Date.now()}`, type: 'scout', name: `Salvaged Scout`,
          x: HOME.x, y: HOME.y, targetX: null, targetY: null, speed: 40,
          status: 'docked', hp: 20, maxHp: 20, cargo: 0, maxCargo: 30,
          departTime: null, arriveTime: null, fuel: 80, maxFuel: 80, fuelPerMove: 8,
        }
        setShips(prev => [...prev, newShip])
        specialMsg = '\n\n🚀 BONUS: Salvaged Scout ship found!'
      } else if (specialRoll < 0.15) {
        // 10% chance: bonus resources
        const bonus = 50 + Math.floor(Math.random() * 100)
        setResources(r => ({ ...r, energy: r.energy + bonus, minerals: r.minerals + bonus }))
        specialMsg = `\n\n💫 BONUS: Hidden cache! +${bonus}⚡ +${bonus}💎`
      }

      const lootMsg = [
        energy ? `⚡+${energy}` : '', minerals ? `💎+${minerals}` : '',
        credits ? `💰+${credits}` : '', yes ? `🌟+${yes} YES` : '',
      ].filter(Boolean).join(' ')

      addEvent({
        title: `🌀 Scan Complete — ${target.name}`,
        message: `${rarityColors[loot.rarity]} ${loot.rarity.toUpperCase()} — ${loot.name}\n\n${lootMsg}${isDepleted ? '\n\n⚠️ Anomaly depleted!' : ` (${uses}/3)`}${specialMsg}`,
        type: loot.rarity === 'trap' ? 'combat' : 'discovery',
        actions: [{ label: 'OK', action: 'dismiss', color: loot.rarity === 'trap' ? 'red' : 'green' }],
      })
      addNotif(`🌀 Scan loot: ${loot.name}`)
    }, arrivalTime + scanTime)
  }, [objects, moveShip, rollLoot, returnShip, addNotif, addEvent])

  // ════════════════════════════════
  // ANOMALY MISSION (Fighter → 3-5 min → combat loot, fighter hidden)
  // ════════════════════════════════
  const MISSION_LOOT_TABLE = [
    { name: '⚔️ Void Pirate Bounty', energy: 40, minerals: 60, credits: 80, yes: 3, dmg: 15, rarity: 'common' },
    { name: '🛡️ Ancient Guardian', energy: 60, minerals: 80, credits: 60, yes: 5, dmg: 25, rarity: 'uncommon' },
    { name: '👾 Eldritch Horror', energy: 100, minerals: 100, credits: 120, yes: 8, dmg: 35, rarity: 'rare' },
    { name: '🌌 Dimensional Rift Boss', energy: 150, minerals: 150, credits: 200, yes: 12, dmg: 50, rarity: 'epic' },
    { name: '💀 Overwhelming Force!', energy: 0, minerals: 0, credits: 0, yes: 0, dmg: 999, rarity: 'death' },
  ]

  const handleAnomalyMission = useCallback((shipId: string, targetId: string) => {
    const target = objects.find(o => o.id === targetId)
    if (!target || target.type !== 'anomaly') return

    // Check depleted
    if ((target.anomalyUses || 0) >= 3) {
      addNotif(`❌ ${target.name} is depleted`)
      return
    }
    // Check cooldown
    if (target.anomalyCooldownEnd && Date.now() < target.anomalyCooldownEnd) {
      addNotif(`⏳ ${target.name} on cooldown`)
      return
    }

    moveShip(shipId, target.x, target.y, 'moving')

    const missionTime = 180000 + Math.floor(Math.random() * 120000)
    const arrivalTime = (Math.hypot(target.x - HOME.x, target.y - HOME.y) / 50) * 1000

    setObjects(prev => prev.map(o => o.id === targetId ? { ...o, anomalyMission: true, anomalyMissionEnd: Date.now() + arrivalTime + missionTime } : o))
    addNotif(`⚔️ Fighter heading to ${target.name} — Mission: ${Math.round(missionTime / 60000)} min`)

    setTimeout(() => {
      setShips(prev => prev.map(s => s.id === shipId ? { ...s, status: 'fighting' as Ship['status'], x: -9999, y: -9999, targetX: null, targetY: null, departTime: null, arriveTime: null } : s))
      addNotif(`🌀 Fighter entered ${target.name}!`)
    }, arrivalTime)

    setTimeout(() => {
      const roll = Math.random()
      let mission
      if (roll < 0.05) mission = MISSION_LOOT_TABLE[4]
      else if (roll < 0.15) mission = MISSION_LOOT_TABLE[3]
      else if (roll < 0.35) mission = MISSION_LOOT_TABLE[2]
      else if (roll < 0.6) mission = MISSION_LOOT_TABLE[1]
      else mission = MISSION_LOOT_TABLE[0]

      const uses = (target.anomalyUses || 0) + 1
      const isDepleted = uses >= 3
      const mult = 1 - (target.anomalyUses || 0) * 0.3
      const cooldownEnd = isDepleted ? null : Date.now() + 600000

      setObjects(prev => prev.map(o => o.id === targetId ? {
        ...o, anomalyMission: false, anomalyMissionEnd: null,
        anomalyUses: uses, anomalyCooldownEnd: cooldownEnd,
        depleted: isDepleted,
      } : o))

      if (mission.rarity === 'death') {
        setShips(prev => prev.filter(s => s.id !== shipId))
        addEvent({
          title: '💀 Fighter Lost in Anomaly!',
          message: `Your fighter was overwhelmed inside ${target.name}.\n\nThe ship was destroyed. No survivors.`,
          type: 'combat',
          actions: [{ label: '😔 OK', action: 'dismiss', color: 'red' }],
        })
        addNotif(`💀 Fighter lost in ${target.name}!`)
      } else {
        const energy = Math.round(mission.energy * mult)
        const minerals = Math.round(mission.minerals * mult)
        const credits = Math.round(mission.credits * mult)
        const yes = Math.round(mission.yes * mult)

        setShips(prev => prev.map(s => {
          if (s.id !== shipId) return s
          return { ...s, hp: Math.max(1, s.hp - mission.dmg), x: target.x, y: target.y, status: 'waiting' as Ship['status'] }
        }))
        setResources(r => ({ ...r, energy: r.energy + energy, minerals: r.minerals + minerals, credits: r.credits + credits, yes: r.yes + yes }))

        const rarityColors: Record<string, string> = { common: '⬜', uncommon: '🟢', rare: '🔵', epic: '🟣' }
        const lootMsg = [
          `⚡+${energy}`, `💎+${minerals}`, `💰+${credits}`,
          yes ? `🌟+${yes} YES` : '',
        ].filter(Boolean).join(' ')

        addEvent({
          title: `⚔️ Mission Complete — ${target.name}`,
          message: `${rarityColors[mission.rarity]} ${mission.rarity.toUpperCase()} — ${mission.name}\n\n${lootMsg}\n\n⚠️ Fighter took ${mission.dmg} damage${isDepleted ? '\n\n⚠️ Anomaly depleted!' : ` (${uses}/3)`}`,
          type: 'combat',
          actions: [{ label: '📡 Return to Base', action: 'fighter_return', color: 'green' }],
          shipId,
        })
        addNotif(`⚔️ Mission complete: ${mission.name}!`)
      }
    }, arrivalTime + missionTime)
  }, [objects, moveShip, returnShip, addNotif, addEvent])

  // ════════════════════════════════
  // SEND SHIP FROM PLANET VIEW
  // ════════════════════════════════
  const handleSendShipToPlanet = useCallback((shipType: 'scout' | 'miner' | 'fighter', planetId: string) => {
    const planet = objects.find(o => o.id === planetId)
    if (!planet) return

    const ship = ships.find(s => s.type === shipType && (s.status === 'docked' || s.status === 'refueling'))
    if (!ship) {
      addNotif(`❌ No ${shipType} available`)
      return
    }

    if (shipType === 'scout') {
      moveShip(ship.id, planet.x, planet.y, 'scouting')
      addNotif(`🔭 ${ship.name} scouting ${planet.name}`)
    } else if (shipType === 'miner') {
      if (planet.hostile) {
        addNotif(`❌ Can't mine hostile planet — conquer it first!`)
        return
      }
      // Launch miner to planet (treat like asteroid)
      moveShip(ship.id, planet.x, planet.y, 'moving')
      setShips(prev => prev.map(s => s.id === ship.id ? { ...s, miningTarget: planetId, autoLoop: true } as any : s))
      addNotif(`⛏️ ${ship.name} heading to mine ${planet.name} (auto-loop ON)`)
    } else if (shipType === 'fighter') {
      if (planet.hostile) {
        moveShip(ship.id, planet.x, planet.y, 'moving')
        setShips(prev => prev.map(s => s.id === ship.id ? { ...s, attackTarget: planetId } as any : s))
        addNotif(`⚔️ ${ship.name} attacking ${planet.name}!`)
      } else {
        moveShip(ship.id, planet.x, planet.y, 'moving')
        addNotif(`⚔️ ${ship.name} heading to ${planet.name}`)
      }
    }
  }, [objects, ships, moveShip, addNotif])

  // ════════════════════════════════
  // CLICK-TO-MOVE — select a ship and click map to fly there
  // ════════════════════════════════
  const selectedShipRef = useRef(selectedShip)
  selectedShipRef.current = selectedShip

  const handleMapClick = useCallback((worldX: number, worldY: number) => {
    const ship = selectedShipRef.current
    if (!ship) return
    const isReady = ship.status === 'docked' || ship.status === 'refueling' || ship.status === 'waiting'
    if (!isReady || ship.fuel < 10) return

    if (ship.type === 'scout') {
      moveShip(ship.id, worldX, worldY, 'moving')
      addNotif(`🔭 ${ship.name} heading to waypoint`)
    } else if (ship.type === 'fighter') {
      moveShip(ship.id, worldX, worldY, 'moving')
      addNotif(`⚔️ ${ship.name} heading to waypoint`)
    } else if (ship.type === 'miner') {
      moveShip(ship.id, worldX, worldY, 'moving')
      addNotif(`⛏️ ${ship.name} heading to waypoint`)
    }
  }, [moveShip, addNotif])
  useEffect(() => {
    if (selectedShip) {
      const updated = ships.find(s => s.id === selectedShip.id)
      if (updated && JSON.stringify(updated) !== JSON.stringify(selectedShip)) {
        setSelectedShip(updated)
      }
    }
  }, [ships, selectedShip])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-12 h-12 animate-spin text-cyan-400" />
        <p className="text-gray-400">Loading StarForge...</p>
        <p className="text-[10px] text-gray-600">☁️ Syncing with cloud save</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#020408] flex flex-col overflow-hidden">
      {/* ═══ HUD HEADER ═══ */}
      <header className="h-12 hud-bar flex items-center justify-between px-3 z-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 hover:bg-white/5 rounded-md transition-colors"><Menu className="w-4 h-4 text-gray-500" /></button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-md flex items-center justify-center shadow-lg shadow-blue-500/20"><Rocket className="w-4 h-4 text-white" /></div>
            <span className="font-orbitron font-bold text-sm hidden sm:block tracking-wide">STARFORGE</span>
          </Link>
          <span className="text-[9px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400/80 rounded font-orbitron border border-yellow-500/20">ALPHA</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="hidden md:flex items-center gap-1.5">
            <div className="hud-res" style={{ '--res-color': '#facc15' } as React.CSSProperties}>
              <span className="icon bg-yellow-500/15 text-yellow-400">⚡</span>
              <span className="text-yellow-300">{resources.energy}</span>
            </div>
            <div className="hud-res" style={{ '--res-color': '#c084fc' } as React.CSSProperties}>
              <span className="icon bg-purple-500/15 text-purple-400">💎</span>
              <span className="text-purple-300">{resources.minerals}</span>
            </div>
            <div className="hud-res" style={{ '--res-color': '#4ade80' } as React.CSSProperties}>
              <span className="icon bg-green-500/15 text-green-400">💰</span>
              <span className="text-green-300">{resources.credits}</span>
            </div>
            <div className="hud-res" style={{ '--res-color': '#22d3ee' } as React.CSSProperties}>
              <span className="icon bg-cyan-500/15 text-cyan-400">✦</span>
              <span className="text-cyan-300">{resources.yes} <span className="text-[9px] text-cyan-400/60">YES</span></span>
            </div>
            <button onClick={() => setShowTrade(true)} className="hud-res hover:border-cyan-500/30 group" style={{ '--res-color': '#22d3ee', cursor: 'pointer' } as React.CSSProperties} title="Trade Terminal">
              <span className="icon bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25 transition-colors">🌀</span>
              <span className="text-cyan-300 text-[10px]">Trade</span>
            </button>
          </div>
          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
              saveStatus === 'saving' ? 'border-blue-500/30 bg-blue-500/10 text-blue-400' :
              saveStatus === 'saved' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' :
              saveStatus === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-400' :
              saveStatus === 'offline' ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' :
              'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
            title={lastSaveTime ? `Last saved: ${new Date(lastSaveTime).toLocaleTimeString()}` : 'Save game'}
          >
            {saveStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
             saveStatus === 'saved' ? <Cloud className="w-3.5 h-3.5" /> :
             saveStatus === 'error' || saveStatus === 'offline' ? <CloudOff className="w-3.5 h-3.5" /> :
             <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:block">
              {saveStatus === 'saving' ? 'Saving...' :
               saveStatus === 'saved' ? 'Saved' :
               saveStatus === 'error' ? 'Error' :
               saveStatus === 'offline' ? 'Offline' : 'Save'}
            </span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* ═══ SIDEBAR ═══ */}
        <aside className={`${sidebarOpen ? 'w-48' : 'w-0'} sidebar transition-all duration-300 overflow-hidden flex-shrink-0`}>
          <nav className="p-2 space-y-1">
            <div className="px-2 pt-2 pb-1"><p className="sb-label">NAVIGATION</p></div>
            <button
              onClick={() => setViewMode('galaxy')}
              className={`sb-btn ${viewMode === 'galaxy' ? 'active' : ''}`}
            >
              <Map className="w-4 h-4" /><span>Sector Map</span>
            </button>
            <button
              onClick={handleHomeBaseClick}
              className={`sb-btn ${viewMode === 'planet' && !viewedPlanet ? 'active' : ''}`}
            >
              <Star className="w-4 h-4" /><span>Home Base</span>
            </button>
            <button
              onClick={() => setShowTrade(true)}
              className="sb-btn"
              style={{ color: 'rgba(34,211,238,0.7)' }}
            >
              <ArrowRightLeft className="w-4 h-4" /><span>Trade Terminal</span>
            </button>

            <div className="pt-2 mt-2 border-t border-white/[0.04]">
              <div className="px-2 pt-1 pb-1"><p className="sb-label">FLEET</p></div>
              <div className="px-3 space-y-1.5 text-[12px]">
                <div className="flex justify-between items-center text-gray-500"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-sm bg-sky-400"></span>Scouts</span><span className="text-sky-400 font-bold font-orbitron text-[11px]">{ships.filter(s => s.type === 'scout').length}</span></div>
                <div className="flex justify-between items-center text-gray-500"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-sm bg-amber-400"></span>Miners</span><span className="text-amber-400 font-bold font-orbitron text-[11px]">{ships.filter(s => s.type === 'miner').length}</span></div>
                <div className="flex justify-between items-center text-gray-500"><span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-sm bg-red-400"></span>Fighters</span><span className="text-red-400 font-bold font-orbitron text-[11px]">{ships.filter(s => s.type === 'fighter').length}</span></div>
              </div>
            </div>

            <div className="pt-2 mt-2 border-t border-white/[0.04]">
              <div className="px-2 pt-1 pb-1"><p className="sb-label">INTEL</p></div>
              <div className="px-3 space-y-1 text-[12px]">
                <div className="flex justify-between text-gray-500"><span>Scanned</span><span className="text-blue-400 font-orbitron text-[11px]">{scannedAreas.length}</span></div>
                <div className="flex justify-between text-gray-500"><span>Objects</span><span className="text-gray-400 font-orbitron text-[11px]">{objects.filter(o => o.discovered).length}</span></div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Map / Planet View */}
        {viewMode === 'galaxy' ? (
          <>
            <main className="flex-1 relative">
              <GalaxyMap
                objects={objects} ships={ships} fogRadius={buildingBonuses.fogRadius} scannedAreas={scannedAreas}
                selectedObject={null} selectedShip={selectedShip}
                onObjectClick={handlePlanetClick} onShipClick={(s) => setSelectedShip(s)}
                onEmptyClick={() => {}} onMapClick={handleMapClick} homeBase={HOME}
              />

              {/* Home base click zone overlay */}
              <button
                onClick={handleHomeBaseClick}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-lg px-4 py-1.5 text-xs hover:bg-white/5 transition-all border border-white/[0.08] flex items-center gap-2 text-gray-400 hover:text-white"
                style={{ background: 'rgba(4,8,20,0.85)', backdropFilter: 'blur(12px)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                View Base — {HOME.name}
              </button>

              {/* Notifications */}
              <div className="absolute top-12 left-1/2 -translate-x-1/2 z-30 space-y-1.5 pointer-events-none">
                {notifications.map(n => (
                  <div key={n.id} className="notif">{n.text}</div>
                ))}
              </div>

              {/* ═══ EVENT POPUPS ═══ */}
              {events.length > 0 && (
                <div className="event-overlay">
                  {events.slice(0, 1).map(evt => (
                    <div key={evt.id} className={`event-card ${evt.type}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-[9px] font-orbitron tracking-widest uppercase mb-1" style={{ color: evt.type === 'combat' ? '#f87171' : evt.type === 'discovery' ? '#38bdf8' : evt.type === 'mining' ? '#fbbf24' : '#94a3b8' }}>
                            {evt.type === 'combat' ? 'COMBAT REPORT' : evt.type === 'discovery' ? 'DISCOVERY' : evt.type === 'mining' ? 'MINING REPORT' : 'INTEL'}
                          </p>
                          <h3 className="font-bold text-base text-white">{evt.title}</h3>
                        </div>
                        <button onClick={() => dismissEvent(evt.id)} className="text-gray-600 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
                      </div>
                      <p className="text-gray-400 text-sm mb-5 whitespace-pre-line leading-relaxed">{evt.message}</p>
                      <div className="flex flex-col gap-2">
                        {evt.actions.map((act, i) => (
                          <button key={i} onClick={() => handleEventAction(evt, act.action)}
                            className={`btn-action text-sm ${
                              act.color === 'red' ? 'btn-fighter' :
                              act.color === 'sky' ? 'btn-scout' :
                              act.color === 'green' ? 'btn-green' :
                              'btn-ghost'
                            }`}>{act.label}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>

            {/* Right Panel */}
            <aside className="w-72 panel flex-shrink-0 overflow-hidden">
              <InfoPanel
                selectedShip={selectedShip} ships={ships} objects={objects}
                onLaunchScout={launchScout} onLaunchMiner={launchMiner}
                onLaunchFighterAttack={launchFighterAttack} onSetDefender={setDefender}
                onRecallShip={returnShip} onBuildShip={buildShip}
                onSelectShip={setSelectedShip} playerResources={resources}
                onScanAnomaly={handleScanAnomaly} onAnomalyMission={handleAnomalyMission}
              />
            </aside>
          </>
        ) : (
          <PlanetView
            planetName={viewedPlanet ? (viewedPlanet.name || 'Unknown Planet') : HOME.name}
            isHome={!viewedPlanet}
            planet={viewedPlanet}
            buildings={buildings}
            resources={resources}
            ships={ships}
            onBack={() => setViewMode('galaxy')}
            onUpgradeBuilding={handleUpgradeBuilding}
            onSendShip={handleSendShipToPlanet}
            onBuildShip={buildShip}
            buildingBonuses={buildingBonuses}
          />
        )}
      </div>

      {/* ═══ TRADE TERMINAL OVERLAY ═══ */}
      <TradeTerminal
        open={showTrade}
        onClose={() => setShowTrade(false)}
        resources={resources}
        onResourcesChange={setResources}
      />
    </div>
  )
}
