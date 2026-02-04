'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ═══════════════════════════════════════════
   TYPES
═══════════════════════════════════════════ */
export type CelestialType = 'planet' | 'asteroid' | 'enemy' | 'station' | 'debris' | 'anomaly' | 'empty'

export interface CelestialObject {
  id: string
  x: number
  y: number
  type: CelestialType
  name: string
  discovered: boolean
  level: number
  resources?: { energy: number; minerals: number; credits: number }
  enemyHP?: number
  enemyMaxHP?: number
  loot?: string
  depleted?: boolean
  anomalyScanEnd?: number | null
  anomalyScanning?: boolean
  anomalyMission?: boolean
  anomalyMissionEnd?: number | null
  anomalyScanned?: boolean
  anomalyUses?: number        // how many times scanned/missioned
  anomalyCooldownEnd?: number | null  // timestamp when cooldown ends
  // Patrol
  patrolAngle?: number
  patrolCenterX?: number
  patrolCenterY?: number
  patrolRadius?: number
  patrolSpeed?: number
  // Planet
  hostile?: boolean
}

export type ShipType = 'scout' | 'miner' | 'fighter'

export interface Ship {
  id: string
  type: ShipType
  name: string
  x: number
  y: number
  targetX: number | null
  targetY: number | null
  speed: number
  status: 'docked' | 'moving' | 'mining' | 'scanning' | 'fighting' | 'returning' | 'scouting' | 'defending' | 'waiting' | 'refueling'
  hp: number
  maxHp: number
  cargo: number
  maxCargo: number
  departTime: number | null
  arriveTime: number | null
  fuel: number
  maxFuel: number
  fuelPerMove: number
}

interface GalaxyMapProps {
  objects: CelestialObject[]
  ships: Ship[]
  fogRadius: number
  scannedAreas: { x: number; y: number; radius: number }[]
  selectedObject: CelestialObject | null
  selectedShip: Ship | null
  onObjectClick: (obj: CelestialObject) => void
  onShipClick: (ship: Ship) => void
  onEmptyClick: (x: number, y: number) => void
  onMapClick?: (x: number, y: number) => void
  homeBase: { x: number; y: number; name: string }
}

const SHIP_COLORS: Record<ShipType, string> = {
  scout: '#38bdf8', miner: '#f59e0b', fighter: '#ef4444',
}

interface ShootingStar { id: number; x: number; y: number; angle: number; length: number; speed: number; life: number; maxLife: number }

/* ═══════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════ */
export default function GalaxyMap({
  objects, ships, fogRadius, scannedAreas, selectedObject, selectedShip,
  onObjectClick, onShipClick, onEmptyClick, onMapClick, homeBase,
}: GalaxyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)
  const [tick, setTick] = useState(0)
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([])
  const [clickIndicator, setClickIndicator] = useState<{ x: number; y: number; show: boolean }>({ x: 0, y: 0, show: false })
  const ssId = useRef(0)

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffset({ x: rect.width / 2 - homeBase.x, y: rect.height / 2 - homeBase.y })
    }
  }, [homeBase.x, homeBase.y])

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 100)
    return () => clearInterval(timer)
  }, [])

  // Shooting stars
  useEffect(() => {
    const spawner = setInterval(() => {
      if (Math.random() < 0.3) {
        const id = ssId.current++
        setShootingStars(prev => [...prev.slice(-8), {
          id, x: -500 + Math.random() * 3000, y: -500 + Math.random() * 3000,
          angle: 0.3 + Math.random() * 0.8, length: 40 + Math.random() * 80,
          speed: 3 + Math.random() * 5, life: 0, maxLife: 30 + Math.random() * 30,
        }])
      }
    }, 800)
    return () => clearInterval(spawner)
  }, [])
  useEffect(() => {
    const anim = setInterval(() => {
      setShootingStars(prev => prev
        .map(s => ({ ...s, life: s.life + 1, x: s.x + Math.cos(s.angle) * s.speed, y: s.y + Math.sin(s.angle) * s.speed }))
        .filter(s => s.life < s.maxLife))
    }, 50)
    return () => clearInterval(anim)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true); hasDraggedRef.current = false
    setDragStart({ x: e.clientX, y: e.clientY }); setDragStartOffset({ ...offset })
  }, [offset])
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasDraggedRef.current = true
    setOffset({ x: dragStartOffset.x + dx, y: dragStartOffset.y + dy })
  }, [isDragging, dragStart, dragStartOffset])
  const handleMouseUp = useCallback(() => setIsDragging(false), [])
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault(); setZoom(z => Math.max(0.3, Math.min(3, z * (e.deltaY > 0 ? 0.92 : 1.08))))
  }, [])

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (hasDraggedRef.current) return
    const svg = e.currentTarget, rect = svg.getBoundingClientRect()
    const worldX = (e.clientX - rect.left - offset.x) / zoom
    const worldY = (e.clientY - rect.top - offset.y) / zoom
    setClickIndicator({ x: worldX, y: worldY, show: true })
    setTimeout(() => setClickIndicator(prev => ({ ...prev, show: false })), 1500)
    onEmptyClick(worldX, worldY)
    if (onMapClick) onMapClick(worldX, worldY)
  }, [offset, zoom, onEmptyClick, onMapClick])

  const resetView = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffset({ x: rect.width / 2 - homeBase.x, y: rect.height / 2 - homeBase.y }); setZoom(1)
    }
  }

  const isVisible = (x: number, y: number): boolean => {
    if (Math.hypot(x - homeBase.x, y - homeBase.y) < fogRadius) return true
    for (const area of scannedAreas) { if (Math.hypot(x - area.x, y - area.y) < area.radius) return true }
    return false
  }

  const getShipPos = (ship: Ship) => {
    if (ship.status === 'docked' || !ship.departTime || !ship.arriveTime || !ship.targetX || !ship.targetY) return { x: ship.x, y: ship.y }
    const progress = Math.min(1, (Date.now() - ship.departTime) / (ship.arriveTime - ship.departTime))
    const eased = 1 - Math.pow(1 - progress, 2)
    return { x: ship.x + (ship.targetX - ship.x) * eased, y: ship.y + (ship.targetY - ship.y) * eased }
  }

  // Enemy patrol — smooth deterministic orbit around spawn point
  const getEnemyPos = (obj: CelestialObject) => {
    if (obj.type !== 'enemy') return { x: obj.x, y: obj.y }
    // Deterministic values from ID — no Math.random() in render!
    const idNum = parseInt(obj.id.replace(/\D/g, '')) || 0
    const r = 12 + (idNum % 5) * 4 + obj.level * 2  // patrol radius 12-32
    const spd = 0.08 + (idNum % 7) * 0.015           // slow orbit speed
    const baseAngle = idNum * 1.618                    // golden ratio offset
    const now = Date.now() / 1000
    const angle = baseAngle + now * spd
    return {
      x: obj.x + Math.cos(angle) * r,
      y: obj.y + Math.sin(angle) * r * 0.7,
    }
  }

  const bgStars = useRef<{ x: number; y: number; s: number; d: number }[]>([])
  if (bgStars.current.length === 0) {
    for (let i = 0; i < 200; i++) bgStars.current.push({ x: Math.random() * 3000 - 500, y: Math.random() * 3000 - 500, s: 0.3 + Math.random() * 1.5, d: Math.random() * 8 })
  }

  const nebulae = useRef<{ x: number; y: number; rx: number; ry: number; c: string; o: number; rot: number }[]>([])
  if (nebulae.current.length === 0) {
    const cs = ['59,130,246','139,92,246','236,72,153','16,185,129']
    for (let i = 0; i < 6; i++) nebulae.current.push({ x: Math.random() * 2000 - 200, y: Math.random() * 2000 - 200, rx: 80 + Math.random() * 150, ry: 50 + Math.random() * 100, c: cs[i%4], o: 0.02 + Math.random() * 0.04, rot: i * 30 })
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#020408] overflow-hidden select-none"
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onWheel={handleWheel}>
      <svg className="w-full h-full" onClick={handleSvgClick}>
        <defs>
          {/* Fog blur */}
          <filter id="fog-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="80" />
          </filter>
          <mask id="fog-mask">
            <rect x="-10000" y="-10000" width="20000" height="20000" fill="white" />
            <g filter="url(#fog-blur)">
              <circle cx={homeBase.x} cy={homeBase.y} r={fogRadius * 1.1} fill="black" />
              {scannedAreas.map((a, i) => <circle key={i} cx={a.x} cy={a.y} r={a.radius * 1.1} fill="black" />)}
              {ships.filter(s => s.status !== 'docked' && s.x > -9000).map(s => { const p = getShipPos(s); return <circle key={s.id} cx={p.x} cy={p.y} r={80} fill="black" /> })}
            </g>
          </mask>
          <filter id="sel-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="b" /><feFlood floodColor="#22d3ee" floodOpacity="0.6" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* AAA Celestial Defs */}
          <radialGradient id="gPlanetBlue" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#4facfe" /><stop offset="40%" stopColor="#2563eb" /><stop offset="100%" stopColor="#0c1445" />
          </radialGradient>
          <radialGradient id="gPlanetGreen" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#34d399" /><stop offset="40%" stopColor="#059669" /><stop offset="100%" stopColor="#022c22" />
          </radialGradient>
          <radialGradient id="gPlanetHostile" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fb923c" /><stop offset="40%" stopColor="#dc2626" /><stop offset="100%" stopColor="#450a0a" />
          </radialGradient>
          <radialGradient id="gAsteroid" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#9ca3af" /><stop offset="50%" stopColor="#6b7280" /><stop offset="100%" stopColor="#374151" />
          </radialGradient>
          <radialGradient id="gAnomaly" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" /><stop offset="50%" stopColor="#7c3aed" stopOpacity="0.4" /><stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
          </radialGradient>
          <filter id="glowSm" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowEnemy" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" /><feFlood floodColor="#ef4444" floodOpacity="0.5" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowAnomaly" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="5" result="b" /><feFlood floodColor="#8b5cf6" floodOpacity="0.4" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glowHostile" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="b" /><feFlood floodColor="#ef4444" floodOpacity="0.35" result="c" /><feComposite in="c" in2="b" operator="in" result="g" /><feMerge><feMergeNode in="g" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
          {/* Nebula clouds */}
          {nebulae.current.map((n, i) => (
            <ellipse key={i} cx={n.x} cy={n.y} rx={n.rx} ry={n.ry} fill={`rgba(${n.c},${n.o})`} transform={`rotate(${n.rot}, ${n.x}, ${n.y})`}>
              <animateTransform attributeName="transform" type="translate" values="0,0;15,-10;0,0" dur={`${20 + i * 5}s`} repeatCount="indefinite" />
            </ellipse>
          ))}

          {/* Stars */}
          {bgStars.current.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.s} fill="white" opacity={0.15 + (i % 3) * 0.08}>
              {i % 5 === 0 && <animate attributeName="opacity" values="0.1;0.4;0.1" dur={`${3 + s.d}s`} repeatCount="indefinite" />}
            </circle>
          ))}

          {/* Shooting stars */}
          {shootingStars.map(s => {
            const a = s.life < 5 ? s.life / 5 : s.life > s.maxLife - 10 ? (s.maxLife - s.life) / 10 : 1
            return <line key={s.id} x1={s.x - Math.cos(s.angle) * s.length} y1={s.y - Math.sin(s.angle) * s.length} x2={s.x} y2={s.y} stroke={`rgba(255,255,255,${a * 0.6})`} strokeWidth={1.5} strokeLinecap="round" />
          })}

          {/* FOG */}
          <rect x="-2000" y="-2000" width="6000" height="6000" fill="rgba(30,35,50,0.55)" mask="url(#fog-mask)" />

          {/* Grid */}
          {Array.from({ length: 21 }).map((_, i) => (
            <g key={i}>
              <line x1={-500 + i * 150} y1={-500} x2={-500 + i * 150} y2={2500} stroke="rgba(59,130,246,0.04)" strokeWidth={1} />
              <line x1={-500} y1={-500 + i * 150} x2={2500} y2={-500 + i * 150} stroke="rgba(59,130,246,0.04)" strokeWidth={1} />
            </g>
          ))}

          {/* HOME BASE */}
          <g transform={`translate(${homeBase.x}, ${homeBase.y})`}>
            <circle cx={0} cy={0} r={50} fill="none" stroke="rgba(16,185,129,0.2)" strokeWidth={1} strokeDasharray="6 8"><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="40s" repeatCount="indefinite" /></circle>
            <circle cx={0} cy={0} r={65} fill="none" stroke="rgba(16,185,129,0.1)" strokeWidth={0.8} strokeDasharray="3 10"><animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="55s" repeatCount="indefinite" /></circle>
            <circle cx={0} cy={0} r={34} fill="rgba(16,185,129,0.15)" opacity={0.4}><animate attributeName="r" values="33;36;33" dur="4s" repeatCount="indefinite" /></circle>
            <circle cx={0} cy={0} r={30} fill="#064e3b" stroke="#10b981" strokeWidth={2} />
            <ellipse cx={-8} cy={-5} rx={8} ry={5} fill="#065f46" opacity={0.6} />
            <ellipse cx={7} cy={8} rx={6} ry={4} fill="#065f46" opacity={0.5} />
            <ellipse cx={-3} cy={12} rx={5} ry={3} fill="#047857" opacity={0.4} />
            <ellipse cx={-10} cy={-10} rx={10} ry={8} fill="rgba(255,255,255,0.08)" transform="rotate(-30)" />
            <ellipse cx={0} cy={0} rx={38} ry={10} fill="none" stroke="#34d399" strokeWidth={1.5} opacity={0.5} transform="rotate(-15)" />
            <circle cx={-36} cy={6} r={1.5} fill="#34d399" opacity={0.8}><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" /></circle>
            <circle cx={36} cy={-6} r={1.5} fill="#34d399" opacity={0.8}><animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" /></circle>
            {ships.filter(s => s.status === 'docked' || s.status === 'refueling').length > 0 && (
              <g transform="translate(0, -38)"><rect x={-14} y={-7} width={28} height={14} rx={7} fill="rgba(0,0,0,0.6)" stroke="#34d399" strokeWidth={0.5} /><text x={0} y={4} textAnchor="middle" fill="#34d399" fontSize={8} fontWeight="bold">{ships.filter(s => s.status === 'docked' || s.status === 'refueling').length} docked</text></g>
            )}
            <text x={0} y={52} textAnchor="middle" fill="#34d399" fontSize={11} fontWeight="bold">{homeBase.name}</text>
          </g>


          {/* AAA SVG CELESTIAL OBJECTS */}
          {objects.filter(o => !o.depleted).map((obj) => {
            const visible = isVisible(obj.x, obj.y)
            const ePos = obj.type === 'enemy' ? getEnemyPos(obj) : { x: obj.x, y: obj.y }
            const isSelected = selectedObject?.id === obj.id
            const idNum = parseInt(obj.id.replace(/\D/g, '')) || 0

            if (!visible) return (
              <g key={obj.id} transform={`translate(${ePos.x}, ${ePos.y})`} opacity={0.12}>
                <circle r={4} fill="none" stroke="#4b5563" strokeWidth={0.8} strokeDasharray="2 3" />
                <text x={0} y={3} textAnchor="middle" fontSize={6} fill="#4b5563">?</text>
              </g>
            )

            return (
              <g key={obj.id} transform={`translate(${ePos.x}, ${ePos.y})`}
                onClick={(e) => { e.stopPropagation(); if (!hasDraggedRef.current) onObjectClick(obj) }}
                className="cursor-pointer" style={{ filter: isSelected ? 'url(#sel-glow)' : 'none' }}>

                {/* PLANET */}
                {obj.type === 'planet' && !obj.hostile && (
                  <g>
                    <circle r={18} fill={idNum % 3 === 0 ? 'rgba(59,130,246,0.08)' : idNum % 3 === 1 ? 'rgba(16,185,129,0.08)' : 'rgba(168,85,247,0.08)'}>
                      <animate attributeName="r" values="17;19;17" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle r={12} fill={idNum % 3 === 1 ? 'url(#gPlanetGreen)' : 'url(#gPlanetBlue)'} stroke={idNum % 3 === 1 ? '#34d399' : '#60a5fa'} strokeWidth={0.8} />
                    <ellipse cx={-3} cy={-2} rx={5} ry={3} fill={idNum % 3 === 1 ? '#047857' : '#1e40af'} opacity={0.5} transform={`rotate(${idNum * 30})`} />
                    <ellipse cx={4} cy={3} rx={3} ry={2} fill={idNum % 3 === 1 ? '#065f46' : '#1d4ed8'} opacity={0.4} transform={`rotate(${idNum * 45 + 20})`} />
                    <ellipse cx={-4} cy={-4} rx={5} ry={3.5} fill="rgba(255,255,255,0.1)" transform="rotate(-30)" />
                    <ellipse rx={16} ry={4} fill="none" stroke={idNum % 3 === 1 ? '#34d399' : '#60a5fa'} strokeWidth={0.6} opacity={0.3} transform={`rotate(${-15 + idNum * 10})`} />
                  </g>
                )}

                {/* HOSTILE PLANET */}
                {obj.type === 'planet' && obj.hostile && (
                  <g style={{ filter: 'url(#glowHostile)' }}>
                    <circle r={20} fill="rgba(239,68,68,0.06)">
                      <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle r={12} fill="url(#gPlanetHostile)" stroke="#ef4444" strokeWidth={1} />
                    <path d="M-6,-4 Q-2,-8 3,-5 Q6,-1 4,4 Q1,7 -3,5 Q-7,2 -6,-4" fill="none" stroke="#f97316" strokeWidth={0.8} opacity={0.6} />
                    <ellipse cx={-2} cy={1} rx={3} ry={2} fill="#b91c1c" opacity={0.5} />
                    <ellipse cx={-4} cy={-4} rx={4} ry={3} fill="rgba(255,255,255,0.08)" transform="rotate(-30)" />
                    <circle r={16} fill="none" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 4" opacity={0.5}>
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="8s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {/* ASTEROID */}
                {obj.type === 'asteroid' && (
                  <g>
                    <path d={idNum % 3 === 0
                      ? "M0,-9 L7,-5 L9,2 L6,8 L-1,9 L-8,5 L-8,-2 L-4,-8 Z"
                      : idNum % 3 === 1
                      ? "M0,-8 L6,-6 L10,0 L7,7 L0,9 L-6,7 L-9,1 L-6,-6 Z"
                      : "M2,-9 L8,-3 L8,4 L3,9 L-4,8 L-9,3 L-7,-4 L-2,-9 Z"}
                      fill="url(#gAsteroid)" stroke="#9ca3af" strokeWidth={0.8} />
                    <circle cx={-2} cy={-1} r={2.5} fill="rgba(0,0,0,0.25)" stroke="rgba(156,163,175,0.3)" strokeWidth={0.4} />
                    <circle cx={3} cy={3} r={1.5} fill="rgba(0,0,0,0.2)" />
                    <circle cx={-4} cy={3} r={0.8} fill="#fbbf24" opacity={0.7}>
                      <animate attributeName="opacity" values="0.3;0.9;0.3" dur={`${2 + idNum % 3}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {/* ENEMY SHIP */}
                {obj.type === 'enemy' && (
                  <g style={{ filter: 'url(#glowEnemy)' }}>
                    <path d={idNum % 2 === 0
                      ? "M0,-12 L4,-6 L8,-4 L6,4 L3,8 L-3,8 L-6,4 L-8,-4 L-4,-6 Z"
                      : "M0,-10 L6,-4 L7,2 L4,8 L0,10 L-4,8 L-7,2 L-6,-4 Z"}
                      fill="#7f1d1d" stroke="#ef4444" strokeWidth={1.2} opacity={0.9} />
                    <ellipse cx={0} cy={-5} rx={2.5} ry={3} fill="#dc2626" opacity={0.7} />
                    <ellipse cx={0} cy={9} rx={2} ry={3} fill="#ef4444" opacity={0.5}>
                      <animate attributeName="ry" values="2;4;2" dur="0.4s" repeatCount="indefinite" />
                    </ellipse>
                    <rect x={-10} y={-4} width={3} height={6} rx={1} fill="#991b1b" stroke="#ef4444" strokeWidth={0.5} />
                    <rect x={7} y={-4} width={3} height={6} rx={1} fill="#991b1b" stroke="#ef4444" strokeWidth={0.5} />
                  </g>
                )}

                {/* ANOMALY */}
                {obj.type === 'anomaly' && (
                  <g style={{ filter: 'url(#glowAnomaly)' }}>
                    <circle r={16} fill="url(#gAnomaly)">
                      <animate attributeName="r" values="14;18;14" dur="3s" repeatCount="indefinite" />
                    </circle>
                    <circle r={14} fill="none" stroke="#a78bfa" strokeWidth={1.2} strokeDasharray="4 3" opacity={0.6}>
                      <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="6s" repeatCount="indefinite" />
                    </circle>
                    <circle r={9} fill="none" stroke="#c4b5fd" strokeWidth={0.8} strokeDasharray="2 4" opacity={0.5}>
                      <animateTransform attributeName="transform" type="rotate" from="360" to="0" dur="4s" repeatCount="indefinite" />
                    </circle>
                    <circle r={4} fill="#8b5cf6" opacity={0.8}>
                      <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle r={2} fill="#e9d5ff" opacity={0.9} />
                  </g>
                )}

                {/* DEBRIS */}
                {obj.type === 'debris' && (
                  <g>
                    <path d="M-5,-7 L3,-8 L7,-3 L5,3 L1,7 L-6,4 L-7,-2 Z" fill="#4b5563" stroke="#6b7280" strokeWidth={0.8} />
                    <line x1={-3} y1={-5} x2={2} y2={4} stroke="#9ca3af" strokeWidth={0.4} opacity={0.4} />
                    <path d="M6,-1 L9,-3 L10,1 L7,2 Z" fill="#374151" stroke="#6b7280" strokeWidth={0.5} opacity={0.7}>
                      <animateTransform attributeName="transform" type="rotate" from="0 8 0" to="360 8 0" dur="30s" repeatCount="indefinite" />
                    </path>
                    <circle cx={-3} cy={-4} r={1} fill="#22d3ee" opacity={0.6}>
                      <animate attributeName="opacity" values="0.2;0.8;0.2" dur="3s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {/* STATION */}
                {obj.type === 'station' && (
                  <g>
                    <rect x={-8} y={-8} width={16} height={16} rx={2} fill="#1e293b" stroke="#64748b" strokeWidth={1} />
                    <rect x={-5} y={-5} width={10} height={10} rx={1} fill="#0f172a" stroke="#94a3b8" strokeWidth={0.5} />
                    <rect x={-16} y={-2} width={7} height={4} rx={0.5} fill="#1e40af" stroke="#3b82f6" strokeWidth={0.5} />
                    <rect x={9} y={-2} width={7} height={4} rx={0.5} fill="#1e40af" stroke="#3b82f6" strokeWidth={0.5} />
                    <circle cx={0} cy={0} r={2} fill="#22d3ee" opacity={0.8}>
                      <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
                    </circle>
                  </g>
                )}

                {/* HP bars */}
                {((obj.type === 'enemy') || (obj.hostile)) && obj.enemyHP !== undefined && obj.enemyMaxHP && (
                  <g transform="translate(0, -20)">
                    <rect x={-15} y={0} width={30} height={4} rx={2} fill="#1f2937" stroke="rgba(255,255,255,0.1)" strokeWidth={0.3} />
                    <rect x={-15} y={0} width={30 * (obj.enemyHP / obj.enemyMaxHP)} height={4} rx={2} fill={obj.hostile ? '#f59e0b' : '#ef4444'} />
                  </g>
                )}
                {obj.hostile && <text x={0} y={-24} textAnchor="middle" fill="#fca5a5" fontSize={6} fontWeight="bold">HOSTILE</text>}

                {/* Anomaly states */}
                {obj.type === 'anomaly' && obj.anomalyScanning && (
                  <g>
                    <circle cx={0} cy={0} r={20} fill="none" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="4 3" opacity={0.6}><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" /></circle>
                    <text x={0} y={-22} textAnchor="middle" fill="#a78bfa" fontSize={7} fontWeight="bold">SCANNING...</text>
                    {obj.anomalyScanEnd && <text x={0} y={-32} textAnchor="middle" fill="#c4b5fd" fontSize={8} fontWeight="bold">{(() => { const rem = Math.max(0, Math.ceil((obj.anomalyScanEnd - Date.now()) / 1000)); const m = Math.floor(rem / 60); const s = rem % 60; return `${m}:${s.toString().padStart(2, '0')}` })()}</text>}
                  </g>
                )}
                {obj.type === 'anomaly' && obj.anomalyMission && (
                  <g>
                    <circle cx={0} cy={0} r={22} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 4" opacity={0.5}><animateTransform attributeName="transform" type="rotate" from="0" to="-360" dur="1.5s" repeatCount="indefinite" /></circle>
                    <text x={0} y={-22} textAnchor="middle" fill="#f87171" fontSize={7} fontWeight="bold">MISSION</text>
                    {obj.anomalyMissionEnd && <text x={0} y={-32} textAnchor="middle" fill="#fca5a5" fontSize={8} fontWeight="bold">{(() => { const rem = Math.max(0, Math.ceil((obj.anomalyMissionEnd - Date.now()) / 1000)); const m = Math.floor(rem / 60); const s = rem % 60; return `${m}:${s.toString().padStart(2, '0')}` })()}</text>}
                  </g>
                )}
                {obj.type === 'anomaly' && obj.anomalyScanned && !obj.anomalyScanning && !obj.anomalyMission && obj.anomalyUses !== undefined && obj.anomalyUses > 0 && (
                  <text x={-14} y={-8} textAnchor="middle" fill="#9ca3af" fontSize={7}>{obj.anomalyUses}/3</text>
                )}
                {obj.type === 'anomaly' && obj.anomalyCooldownEnd && Date.now() < obj.anomalyCooldownEnd && !obj.anomalyScanning && !obj.anomalyMission && (
                  <text x={0} y={-24} textAnchor="middle" fill="#6b7280" fontSize={7}>{(() => { const rem = Math.max(0, Math.ceil((obj.anomalyCooldownEnd - Date.now()) / 1000)); const m = Math.floor(rem / 60); return `${m}m` })()}</text>
                )}

                {obj.discovered && <text x={0} y={obj.type === 'enemy' ? 22 : 20} textAnchor="middle" fill="#d1d5db" fontSize={8} fontWeight="500" opacity={0.85}>{obj.name}</text>}
              </g>
            )
          })}

          {/* ═══ SHIPS ═══ */}
          {ships.map((ship) => {
            let pos = getShipPos(ship)
            const isSelected = selectedShip?.id === ship.id
            const color = SHIP_COLORS[ship.type]
            const showTrail = ship.status === 'moving' && ship.targetX !== null
            const fuelPct = ship.maxFuel > 0 ? ship.fuel / ship.maxFuel : 1
            const hpPct = ship.hp / ship.maxHp
            const isDocked = ship.status === 'docked' || ship.status === 'refueling'
            if (isDocked) return null

            // Miner orbits around mining target
            let minerOrbitAngle = 0
            if (ship.type === 'miner' && ship.status === 'mining') {
              const target = objects.find(o => o.id === (ship as any).miningTarget)
              if (target) {
                const orbitR = 25
                const now = Date.now() / 1000
                const speed = 0.8
                const baseAngle = parseInt(ship.id.replace(/\D/g, '')) || 0
                minerOrbitAngle = baseAngle + now * speed
                pos = {
                  x: target.x + Math.cos(minerOrbitAngle) * orbitR,
                  y: target.y + Math.sin(minerOrbitAngle) * orbitR,
                }
              }
            }

            const rotation = ship.status === 'mining' 
              ? (minerOrbitAngle * 180 / Math.PI + 90)
              : (ship.targetX && ship.targetY && ship.status === 'moving' ? Math.atan2(ship.targetY - ship.y, ship.targetX - ship.x) * 180 / Math.PI + 90 : 0)

            return (
              <g key={ship.id}>
                {showTrail && <line x1={pos.x} y1={pos.y} x2={ship.targetX!} y2={ship.targetY!} stroke={color} strokeWidth={1} strokeDasharray="6 4" opacity={0.25} />}

                {/* Mining orbit ring */}
                {ship.type === 'miner' && ship.status === 'mining' && (() => {
                  const target = objects.find(o => o.id === (ship as any).miningTarget)
                  if (!target) return null
                  return (
                    <g>
                      <circle cx={target.x} cy={target.y} r={25} fill="none" stroke="#f59e0b" strokeWidth={0.8} strokeDasharray="3 5" opacity={0.3} />
                      {/* Mining beam from ship to target */}
                      <line x1={pos.x} y1={pos.y} x2={target.x} y2={target.y} stroke="#fbbf24" strokeWidth={1.5} opacity={0.4}>
                        <animate attributeName="opacity" values="0.2;0.6;0.2" dur="0.8s" repeatCount="indefinite" />
                      </line>
                      {/* Sparkles at target */}
                      <circle cx={target.x + (Math.random() - 0.5) * 8} cy={target.y + (Math.random() - 0.5) * 8} r={1.5} fill="#fbbf24" opacity={0.7}>
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="0.6s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )
                })()}

                <g transform={`translate(${pos.x}, ${pos.y})`} onClick={(e) => { e.stopPropagation(); if (!hasDraggedRef.current) onShipClick(ship) }} className="cursor-pointer" style={{ filter: isSelected ? 'url(#sel-glow)' : 'none' }}>

                  {ship.type === 'scout' && (
                    <g transform={`rotate(${rotation})`}>
                      <path d="M0,-12 L5,-2 L3,8 L0,11 L-3,8 L-5,-2 Z" fill={color} opacity={0.85} stroke={isSelected ? '#22d3ee' : '#fff'} strokeWidth={isSelected ? 1.5 : 0.5} />
                      <ellipse cx={0} cy={-6} rx={2} ry={3} fill="#0ea5e9" opacity={0.6} />
                      <path d="M-5,-2 L-11,4 L-7,6 L-3,2 Z" fill={color} opacity={0.7} /><path d="M5,-2 L11,4 L7,6 L3,2 Z" fill={color} opacity={0.7} />
                      {ship.status === 'moving' && <g><ellipse cx={0} cy={13} rx={2} ry={3} fill="#0ea5e9" opacity={0.6}><animate attributeName="ry" values="3;5;3" dur="0.3s" repeatCount="indefinite" /></ellipse></g>}
                      {(ship.status === 'scanning' || ship.status === 'waiting') && <circle cx={0} cy={0} r={15} fill="none" stroke={color} strokeWidth={1} opacity={0.4}><animate attributeName="r" values="10;35;10" dur="2s" repeatCount="indefinite" /><animate attributeName="opacity" values="0.5;0.05;0.5" dur="2s" repeatCount="indefinite" /></circle>}
                    </g>
                  )}
                  {ship.type === 'miner' && (
                    <g transform={`rotate(${rotation})`}>
                      <path d="M0,-10 L6,-4 L7,3 L4,9 L-4,9 L-7,3 L-6,-4 Z" fill={color} opacity={0.85} stroke={isSelected ? '#22d3ee' : '#fff'} strokeWidth={isSelected ? 1.5 : 0.5} />
                      <rect x={-4} y={1} width={8} height={6} rx={1} fill="#92400e" opacity={0.5} />
                      <path d="M0,-10 L1,-15 L0,-17 L-1,-15 Z" fill="#fbbf24" opacity={0.8} />
                      {ship.status === 'moving' && <ellipse cx={0} cy={11} rx={3} ry={2} fill="#f59e0b" opacity={0.5}><animate attributeName="ry" values="2;4;2" dur="0.4s" repeatCount="indefinite" /></ellipse>}
                      {ship.status === 'mining' && <g><text x={0} y={-20} textAnchor="middle" fontSize={10}>⛏️</text></g>}
                    </g>
                  )}
                  {ship.type === 'fighter' && (
                    <g transform={`rotate(${rotation})`}>
                      <path d="M0,-14 L4,-6 L8,-2 L6,6 L2,10 L-2,10 L-6,6 L-8,-2 L-4,-6 Z" fill={color} opacity={0.85} stroke={isSelected ? '#22d3ee' : '#fff'} strokeWidth={isSelected ? 1.5 : 0.5} />
                      <ellipse cx={0} cy={-8} rx={2} ry={3} fill="#f87171" opacity={0.5} />
                      <rect x={-10} y={-4} width={3} height={8} rx={1} fill="#991b1b" opacity={0.8} /><rect x={7} y={-4} width={3} height={8} rx={1} fill="#991b1b" opacity={0.8} />
                      {ship.status === 'moving' && <g><ellipse cx={-2} cy={12} rx={1.5} ry={2.5} fill="#ef4444" opacity={0.6}><animate attributeName="ry" values="2;4;2" dur="0.25s" repeatCount="indefinite" /></ellipse><ellipse cx={2} cy={12} rx={1.5} ry={2.5} fill="#ef4444" opacity={0.6}><animate attributeName="ry" values="2;4;2" dur="0.25s" repeatCount="indefinite" /></ellipse></g>}
                      {ship.status === 'fighting' && <g><circle cx={0} cy={0} r={22} fill="none" stroke="#ef4444" strokeWidth={0.8} strokeDasharray="3 4" opacity={0.3}><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="2s" repeatCount="indefinite" /></circle><line x1={-10} y1={0} x2={-25} y2={-5} stroke="#ef4444" strokeWidth={2} opacity={0.8}><animate attributeName="opacity" values="0.9;0;0" dur="0.4s" repeatCount="indefinite" /></line></g>}
                      {ship.status === 'defending' && <circle cx={0} cy={0} r={16} fill="none" stroke="#22c55e" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.5}><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="4s" repeatCount="indefinite" /></circle>}
                    </g>
                  )}

                  {!isDocked && ship.maxFuel > 0 && <g transform="translate(0, 16)"><rect x={-12} y={0} width={24} height={3} rx={1.5} fill="#1f2937" opacity={0.8} /><rect x={-12} y={0} width={24 * fuelPct} height={3} rx={1.5} fill={fuelPct > 0.5 ? '#22d3ee' : fuelPct > 0.25 ? '#f59e0b' : '#ef4444'} opacity={0.9} /></g>}
                  {hpPct < 1 && <g transform="translate(0, 20)"><rect x={-12} y={0} width={24} height={3} rx={1.5} fill="#1f2937" opacity={0.8} /><rect x={-12} y={0} width={24 * hpPct} height={3} rx={1.5} fill={hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444'} opacity={0.9} /></g>}
                  {ship.status === 'refueling' && <g><text x={0} y={-18} textAnchor="middle" fontSize={10}>⛽</text></g>}
                  <text x={0} y={hpPct < 1 ? 28 : 24} textAnchor="middle" fill={color} fontSize={7} fontWeight="bold" opacity={0.8}>{ship.name}</text>
                </g>
              </g>
            )
          })}

          {/* Click waypoint indicator */}
          {clickIndicator.show && (
            <g transform={`translate(${clickIndicator.x}, ${clickIndicator.y})`}>
              <line x1={-8} y1={0} x2={8} y2={0} stroke="#22d3ee" strokeWidth={1} opacity={0.7} />
              <line x1={0} y1={-8} x2={0} y2={8} stroke="#22d3ee" strokeWidth={1} opacity={0.7} />
              <circle cx={0} cy={0} r={5} fill="none" stroke="#22d3ee" strokeWidth={1.5} opacity={0.8}><animate attributeName="r" values="5;20;5" dur="1.5s" /><animate attributeName="opacity" values="0.8;0;0.8" dur="1.5s" /></circle>
              <path d="M0,-5 L5,0 L0,5 L-5,0 Z" fill="none" stroke="#22d3ee" strokeWidth={1} opacity={0.6} />
            </g>
          )}
        </g>
      </svg>

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
        <button onClick={() => setZoom(z => Math.min(3, z * 1.2))} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white text-sm font-bold transition-colors" style={{ background: 'rgba(4,8,20,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>+</button>
        <button onClick={() => setZoom(z => Math.max(0.3, z * 0.8))} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white text-sm font-bold transition-colors" style={{ background: 'rgba(4,8,20,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>−</button>
        <button onClick={resetView} className="w-8 h-8 rounded-md flex items-center justify-center text-gray-400 hover:text-white text-sm transition-colors" style={{ background: 'rgba(4,8,20,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>⌂</button>
      </div>
      <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md text-[10px] text-gray-500" style={{ background: 'rgba(4,8,20,0.9)', border: '1px solid rgba(255,255,255,0.06)', fontFamily: 'var(--font-orbitron)' }}>{Math.round(zoom * 100)}%</div>

      <div className="absolute bottom-3 left-3 map-legend z-20 space-y-1">
        <p className="text-[9px] text-gray-600 font-medium tracking-widest mb-1.5" style={{ fontFamily: 'var(--font-orbitron)' }}>OBJECTS</p>
        <div className="map-legend-item"><span className="text-xs">🌍</span><span>Planet</span></div>
        <div className="map-legend-item"><span className="text-xs">🪨</span><span>Asteroid</span></div>
        <div className="map-legend-item"><span className="text-xs">👾</span><span>Enemy</span></div>
        <div className="map-legend-item"><span className="text-xs">🌀</span><span>Anomaly</span></div>
        <div className="map-legend-item"><span className="text-xs">🛰️</span><span>Debris</span></div>
        <div className="map-legend-item"><span className="text-xs">🔴</span><span>Hostile</span></div>
        <p className="text-[9px] text-gray-600 font-medium tracking-widest mt-2 mb-1" style={{ fontFamily: 'var(--font-orbitron)' }}>FLEET</p>
        <div className="map-legend-item"><span className="w-2 h-2 bg-sky-400 rounded-sm" /><span className="text-sky-400">Scout</span></div>
        <div className="map-legend-item"><span className="w-2 h-2 bg-amber-400 rounded-sm" /><span className="text-amber-400">Miner</span></div>
        <div className="map-legend-item"><span className="w-2 h-2 bg-red-400 rounded-sm" /><span className="text-red-400">Fighter</span></div>
      </div>
      <div className="absolute bottom-3 right-3 text-[9px] text-gray-700 z-20">Click to set waypoint · Drag to pan · Scroll to zoom</div>
    </div>
  )
}
