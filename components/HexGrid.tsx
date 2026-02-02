'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export type TileType = 'unknown' | 'empty' | 'energy' | 'crystal' | 'factory' | 'artifact' | 'hq'

export interface Tile {
  id: string
  planet_id: string
  q: number
  r: number
  type: TileType
  discovered: boolean
  level: number
  bonus: number
}

export interface DroneState {
  status: 'idle' | 'deploying' | 'scanning' | 'found' | 'returning'
  targetTileId?: string
  targetQ?: number
  targetR?: number
}

interface HexGridProps {
  tiles: Tile[]
  onTileClick: (tile: Tile) => void
  selectedTile: Tile | null
  drone?: DroneState | null
}

// ─── SVG ICON PATHS (inside hexagons) ───
const TILE_ICONS: Record<string, { path: string; color: string; size: number }> = {
  energy: {
    // Lightning bolt
    path: 'M-4,-10 L2,-2 L-1,-2 L4,10 L-2,2 L1,2 Z',
    color: '#facc15',
    size: 1,
  },
  crystal: {
    // Diamond shape
    path: 'M0,-10 L7,0 L0,10 L-7,0 Z M0,-6 L4,0 L0,6 L-4,0 Z',
    color: '#c084fc',
    size: 1,
  },
  factory: {
    // Factory/gear
    path: 'M-6,4 L-6,-2 L-2,-6 L2,-6 L6,-2 L6,4 L4,6 L-4,6 Z M-2,-2 L2,-2 L2,2 L-2,2 Z',
    color: '#fb923c',
    size: 1,
  },
  artifact: {
    // Star
    path: 'M0,-10 L2.5,-3 L10,-3 L4,2 L6,10 L0,5 L-6,10 L-4,2 L-10,-3 L-2.5,-3 Z',
    color: '#22d3ee',
    size: 0.9,
  },
  hq: {
    // Command center / shield
    path: 'M0,-10 L8,-4 L8,4 L0,10 L-8,4 L-8,-4 Z M0,-5 L4,-2 L4,2 L0,5 L-4,2 L-4,-2 Z',
    color: '#34d399',
    size: 1,
  },
  unknown: {
    // Question mark
    path: 'M-3,-8 Q-3,-11 0,-11 Q3,-11 3,-8 Q3,-5 0,-4 L0,-1 M0,3 L0,4',
    color: '#6b7280',
    size: 0.8,
  },
}

export default function HexGrid({ tiles, onTileClick, selectedTile, drone }: HexGridProps) {
  const hexSize = 38
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(0.85)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragStartOffset, setDragStartOffset] = useState({ x: 0, y: 0 })
  const hasDraggedRef = useRef(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [dronePos, setDronePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [droneVisible, setDroneVisible] = useState(false)
  const animFrameRef = useRef<number>(0)
  const prevDroneRef = useRef<string>('')
  const lastTouchDist = useRef<number | null>(null)
  
  const hexToPixel = (q: number, r: number) => ({
    x: hexSize * (3/2 * q),
    y: hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r),
  })

  // Center on load
  useEffect(() => {
    if (containerRef.current && tiles.length > 0) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffset({ x: rect.width / 2, y: rect.height / 2 })
    }
  }, [tiles.length > 0, isFullscreen])

  const hexPoints = () => {
    const pts = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30)
      pts.push(`${hexSize * Math.cos(angle)},${hexSize * Math.sin(angle)}`)
    }
    return pts.join(' ')
  }

  // Inner hex for double-border effect
  const innerHexPoints = () => {
    const s = hexSize * 0.82
    const pts = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30)
      pts.push(`${s * Math.cos(angle)},${s * Math.sin(angle)}`)
    }
    return pts.join(' ')
  }

  const isHQ = (tile: Tile) => tile.q === 0 && tile.r === 0

  // ── PAN ──
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsDragging(true)
    hasDraggedRef.current = false
    setDragStart({ x: e.clientX, y: e.clientY })
    setDragStartOffset({ ...offset })
  }, [offset])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true
    setOffset({ x: dragStartOffset.x + dx, y: dragStartOffset.y + dy })
  }, [isDragging, dragStart, dragStartOffset])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  // ── TOUCH ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true)
      hasDraggedRef.current = false
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
      setDragStartOffset({ ...offset })
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDist.current = Math.sqrt(dx * dx + dy * dy)
    }
  }, [offset])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - dragStart.x
      const dy = e.touches[0].clientY - dragStart.y
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true
      setOffset({ x: dragStartOffset.x + dx, y: dragStartOffset.y + dy })
    } else if (e.touches.length === 2 && lastTouchDist.current) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      setZoom(z => Math.max(0.25, Math.min(2.5, z * (dist / lastTouchDist.current!))))
      lastTouchDist.current = dist
    }
  }, [isDragging, dragStart, dragStartOffset])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)
    lastTouchDist.current = null
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(z => Math.max(0.25, Math.min(2.5, z * (e.deltaY > 0 ? 0.92 : 1.08))))
  }, [])

  const resetView = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setOffset({ x: rect.width / 2, y: rect.height / 2 })
      setZoom(0.85)
    }
  }

  // ── FULLSCREEN ──
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen?.().catch(() => {})
    } else {
      document.exitFullscreen?.().catch(() => {})
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // ── DRONE ANIMATION ──
  useEffect(() => {
    if (!drone) { setDroneVisible(false); return }
    const droneKey = `${drone.status}-${drone.targetQ}-${drone.targetR}`
    if (droneKey === prevDroneRef.current) return
    prevDroneRef.current = droneKey
    const hqPos = hexToPixel(0, 0)

    if (drone.status === 'idle') { setDronePos(hqPos); setDroneVisible(false); return }

    if (drone.status === 'deploying' && drone.targetQ !== undefined && drone.targetR !== undefined) {
      setDroneVisible(true)
      const targetPos = hexToPixel(drone.targetQ, drone.targetR)
      let start: number | null = null
      const animate = (ts: number) => {
        if (!start) start = ts
        const p = Math.min((ts - start) / 2000, 1)
        const e = 1 - Math.pow(1 - p, 3)
        setDronePos({ x: hqPos.x + (targetPos.x - hqPos.x) * e, y: hqPos.y + (targetPos.y - hqPos.y) * e })
        if (p < 1) animFrameRef.current = requestAnimationFrame(animate)
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }
    if (drone.status === 'scanning' && drone.targetQ !== undefined && drone.targetR !== undefined) {
      setDronePos(hexToPixel(drone.targetQ, drone.targetR)); setDroneVisible(true)
    }
    if (drone.status === 'found' && drone.targetQ !== undefined && drone.targetR !== undefined) {
      setDronePos(hexToPixel(drone.targetQ, drone.targetR)); setDroneVisible(true)
    }
    if (drone.status === 'returning' && drone.targetQ !== undefined && drone.targetR !== undefined) {
      setDroneVisible(true)
      const fromPos = hexToPixel(drone.targetQ, drone.targetR)
      let start: number | null = null
      const animate = (ts: number) => {
        if (!start) start = ts
        const p = Math.min((ts - start) / 1500, 1)
        const e = 1 - Math.pow(1 - p, 3)
        setDronePos({ x: fromPos.x + (hqPos.x - fromPos.x) * e, y: fromPos.y + (hqPos.y - fromPos.y) * e })
        if (p < 1) animFrameRef.current = requestAnimationFrame(animate)
        else setDroneVisible(false)
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }
    return () => { if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current) }
  }, [drone?.status, drone?.targetQ, drone?.targetR])

  const getColor = (tile: Tile) => {
    if (isHQ(tile)) return { fill: '#052e1f', stroke: '#10b981', inner: '#0a4a32', glow: true }
    if (!tile.discovered) return { fill: '#111827', stroke: '#374151', inner: '#1a2332', glow: false }
    if (drone?.status === 'scanning' && tile.id === drone.targetTileId)
      return { fill: '#0c2a4a', stroke: '#38bdf8', inner: '#123d6b', glow: true }
    if (drone?.status === 'found' && tile.id === drone.targetTileId)
      return { fill: '#0a3022', stroke: '#34d399', inner: '#0f4a35', glow: true }

    switch (tile.type) {
      case 'energy':  return { fill: '#422006', stroke: '#eab308', inner: '#5c3a0e', glow: false }
      case 'crystal': return { fill: '#3b0764', stroke: '#a855f7', inner: '#581c87', glow: false }
      case 'factory': return { fill: '#431407', stroke: '#f97316', inner: '#6b2710', glow: false }
      case 'artifact':return { fill: '#083344', stroke: '#22d3ee', inner: '#0e4d5e', glow: true }
      default:        return { fill: '#1f2937', stroke: '#4b5563', inner: '#2a3444', glow: false }
    }
  }

  const handleTileClick = (tile: Tile) => { if (!hasDraggedRef.current) onTileClick(tile) }

  // Star field (generated once)
  const starsRef = useRef<{ x: number; y: number; r: number; o: number; d: number }[]>([])
  if (starsRef.current.length === 0) {
    for (let i = 0; i < 120; i++) {
      starsRef.current.push({
        x: Math.random() * 100, y: Math.random() * 100,
        r: 0.3 + Math.random() * 1.2, o: 0.15 + Math.random() * 0.6,
        d: 2 + Math.random() * 4,
      })
    }
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden select-none ${isFullscreen ? '' : 'rounded-2xl border border-indigo-900/50'}`}
      style={{ 
        cursor: isDragging ? 'grabbing' : 'grab', 
        touchAction: 'none',
        height: isFullscreen ? '100vh' : '600px',
        background: 'radial-gradient(ellipse at 30% 20%, #0a0e27 0%, #030712 50%, #000000 100%)',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      {/* ═══ STARS ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {starsRef.current.map((s, i) => (
          <div key={i} className="absolute rounded-full" style={{
            left: `${s.x}%`, top: `${s.y}%`, width: `${s.r * 2}px`, height: `${s.r * 2}px`,
            background: `radial-gradient(circle, rgba(200,220,255,${s.o}) 0%, transparent 70%)`,
            animation: `twinkle ${s.d}s ease-in-out infinite`,
            animationDelay: `${Math.random() * s.d}s`,
          }} />
        ))}
        {/* Nebula glow */}
        <div className="absolute w-[600px] h-[400px] rounded-full opacity-[0.04]" style={{
          left: '10%', top: '20%',
          background: 'radial-gradient(ellipse, #6366f1, transparent 70%)',
        }} />
        <div className="absolute w-[400px] h-[300px] rounded-full opacity-[0.03]" style={{
          right: '5%', bottom: '10%',
          background: 'radial-gradient(ellipse, #a855f7, transparent 70%)',
        }} />
      </div>

      {/* ═══ SVG MAP ═══ */}
      <svg className="w-full h-full relative z-10">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="selectGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="droneGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <radialGradient id="scanPulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4">
              <animate attributeName="stopOpacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}>
          {tiles.map((tile) => {
            const { x, y } = hexToPixel(tile.q, tile.r)
            const colors = getColor(tile)
            const isSelected = selectedTile?.id === tile.id
            const isCenter = isHQ(tile)
            const isDroneTarget = drone && (drone.status === 'scanning' || drone.status === 'found') && tile.id === drone.targetTileId
            const tileType = isCenter ? 'hq' : (!tile.discovered ? 'unknown' : tile.type)
            const icon = TILE_ICONS[tileType] || TILE_ICONS.unknown

            return (
              <g
                key={tile.id}
                transform={`translate(${x}, ${y})`}
                onClick={() => handleTileClick(tile)}
                className="cursor-pointer"
                style={{ filter: isSelected ? 'url(#selectGlow)' : (colors.glow ? 'url(#glow)' : 'none') }}
              >
                {/* Outer hex */}
                <polygon
                  points={hexPoints()}
                  fill={colors.fill}
                  stroke={isSelected ? '#00f0ff' : colors.stroke}
                  strokeWidth={isSelected ? 2.5 : (isCenter ? 2 : 1.2)}
                  opacity={tile.discovered || isCenter ? 1 : 0.6}
                />
                {/* Inner hex for depth */}
                <polygon
                  points={innerHexPoints()}
                  fill={colors.inner}
                  stroke={colors.stroke}
                  strokeWidth={0.4}
                  opacity={tile.discovered || isCenter ? 0.5 : 0.15}
                />

                {/* Scanning pulse */}
                {isDroneTarget && drone?.status === 'scanning' && (
                  <circle cx={0} cy={0} r={hexSize * 0.8} fill="url(#scanPulse)">
                    <animate attributeName="r" values={`${hexSize * 0.5};${hexSize * 1.1};${hexSize * 0.5}`} dur="2s" repeatCount="indefinite" />
                  </circle>
                )}
                {isDroneTarget && drone?.status === 'found' && (
                  <circle cx={0} cy={0} r={hexSize * 0.7} fill="none" stroke="#34d399" strokeWidth="2" opacity="0.6">
                    <animate attributeName="r" values={`${hexSize * 0.5};${hexSize * 0.9};${hexSize * 0.5}`} dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* ─── ICON ─── */}
                {isDroneTarget && drone?.status === 'scanning' ? (
                  <g>
                    <circle cx={0} cy={-2} r={6} fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1={0} y1={-8} x2={0} y2={-14} stroke="#38bdf8" strokeWidth="1.5" />
                    <line x1={0} y1={4} x2={0} y2={10} stroke="#38bdf8" strokeWidth="1.5" />
                    <text x={0} y={20} textAnchor="middle" fill="#7dd3fc" fontSize="8" fontWeight="bold">SCAN</text>
                  </g>
                ) : isDroneTarget && drone?.status === 'found' ? (
                  <g>
                    <path d={TILE_ICONS.artifact.path} fill="#34d399" opacity="0.9" transform="scale(0.8)" />
                    <text x={0} y={20} textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">FOUND</text>
                  </g>
                ) : !tile.discovered && !isCenter ? (
                  // Undiscovered — lock icon
                  <g opacity="0.35">
                    <rect x={-4} y={-2} width={8} height={7} rx={1.5} fill="none" stroke="#6b7280" strokeWidth="1.2" />
                    <path d="M-2.5,-2 Q-2.5,-7 0,-7 Q2.5,-7 2.5,-2" fill="none" stroke="#6b7280" strokeWidth="1.2" />
                  </g>
                ) : (
                  <g transform={`scale(${icon.size})`}>
                    <path d={icon.path} fill={icon.color} opacity={0.9} />
                    {/* Level label */}
                    {tile.discovered && tile.type !== 'empty' && !isCenter && tile.level > 0 && (
                      <text x={0} y={24 / icon.size} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" opacity="0.9">
                        Lv{tile.level}
                      </text>
                    )}
                    {isCenter && (
                      <text x={0} y={22} textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="bold">HQ</text>
                    )}
                  </g>
                )}
              </g>
            )
          })}

          {/* ═══ DRONE ═══ */}
          {droneVisible && (
            <g transform={`translate(${dronePos.x}, ${dronePos.y - 22})`} style={{ filter: 'url(#droneGlow)' }}>
              <rect x={-8} y={-4} width={16} height={8} rx={3} fill="#60a5fa" stroke="#93c5fd" strokeWidth={1} />
              <line x1={-12} y1={-4} x2={-4} y2={-4} stroke="#93c5fd" strokeWidth={1.5}>
                <animate attributeName="x1" values="-12;-10;-12" dur="0.15s" repeatCount="indefinite" />
              </line>
              <line x1={4} y1={-4} x2={12} y2={-4} stroke="#93c5fd" strokeWidth={1.5}>
                <animate attributeName="x2" values="12;10;12" dur="0.15s" repeatCount="indefinite" />
              </line>
              <circle cx={0} cy={6} r={2} fill="#38bdf8" opacity="0.8">
                <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.8s" repeatCount="indefinite" />
              </circle>
            </g>
          )}
        </g>
      </svg>

      {/* ═══ CONTROLS ═══ */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
        <button onClick={() => setZoom(z => Math.min(2.5, z * 1.2))} className="w-9 h-9 bg-indigo-950/80 border border-indigo-500/30 rounded-lg text-indigo-200 font-bold hover:bg-indigo-900/60 flex items-center justify-center text-sm backdrop-blur-sm">+</button>
        <button onClick={() => setZoom(z => Math.max(0.25, z * 0.8))} className="w-9 h-9 bg-indigo-950/80 border border-indigo-500/30 rounded-lg text-indigo-200 font-bold hover:bg-indigo-900/60 flex items-center justify-center text-sm backdrop-blur-sm">−</button>
        <button onClick={resetView} className="w-9 h-9 bg-indigo-950/80 border border-indigo-500/30 rounded-lg text-indigo-200 hover:bg-indigo-900/60 flex items-center justify-center backdrop-blur-sm">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M7 1v3M7 10v3M1 7h3M10 7h3" stroke="currentColor" strokeWidth="1.2"/></svg>
        </button>
        <button onClick={toggleFullscreen} className="w-9 h-9 bg-indigo-950/80 border border-indigo-500/30 rounded-lg text-indigo-200 hover:bg-indigo-900/60 flex items-center justify-center backdrop-blur-sm">
          {isFullscreen ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 1v3H1M9 1v3h4M5 13v-3H1M9 13v-3h4" stroke="currentColor" strokeWidth="1.3"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 5V1h4M9 1h4v4M1 9v4h4M13 9v4H9" stroke="currentColor" strokeWidth="1.3"/></svg>
          )}
        </button>
      </div>

      {/* Zoom % */}
      <div className="absolute top-3 left-3 bg-black/60 border border-indigo-500/20 rounded-lg px-2.5 py-1 text-xs text-indigo-300/70 z-20 backdrop-blur-sm font-mono">
        {Math.round(zoom * 100)}%
      </div>

      {/* ═══ LEGEND ═══ */}
      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm rounded-xl px-3 py-2.5 text-xs space-y-1.5 border border-indigo-500/20 z-20">
        <div className="flex items-center gap-2.5">
          <svg width="12" height="12" viewBox="-6 -6 12 12"><path d={TILE_ICONS.hq.path} fill="#34d399" transform="scale(0.45)"/></svg>
          <span className="text-emerald-400">HQ (Claim)</span>
        </div>
        <div className="flex items-center gap-2.5">
          <svg width="12" height="12" viewBox="-6 -6 12 12"><path d={TILE_ICONS.energy.path} fill="#facc15" transform="scale(0.45)"/></svg>
          <span className="text-yellow-400">Energy</span>
        </div>
        <div className="flex items-center gap-2.5">
          <svg width="12" height="12" viewBox="-6 -6 12 12"><path d={TILE_ICONS.crystal.path} fill="#c084fc" transform="scale(0.45)"/></svg>
          <span className="text-purple-400">Crystal</span>
        </div>
        <div className="flex items-center gap-2.5">
          <svg width="12" height="12" viewBox="-6 -6 12 12"><path d={TILE_ICONS.factory.path} fill="#fb923c" transform="scale(0.45)"/></svg>
          <span className="text-orange-400">Factory</span>
        </div>
        <div className="flex items-center gap-2.5">
          <svg width="12" height="12" viewBox="-6 -6 12 12"><path d={TILE_ICONS.artifact.path} fill="#22d3ee" transform="scale(0.4)"/></svg>
          <span className="text-cyan-400">Artifact</span>
        </div>
        {drone && drone.status !== 'idle' && (
          <div className="flex items-center gap-2.5"><span className="text-sky-400">🛸</span> <span className="text-sky-400">Drone</span></div>
        )}
      </div>

      {/* Hint */}
      <div className="absolute bottom-3 right-3 bg-black/50 rounded-lg px-2 py-1 text-[10px] text-indigo-400/40 z-20 backdrop-blur-sm">
        Drag to pan · Scroll to zoom
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.15; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
