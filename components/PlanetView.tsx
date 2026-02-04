'use client'

import { useState } from 'react'
import { CelestialObject, Ship } from './GalaxyMap'

/* ═══════════════════════════════════════════
   BUILDING TYPES & DATA
═══════════════════════════════════════════ */
export type BuildingType = 'hangar' | 'repair_bay' | 'barracks' | 'mining_hub' | 'radar' | 'shield' | 'fuel_refinery' | 'trading_post'

export interface Building {
  type: BuildingType
  level: number // 0 = not built, 1-5
}

interface LevelData {
  cost: { energy: number; minerals: number }
  benefit: string
}

interface BuildingDef {
  name: string
  icon: string
  desc: string
  color: string
  glow: string
  levels: LevelData[]
}

export const BUILDING_DEFS: Record<BuildingType, BuildingDef> = {
  hangar: {
    name: 'Hangar', icon: '🚀', desc: 'Ship capacity & build speed',
    color: '#3b82f6', glow: 'rgba(59,130,246,0.5)',
    levels: [
      { cost: { energy: 100, minerals: 50 }, benefit: '+2 ship slots' },
      { cost: { energy: 200, minerals: 100 }, benefit: '+4 ship slots' },
      { cost: { energy: 400, minerals: 200 }, benefit: '+6 slots, -20% build cost' },
      { cost: { energy: 800, minerals: 400 }, benefit: '+8 slots, -40% build cost' },
      { cost: { energy: 1500, minerals: 800 }, benefit: '+10 slots, -60% build cost' },
    ],
  },
  repair_bay: {
    name: 'Repair Bay', icon: '🔧', desc: 'Auto-repair docked ships',
    color: '#10b981', glow: 'rgba(16,185,129,0.5)',
    levels: [
      { cost: { energy: 80, minerals: 60 }, benefit: '+2 HP/tick repair' },
      { cost: { energy: 160, minerals: 120 }, benefit: '+4 HP/tick repair' },
      { cost: { energy: 320, minerals: 240 }, benefit: '+6 HP/tick, field heal' },
      { cost: { energy: 640, minerals: 480 }, benefit: '+8 HP/tick, nano-repair' },
      { cost: { energy: 1200, minerals: 900 }, benefit: '+10 HP/tick, full restore' },
    ],
  },
  barracks: {
    name: 'Barracks', icon: '🏰', desc: 'Fighter power & base defense',
    color: '#ef4444', glow: 'rgba(239,68,68,0.5)',
    levels: [
      { cost: { energy: 120, minerals: 80 }, benefit: 'Fighter +10% ATK' },
      { cost: { energy: 240, minerals: 160 }, benefit: 'Fighter +20% ATK' },
      { cost: { energy: 480, minerals: 320 }, benefit: '+30% ATK, +10 DEF' },
      { cost: { energy: 960, minerals: 640 }, benefit: '+40% ATK, +20 DEF' },
      { cost: { energy: 1800, minerals: 1200 }, benefit: '+50% ATK, +30 DEF' },
    ],
  },
  mining_hub: {
    name: 'Mining Hub', icon: '⛏️', desc: 'Mining yields & cargo capacity',
    color: '#f59e0b', glow: 'rgba(245,158,11,0.5)',
    levels: [
      { cost: { energy: 60, minerals: 40 }, benefit: '+10% mining yields' },
      { cost: { energy: 120, minerals: 80 }, benefit: '+20% mining yields' },
      { cost: { energy: 240, minerals: 160 }, benefit: '+30% yields, +20 cargo' },
      { cost: { energy: 480, minerals: 320 }, benefit: '+40% yields, +40 cargo' },
      { cost: { energy: 900, minerals: 600 }, benefit: '+50% yields, +60 cargo' },
    ],
  },
  radar: {
    name: 'Radar Array', icon: '📡', desc: 'Scan radius & enemy detection',
    color: '#22d3ee', glow: 'rgba(34,211,238,0.5)',
    levels: [
      { cost: { energy: 50, minerals: 30 }, benefit: 'Fog reveal +50px' },
      { cost: { energy: 100, minerals: 60 }, benefit: 'Fog reveal +100px' },
      { cost: { energy: 200, minerals: 120 }, benefit: '+150px, auto-detect' },
      { cost: { energy: 400, minerals: 240 }, benefit: '+200px, deep scan' },
      { cost: { energy: 750, minerals: 450 }, benefit: '+250px, sector scan' },
    ],
  },
  shield: {
    name: 'Shield Gen.', icon: '🛡️', desc: 'Base defense shield',
    color: '#a78bfa', glow: 'rgba(167,139,250,0.5)',
    levels: [
      { cost: { energy: 100, minerals: 70 }, benefit: '50 shield HP' },
      { cost: { energy: 200, minerals: 140 }, benefit: '100 shield HP' },
      { cost: { energy: 400, minerals: 280 }, benefit: '150 HP, +5 regen/min' },
      { cost: { energy: 800, minerals: 560 }, benefit: '200 HP, +10 regen/min' },
      { cost: { energy: 1500, minerals: 1000 }, benefit: '300 HP, +15 regen/min' },
    ],
  },
  fuel_refinery: {
    name: 'Fuel Refinery', icon: '⛽', desc: 'Faster refuel & fuel capacity',
    color: '#06b6d4', glow: 'rgba(6,182,212,0.5)',
    levels: [
      { cost: { energy: 70, minerals: 50 }, benefit: 'Refuel speed +20%' },
      { cost: { energy: 140, minerals: 100 }, benefit: 'Refuel speed +40%' },
      { cost: { energy: 280, minerals: 200 }, benefit: '+60%, fuel cap +20%' },
      { cost: { energy: 560, minerals: 400 }, benefit: '+80%, fuel cap +40%' },
      { cost: { energy: 1050, minerals: 750 }, benefit: '+100%, fuel cap +60%' },
    ],
  },
  trading_post: {
    name: 'Trading Post', icon: '🏪', desc: 'Resource trades & YES income',
    color: '#84cc16', glow: 'rgba(132,204,22,0.5)',
    levels: [
      { cost: { energy: 90, minerals: 60 }, benefit: 'Basic resource trades' },
      { cost: { energy: 180, minerals: 120 }, benefit: 'Better trade rates' },
      { cost: { energy: 360, minerals: 240 }, benefit: '+1 YES/hr generation' },
      { cost: { energy: 720, minerals: 480 }, benefit: '+2 YES/hr generation' },
      { cost: { energy: 1350, minerals: 900 }, benefit: '+3 YES/hr, premium' },
    ],
  },
}

const SLOT_ORDER: BuildingType[] = ['hangar', 'radar', 'shield', 'barracks', 'fuel_refinery', 'mining_hub', 'trading_post', 'repair_bay']
const MAX_LEVEL = 5

/* ═══════════════════════════════════════════
   PROPS
═══════════════════════════════════════════ */
interface PlanetViewProps {
  planetName: string
  isHome: boolean
  planet?: CelestialObject | null
  buildings: Building[]
  resources: { energy: number; minerals: number; credits: number; yes: number }
  ships: Ship[]
  onBack: () => void
  onUpgradeBuilding: (type: BuildingType) => void
  onSendShip?: (shipType: 'scout' | 'miner' | 'fighter', planetId: string) => void
  onBuildShip?: (type: 'scout' | 'miner' | 'fighter') => void
  buildingBonuses?: {
    fogRadius: number; refuelRate: number; repairRate: number
    miningBonus: number; cargoBonus: number; fighterAtkBonus: number; fighterDefBonus: number
    maxShips: number; buildCostReduction: number; yesPerHour: number
  }
}

/* ═══════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════ */
export default function PlanetView({
  planetName, isHome, planet, buildings, resources, ships, onBack, onUpgradeBuilding, onSendShip, onBuildShip, buildingBonuses,
}: PlanetViewProps) {
  const [selectedType, setSelectedType] = useState<BuildingType | null>(null)

  const getBuilding = (type: BuildingType) => buildings.find(b => b.type === type) || { type, level: 0 }
  const selectedBuilding = selectedType ? getBuilding(selectedType) : null
  const selectedDef = selectedType ? BUILDING_DEFS[selectedType] : null

  // Calculate building positions (radial around center)
  const CX = 300, CY = 300, RADIUS = 195
  const getSlotPos = (index: number) => {
    const angle = (index * 45) * Math.PI / 180
    return {
      x: CX + Math.sin(angle) * RADIUS,
      y: CY - Math.cos(angle) * RADIUS,
    }
  }

  const totalBuilt = buildings.filter(b => b.level > 0).length
  const totalLevels = buildings.reduce((sum, b) => sum + b.level, 0)

  return (
    <>
      {/* ═══ PLANET SURFACE — Main Area ═══ */}
      <main className="flex-1 relative overflow-hidden" style={{
        background: 'radial-gradient(ellipse at 50% 50%, rgba(6,78,59,0.15) 0%, rgba(2,4,8,1) 70%)',
      }}>
        {/* Animated stars background */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="absolute rounded-full bg-white" style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.1 + Math.random() * 0.3,
              animation: `twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }} />
          ))}
        </div>

        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-3 left-3 z-30 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:text-white transition-all"
          style={{ background: 'rgba(4,8,20,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          ← Sector Map
        </button>

        {/* Planet name */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 text-center">
          <h1 className="font-orbitron font-bold text-lg text-glow tracking-wide">{planetName}</h1>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {isHome ? `Base Level ${totalLevels} · ${totalBuilt}/8 structures` : planet?.discovered ? `Level ${planet.level} · ${planet.type}` : 'Unknown'}
          </p>
        </div>

        {/* ═══ SVG PLANET + BUILDINGS ═══ */}
        <div className="absolute inset-0 flex items-center justify-center animate-planet-enter">
          <svg viewBox="0 0 600 600" className="w-[min(80vh,80vw)] h-[min(80vh,80vw)] max-w-[600px] max-h-[600px]">
            <defs>
              {/* Planet atmosphere gradient */}
              <radialGradient id="pv-atmo" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor={isHome ? '#10b981' : '#3b82f6'} stopOpacity="0.3" />
                <stop offset="60%" stopColor={isHome ? '#10b981' : '#3b82f6'} stopOpacity="0.08" />
                <stop offset="100%" stopColor={isHome ? '#10b981' : '#3b82f6'} stopOpacity="0" />
              </radialGradient>
              {/* Planet surface gradient */}
              <radialGradient id="pv-surface" cx="40%" cy="35%" r="60%">
                <stop offset="0%" stopColor={isHome ? '#065f46' : '#1e3a5f'} />
                <stop offset="100%" stopColor={isHome ? '#022c22' : '#0c1929'} />
              </radialGradient>
              {/* Glow filter */}
              <filter id="pv-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              <filter id="pv-glow-lg" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
              {/* Selection glow */}
              <filter id="pv-select" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feFlood floodColor="#22d3ee" floodOpacity="0.7" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* ── Atmosphere glow ── */}
            <circle cx={CX} cy={CY} r="165" fill="url(#pv-atmo)">
              <animate attributeName="r" values="162;168;162" dur="6s" repeatCount="indefinite" />
            </circle>

            {/* ── Outer orbital ring ── */}
            <ellipse cx={CX} cy={CY} rx="175" ry="48" fill="none" stroke={isHome ? '#34d399' : '#60a5fa'} strokeWidth="0.8" opacity="0.15" transform={`rotate(-12, ${CX}, ${CY})`}>
              <animateTransform attributeName="transform" type="rotate" from={`-12 ${CX} ${CY}`} to={`348 ${CX} ${CY}`} dur="120s" repeatCount="indefinite" />
            </ellipse>

            {/* ── Inner orbital ring ── */}
            <ellipse cx={CX} cy={CY} rx="145" ry="38" fill="none" stroke={isHome ? '#34d399' : '#60a5fa'} strokeWidth="1" opacity="0.2" transform={`rotate(-15, ${CX}, ${CY})`} strokeDasharray="8 12">
              <animateTransform attributeName="transform" type="rotate" from={`345 ${CX} ${CY}`} to={`-15 ${CX} ${CY}`} dur="80s" repeatCount="indefinite" />
            </ellipse>

            {/* ── Planet body ── */}
            <circle cx={CX} cy={CY} r="120" fill="url(#pv-surface)" stroke={isHome ? '#10b981' : '#3b82f6'} strokeWidth="2" />

            {/* ── Surface features ── */}
            <ellipse cx={CX - 30} cy={CY - 25} rx="35" ry="20" fill={isHome ? '#065f46' : '#1e3a5f'} opacity="0.5" transform={`rotate(-20, ${CX - 30}, ${CY - 25})`} />
            <ellipse cx={CX + 25} cy={CY + 20} rx="28" ry="18" fill={isHome ? '#047857' : '#2563eb'} opacity="0.4" transform={`rotate(15, ${CX + 25}, ${CY + 20})`} />
            <ellipse cx={CX - 10} cy={CY + 35} rx="22" ry="12" fill={isHome ? '#059669' : '#1d4ed8'} opacity="0.35" />
            <ellipse cx={CX + 40} cy={CY - 15} rx="15" ry="10" fill={isHome ? '#065f46' : '#1e40af'} opacity="0.3" />

            {/* ── Highlight ── */}
            <ellipse cx={CX - 35} cy={CY - 35} rx="45" ry="35" fill="rgba(255,255,255,0.05)" transform={`rotate(-30, ${CX - 35}, ${CY - 35})`} />

            {/* ── Grid overlay (subtle hex feel) ── */}
            <circle cx={CX} cy={CY} r="120" fill="none" stroke={isHome ? 'rgba(52,211,153,0.06)' : 'rgba(96,165,250,0.06)'} strokeWidth="0.5" strokeDasharray="4 6" />
            <circle cx={CX} cy={CY} r="80" fill="none" stroke={isHome ? 'rgba(52,211,153,0.04)' : 'rgba(96,165,250,0.04)'} strokeWidth="0.5" strokeDasharray="3 8" />
            <circle cx={CX} cy={CY} r="40" fill="none" stroke={isHome ? 'rgba(52,211,153,0.03)' : 'rgba(96,165,250,0.03)'} strokeWidth="0.5" strokeDasharray="2 10" />

            {/* ── Core beacon ── */}
            <circle cx={CX} cy={CY} r="8" fill={isHome ? '#34d399' : '#60a5fa'} opacity="0.6">
              <animate attributeName="r" values="6;10;6" dur="3s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.4;0.8;0.4" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx={CX} cy={CY} r="3" fill="white" opacity="0.9" />

            {/* ── Docking lights on orbital ring ── */}
            {[0, 120, 240].map((deg, i) => {
              const a = (deg - 15) * Math.PI / 180
              const lx = CX + Math.cos(a) * 140
              const ly = CY + Math.sin(a) * 35
              return (
                <circle key={i} cx={lx} cy={ly} r="2" fill={isHome ? '#34d399' : '#60a5fa'} opacity="0.7">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur={`${1.5 + i * 0.5}s`} repeatCount="indefinite" />
                </circle>
              )
            })}

            {/* ═══ BUILDING SLOTS ═══ */}
            {isHome && SLOT_ORDER.map((type, index) => {
              const pos = getSlotPos(index)
              const building = getBuilding(type)
              const def = BUILDING_DEFS[type]
              const isSelected = selectedType === type
              const isBuilt = building.level > 0
              const isMax = building.level >= MAX_LEVEL
              const r = isBuilt ? 28 : 24

              return (
                <g key={type} className="cursor-pointer" onClick={() => setSelectedType(type)}>
                  {/* Connection line to planet core */}
                  <line
                    x1={CX} y1={CY} x2={pos.x} y2={pos.y}
                    stroke={isBuilt ? def.color : 'rgba(255,255,255,0.08)'}
                    strokeWidth={isBuilt ? 1.5 : 0.8}
                    strokeDasharray={isBuilt ? 'none' : '4 6'}
                    opacity={isBuilt ? 0.3 : 0.15}
                  />

                  {/* Slot background glow */}
                  {isBuilt && (
                    <circle cx={pos.x} cy={pos.y} r={r + 8} fill={def.color} opacity={isMax ? 0.2 : 0.1}>
                      {isMax && <animate attributeName="opacity" values="0.15;0.3;0.15" dur="2s" repeatCount="indefinite" />}
                    </circle>
                  )}

                  {/* Main slot circle */}
                  <circle
                    cx={pos.x} cy={pos.y} r={r}
                    fill={isBuilt ? `${def.color}20` : 'rgba(255,255,255,0.03)'}
                    stroke={isSelected ? '#22d3ee' : isBuilt ? def.color : 'rgba(255,255,255,0.15)'}
                    strokeWidth={isSelected ? 2.5 : isBuilt ? 2 : 1}
                    strokeDasharray={isBuilt ? 'none' : '4 4'}
                    style={{ filter: isSelected ? 'url(#pv-select)' : isBuilt ? 'url(#pv-glow)' : 'none' }}
                  />

                  {/* Icon */}
                  <text x={pos.x} y={pos.y + (isBuilt ? -2 : 5)} textAnchor="middle" fontSize={isBuilt ? 20 : 16} opacity={isBuilt ? 1 : 0.4}>
                    {isBuilt ? def.icon : '＋'}
                  </text>

                  {/* Level dots */}
                  {isBuilt && (
                    <g transform={`translate(${pos.x - 12}, ${pos.y + 14})`}>
                      {Array.from({ length: MAX_LEVEL }).map((_, i) => (
                        <circle
                          key={i}
                          cx={i * 6}
                          cy={0}
                          r={2}
                          fill={i < building.level ? (isMax ? '#fbbf24' : def.color) : 'rgba(255,255,255,0.15)'}
                          opacity={i < building.level ? 1 : 0.5}
                        />
                      ))}
                    </g>
                  )}

                  {/* Name label */}
                  <text
                    x={pos.x} y={pos.y + (isBuilt ? 26 : 20)}
                    textAnchor="middle"
                    fill={isBuilt ? def.color : 'rgba(255,255,255,0.25)'}
                    fontSize={7}
                    fontWeight={isBuilt ? 'bold' : 'normal'}
                  >
                    {isBuilt ? `${def.name} ${building.level}` : def.name}
                  </text>

                  {/* Max level crown */}
                  {isMax && (
                    <text x={pos.x} y={pos.y - 22} textAnchor="middle" fontSize={12}>👑</text>
                  )}
                </g>
              )
            })}

            {/* ═══ FOREIGN PLANET — Resource Deposits ═══ */}
            {!isHome && planet && planet.resources && (
              <>
                {/* Energy deposit */}
                <g transform={`translate(${CX - 80}, ${CY - 60})`} style={{ filter: 'url(#pv-glow)' }}>
                  <circle cx="0" cy="0" r="18" fill="rgba(250,204,21,0.15)" stroke="#fbbf24" strokeWidth="1.5" />
                  <text x="0" y="5" textAnchor="middle" fontSize="14">⚡</text>
                  <text x="0" y="30" textAnchor="middle" fill="#fbbf24" fontSize="9" fontWeight="bold">{planet.resources.energy}</text>
                </g>
                {/* Minerals deposit */}
                <g transform={`translate(${CX + 80}, ${CY - 30})`} style={{ filter: 'url(#pv-glow)' }}>
                  <circle cx="0" cy="0" r="18" fill="rgba(168,85,247,0.15)" stroke="#a855f7" strokeWidth="1.5" />
                  <text x="0" y="5" textAnchor="middle" fontSize="14">💎</text>
                  <text x="0" y="30" textAnchor="middle" fill="#a855f7" fontSize="9" fontWeight="bold">{planet.resources.minerals}</text>
                </g>
                {/* Credits deposit */}
                <g transform={`translate(${CX}, ${CY + 70})`} style={{ filter: 'url(#pv-glow)' }}>
                  <circle cx="0" cy="0" r="18" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="1.5" />
                  <text x="0" y="5" textAnchor="middle" fontSize="14">💰</text>
                  <text x="0" y="30" textAnchor="middle" fill="#22c55e" fontSize="9" fontWeight="bold">{planet.resources.credits}</text>
                </g>
                {/* Scan pulse if undiscovered */}
                {!planet.discovered && (
                  <circle cx={CX} cy={CY} r="100" fill="none" stroke="#22d3ee" strokeWidth="1" opacity="0.3">
                    <animate attributeName="r" values="50;160;50" dur="3s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
                  </circle>
                )}
              </>
            )}

            {/* ── Small orbiting satellite ── */}
            <g>
              <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="30s" repeatCount="indefinite" />
              <circle cx={CX + 155} cy={CY} r="3" fill="#94a3b8" />
              <circle cx={CX + 155} cy={CY} r="1" fill="white" opacity="0.8" />
            </g>
          </svg>
        </div>

        {/* ═══ FOREIGN PLANET ACTIONS (bottom bar) ═══ */}
        {!isHome && planet && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
            {(() => {
              const dockedScouts = ships.filter(s => s.type === 'scout' && (s.status === 'docked' || s.status === 'refueling'))
              const dockedMiners = ships.filter(s => s.type === 'miner' && (s.status === 'docked' || s.status === 'refueling'))
              const dockedFighters = ships.filter(s => s.type === 'fighter' && (s.status === 'docked' || s.status === 'refueling'))
              return (
                <>
                  <button
                    onClick={() => dockedScouts[0] && onSendShip?.('scout', planet.id)}
                    disabled={dockedScouts.length === 0}
                    className={`glass-strong rounded-xl px-5 py-3 text-sm transition-all border ${
                      dockedScouts.length > 0
                        ? 'hover:bg-sky-500/20 hover:border-sky-500/30 border-sky-500/20 text-sky-300'
                        : 'border-white/5 text-gray-600 cursor-not-allowed opacity-50'
                    }`}>
                    🔭 Send Scout {dockedScouts.length > 0 && <span className="text-[10px] ml-1 opacity-60">({dockedScouts.length})</span>}
                  </button>
                  <button
                    onClick={() => dockedMiners[0] && onSendShip?.('miner', planet.id)}
                    disabled={dockedMiners.length === 0 || planet.hostile === true}
                    className={`glass-strong rounded-xl px-5 py-3 text-sm transition-all border ${
                      dockedMiners.length > 0 && !planet.hostile
                        ? 'hover:bg-amber-500/20 hover:border-amber-500/30 border-amber-500/20 text-amber-300'
                        : 'border-white/5 text-gray-600 cursor-not-allowed opacity-50'
                    }`}>
                    ⛏️ Send Miner {planet.hostile ? '🔒' : dockedMiners.length > 0 ? <span className="text-[10px] ml-1 opacity-60">({dockedMiners.length})</span> : ''}
                  </button>
                  <button
                    onClick={() => dockedFighters[0] && onSendShip?.('fighter', planet.id)}
                    disabled={dockedFighters.length === 0}
                    className={`glass-strong rounded-xl px-5 py-3 text-sm transition-all border ${
                      dockedFighters.length > 0
                        ? 'hover:bg-red-500/20 hover:border-red-500/30 border-red-500/20 text-red-300'
                        : 'border-white/5 text-gray-600 cursor-not-allowed opacity-50'
                    }`}>
                    ⚔️ Send Fighter {dockedFighters.length > 0 && <span className="text-[10px] ml-1 opacity-60">({dockedFighters.length})</span>}
                  </button>
                </>
              )
            })()}
          </div>
        )}

        {/* Zoom hint */}
        <div className="absolute bottom-4 right-4 text-[10px] text-gray-600 z-20">Click a structure to manage it</div>
      </main>

      {/* ═══ RIGHT PANEL — Building Details ═══ */}
      <aside className="w-72 panel flex-shrink-0 overflow-y-auto">
        {isHome && selectedType && selectedDef && selectedBuilding ? (
          /* ════ Building Detail View ════ */
          <div className="h-full flex flex-col">
            <button
              onClick={() => setSelectedType(null)}
              className="py-2.5 px-4 text-xs text-gray-600 hover:text-white hover:bg-white/[0.03] transition-colors border-b border-white/[0.04] text-left tracking-wide"
            >
              ← BASE OVERVIEW
            </button>

            {/* Header */}
            <div className="p-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                  style={{ background: `${selectedDef.color}20`, border: `2px solid ${selectedDef.color}` }}
                >
                  {selectedDef.icon}
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-lg">{selectedDef.name}</h2>
                  <p className="text-sm text-gray-400">{selectedDef.desc}</p>
                </div>
              </div>

              {/* Level progress */}
              <div className="bg-black/30 rounded-lg p-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1.5">
                  <span>Level</span>
                  <span>{selectedBuilding.level} / {MAX_LEVEL}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2.5">
                  <div
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{
                      width: `${(selectedBuilding.level / MAX_LEVEL) * 100}%`,
                      background: selectedBuilding.level >= MAX_LEVEL
                        ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                        : selectedDef.color,
                    }}
                  />
                </div>
                {selectedBuilding.level >= MAX_LEVEL && (
                  <p className="text-center text-xs text-yellow-400 mt-2 font-medium">👑 MAX LEVEL</p>
                )}
              </div>
            </div>

            {/* Levels */}
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {selectedDef.levels.map((lvl, i) => {
                const levelNum = i + 1
                const isUnlocked = selectedBuilding.level >= levelNum
                const isNext = selectedBuilding.level === i
                const canAfford = resources.energy >= lvl.cost.energy && resources.minerals >= lvl.cost.minerals

                return (
                  <div
                    key={i}
                    className={`rounded-xl p-3 border transition-all ${
                      isUnlocked
                        ? 'bg-white/5 border-white/10'
                        : isNext
                        ? `border-2 ${canAfford ? '' : 'opacity-60'}`
                        : 'bg-black/20 border-white/5 opacity-40'
                    }`}
                    style={isNext ? { borderColor: selectedDef.color, background: `${selectedDef.color}10` } : undefined}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {isUnlocked ? '✅' : isNext ? '🔓' : '🔒'} Level {levelNum}
                      </span>
                      {!isUnlocked && (
                        <span className="text-[10px] text-gray-500">
                          ⚡{lvl.cost.energy} 💎{lvl.cost.minerals}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{lvl.benefit}</p>

                    {isNext && (
                      <button
                        onClick={() => onUpgradeBuilding(selectedType!)}
                        disabled={!canAfford}
                        className={`w-full mt-3 py-2.5 rounded-lg font-medium text-sm transition-all ${
                          canAfford
                            ? 'bg-gradient-to-r hover:brightness-110 text-white'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        }`}
                        style={canAfford ? { backgroundImage: `linear-gradient(to right, ${selectedDef.color}, ${selectedDef.color}cc)` } : undefined}
                      >
                        {canAfford
                          ? `${selectedBuilding.level === 0 ? '🔨 Build' : '⬆️ Upgrade'} — ⚡${lvl.cost.energy} 💎${lvl.cost.minerals}`
                          : '❌ Not enough resources'}
                      </button>
                    )}
                  </div>
                )
              })}

              {/* ════ Active Effects ════ */}
              {selectedBuilding.level > 0 && buildingBonuses && (
                <div className="mt-3 rounded-xl p-3 border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-xs font-medium text-emerald-400 mb-2">✨ Active Effects</p>
                  <div className="space-y-1 text-xs text-gray-300">
                    {selectedType === 'radar' && <p>📡 Fog radius: {buildingBonuses.fogRadius}px (+{buildingBonuses.fogRadius - 100})</p>}
                    {selectedType === 'fuel_refinery' && <p>⛽ Refuel: {buildingBonuses.refuelRate}/tick (+{buildingBonuses.refuelRate - 5})</p>}
                    {selectedType === 'repair_bay' && <p>🔧 Repair: +{buildingBonuses.repairRate} HP/tick on docked ships</p>}
                    {selectedType === 'mining_hub' && <>
                      <p>⛏️ Yield: +{Math.round((buildingBonuses.miningBonus - 1) * 100)}%</p>
                      {buildingBonuses.cargoBonus > 0 && <p>📦 Cargo: +{buildingBonuses.cargoBonus}</p>}
                    </>}
                    {selectedType === 'barracks' && <>
                      <p>⚔️ ATK: +{Math.round((buildingBonuses.fighterAtkBonus - 1) * 100)}%</p>
                      {buildingBonuses.fighterDefBonus > 0 && <p>🛡️ DEF: -{buildingBonuses.fighterDefBonus} dmg</p>}
                    </>}
                    {selectedType === 'hangar' && <>
                      <p>🚀 Ships: {ships.length}/{buildingBonuses.maxShips}</p>
                      {buildingBonuses.buildCostReduction > 0 && <p>💰 Discount: -{Math.round(buildingBonuses.buildCostReduction * 100)}%</p>}
                    </>}
                    {selectedType === 'shield' && <p>🛡️ Shield: Active</p>}
                    {selectedType === 'trading_post' && (
                      buildingBonuses.yesPerHour > 0
                        ? <p>🌟 +{buildingBonuses.yesPerHour} YES / min</p>
                        : <p className="text-gray-500">Lvl 3+ → YES generation</p>
                    )}
                  </div>
                </div>
              )}

              {/* ════ HANGAR: Ship Construction ════ */}
              {selectedType === 'hangar' && selectedBuilding.level > 0 && onBuildShip && buildingBonuses && (
                <div className="mt-3 rounded-xl p-3 border border-blue-500/20 bg-blue-500/5">
                  <p className="text-xs font-medium text-blue-400 mb-3">🔨 Build Ship ({ships.length}/{buildingBonuses.maxShips})</p>
                  <div className="space-y-2">
                    {(['scout', 'miner', 'fighter'] as const).map(type => {
                      const info: Record<string, { e: number; m: number; c: number; icon: string; label: string }> = {
                        scout: { e: 150, m: 100, c: 50, icon: '🔭', label: 'Scout' },
                        miner: { e: 200, m: 150, c: 100, icon: '⛏️', label: 'Miner' },
                        fighter: { e: 300, m: 200, c: 150, icon: '⚔️', label: 'Fighter' },
                      }
                      const b = info[type], d = buildingBonuses.buildCostReduction
                      const cost = { e: Math.round(b.e * (1 - d)), m: Math.round(b.m * (1 - d)), c: Math.round(b.c * (1 - d)) }
                      const ok = resources.energy >= cost.e && resources.minerals >= cost.m && resources.credits >= cost.c && ships.length < buildingBonuses.maxShips
                      return (
                        <button key={type} onClick={() => onBuildShip(type)} disabled={!ok}
                          className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all ${ok ? 'border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20' : 'border-white/5 bg-black/20 opacity-50 cursor-not-allowed'}`}>
                          <span className="text-xl">{b.icon}</span>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium">{b.label}</p>
                            <p className="text-[10px] text-gray-400">⚡{cost.e} 💎{cost.m} 💰{cost.c}{d > 0 && <span className="text-green-400 ml-1">(-{Math.round(d * 100)}%)</span>}</p>
                          </div>
                          <span className="text-xs text-gray-500">{ships.filter(s => s.type === type).length}x</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isHome ? (
          /* ════ Base Overview ════ */
          <div className="h-full flex flex-col">
            <div className="p-5 border-b border-white/10">
              <h2 className="font-bold text-lg">🌍 Base Management</h2>
              <p className="text-sm text-gray-500">Select a structure to build or upgrade</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Base stats */}
              <div className="glass rounded-xl p-4">
                <p className="text-[10px] text-gray-600 font-medium tracking-wider mb-2">BASE STATS</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Structures</span><span className="text-white">{totalBuilt}/8</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Total Lv.</span><span className="text-white">{totalLevels}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ships</span><span className="text-cyan-400">{ships.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Docked</span><span className="text-green-400">{ships.filter(s => s.status === 'docked' || s.status === 'refueling').length}</span></div>
                </div>
              </div>

              {/* Building list */}
              <div>
                <p className="text-[10px] text-gray-600 font-medium tracking-wider px-1 mb-2">STRUCTURES</p>
                <div className="space-y-1.5">
                  {SLOT_ORDER.map((type) => {
                    const building = getBuilding(type)
                    const def = BUILDING_DEFS[type]
                    const isBuilt = building.level > 0
                    const isMax = building.level >= MAX_LEVEL

                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`w-full p-3 rounded-xl text-left transition-all border ${
                          isBuilt
                            ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                            : 'bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{def.icon}</span>
                            <div>
                              <p className={`text-sm font-medium ${isBuilt ? 'text-white' : 'text-gray-500'}`}>{def.name}</p>
                              <p className="text-[10px] text-gray-600">
                                {isMax ? '👑 MAX' : isBuilt ? `Level ${building.level}/${MAX_LEVEL}` : 'Not built'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {/* Mini level dots */}
                            {Array.from({ length: MAX_LEVEL }).map((_, i) => (
                              <div
                                key={i}
                                className="w-1.5 h-1.5 rounded-full"
                                style={{
                                  backgroundColor: i < building.level
                                    ? (isMax ? '#fbbf24' : def.color)
                                    : 'rgba(255,255,255,0.1)',
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ════ Foreign Planet Info ════ */
          <div className="h-full flex flex-col">
            <div className="p-5 border-b border-white/10">
              <h2 className="font-bold text-lg">{planet?.discovered ? (planet.hostile ? `🔴 ${planet.name}` : `🌍 ${planet.name}`) : '🌍 Unknown Planet'}</h2>
              <p className="text-sm text-gray-500">{planet ? `Level ${planet.level} · ${planet.type}` : 'Uncharted territory'}</p>
              {planet?.hostile && (
                <div className="mt-2 bg-red-900/30 border border-red-500/30 rounded-lg p-2 text-center">
                  <p className="text-red-400 text-sm font-medium">⚠️ Hostile Territory</p>
                  <p className="text-red-400/60 text-xs">Defeat defenses to conquer</p>
                  {planet.enemyHP !== undefined && planet.enemyMaxHP && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-800 rounded-full h-2">
                        <div className="h-2 rounded-full bg-gradient-to-r from-red-600 to-orange-500" style={{ width: `${(planet.enemyHP / planet.enemyMaxHP) * 100}%` }} />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Defenses: {planet.enemyHP}/{planet.enemyMaxHP} HP</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 p-5 space-y-4">
              {planet?.resources && (
                <div className="glass rounded-xl p-4">
                  <p className="text-[10px] text-gray-600 font-medium tracking-wider mb-3">RESOURCES</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">⚡ Energy</span>
                      <span className="text-sm text-yellow-400 font-bold">{planet.resources.energy}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">💎 Minerals</span>
                      <span className="text-sm text-purple-400 font-bold">{planet.resources.minerals}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">💰 Credits</span>
                      <span className="text-sm text-green-400 font-bold">{planet.resources.credits}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="glass rounded-xl p-4 text-center">
                <p className="text-gray-500 text-sm">🔭 Send a Scout to explore</p>
                <p className="text-gray-600 text-xs mt-1">Discover structures & hidden resources</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
