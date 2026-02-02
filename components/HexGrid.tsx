'use client'

import { useState, useEffect, useRef } from 'react'

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

export default function HexGrid({ tiles, onTileClick, selectedTile, drone }: HexGridProps) {
  const hexSize = 40
  const [dronePos, setDronePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [droneVisible, setDroneVisible] = useState(false)
  const animFrameRef = useRef<number>(0)
  const prevDroneRef = useRef<string>('')
  
  const hexToPixel = (q: number, r: number) => {
    const x = hexSize * (3/2 * q)
    const y = hexSize * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r)
    return { x: x + 280, y: y + 220 }
  }

  const hexPoints = () => {
    const points = []
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 30)
      const x = hexSize * Math.cos(angle)
      const y = hexSize * Math.sin(angle)
      points.push(`${x},${y}`)
    }
    return points.join(' ')
  }

  const isHQ = (tile: Tile) => tile.q === 0 && tile.r === 0

  // Drone animation
  useEffect(() => {
    if (!drone) {
      setDroneVisible(false)
      return
    }

    const droneKey = `${drone.status}-${drone.targetQ}-${drone.targetR}`
    if (droneKey === prevDroneRef.current) return
    prevDroneRef.current = droneKey

    const hqPos = hexToPixel(0, 0)

    if (drone.status === 'idle') {
      setDronePos(hqPos)
      setDroneVisible(false)
      return
    }

    if (drone.status === 'deploying' && drone.targetQ !== undefined && drone.targetR !== undefined) {
      setDroneVisible(true)
      const targetPos = hexToPixel(drone.targetQ, drone.targetR)
      let start: number | null = null
      const duration = 1500

      const animate = (timestamp: number) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)

        setDronePos({
          x: hqPos.x + (targetPos.x - hqPos.x) * eased,
          y: hqPos.y + (targetPos.y - hqPos.y) * eased
        })

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate)
        }
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }

    if (drone.status === 'scanning' && drone.targetQ !== undefined && drone.targetR !== undefined) {
      const targetPos = hexToPixel(drone.targetQ, drone.targetR)
      setDronePos(targetPos)
      setDroneVisible(true)
    }

    if (drone.status === 'found' && drone.targetQ !== undefined && drone.targetR !== undefined) {
      const targetPos = hexToPixel(drone.targetQ, drone.targetR)
      setDronePos(targetPos)
      setDroneVisible(true)
    }

    if (drone.status === 'returning') {
      setDroneVisible(true)
      const fromQ = drone.targetQ ?? 0
      const fromR = drone.targetR ?? 0
      const fromPos = hexToPixel(fromQ, fromR)
      let start: number | null = null
      const duration = 1200

      const animate = (timestamp: number) => {
        if (!start) start = timestamp
        const progress = Math.min((timestamp - start) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)

        setDronePos({
          x: fromPos.x + (hqPos.x - fromPos.x) * eased,
          y: fromPos.y + (hqPos.y - fromPos.y) * eased
        })

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(animate)
        } else {
          setDroneVisible(false)
        }
      }
      animFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [drone?.status, drone?.targetQ, drone?.targetR])

  const getColor = (tile: Tile) => {
    if (isHQ(tile)) return { fill: '#065f46', stroke: '#10b981', glow: true }
    if (!tile.discovered) return { fill: '#1f2937', stroke: '#4b5563', glow: false }

    // Drone scanning/found this tile
    if (drone?.status === 'scanning' && tile.id === drone.targetTileId) {
      return { fill: '#1e3a5f', stroke: '#38bdf8', glow: true }
    }
    if (drone?.status === 'found' && tile.id === drone.targetTileId) {
      return { fill: '#1a4731', stroke: '#34d399', glow: true }
    }

    switch (tile.type) {
      case 'energy': return { fill: '#854d0e', stroke: '#eab308', glow: false }
      case 'crystal': return { fill: '#581c87', stroke: '#a855f7', glow: false }
      case 'factory': return { fill: '#9a3412', stroke: '#f97316', glow: false }
      case 'artifact': return { fill: '#155e75', stroke: '#22d3ee', glow: true }
      default: return { fill: '#374151', stroke: '#6b7280', glow: false }
    }
  }

  return (
    <div className="relative w-full h-[450px] bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.2 + Math.random() * 0.4,
              animation: `twinkle ${2 + Math.random() * 3}s infinite`
            }}
          />
        ))}
      </div>

      <svg className="w-full h-full relative z-10">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="droneGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <radialGradient id="scanPulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4">
              <animate attributeName="stopOpacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>
        </defs>

        {tiles.map((tile) => {
          const { x, y } = hexToPixel(tile.q, tile.r)
          const colors = getColor(tile)
          const isSelected = selectedTile?.id === tile.id
          const isCenter = isHQ(tile)
          const isDroneTarget = drone && (drone.status === 'scanning' || drone.status === 'found') && tile.id === drone.targetTileId

          return (
            <g
              key={tile.id}
              transform={`translate(${x}, ${y})`}
              onClick={() => onTileClick(tile)}
              className="cursor-pointer"
              style={{ 
                transition: 'transform 0.2s',
                filter: isSelected ? 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.8))' : (colors.glow ? 'url(#glow)' : 'none')
              }}
            >
              <polygon
                points={hexPoints()}
                fill={colors.fill}
                stroke={isSelected ? '#00f0ff' : colors.stroke}
                strokeWidth={isSelected ? 3 : (isCenter ? 2.5 : 1.5)}
                className="hover:brightness-125 transition-all"
              />

              {/* Scanning pulse */}
              {isDroneTarget && drone?.status === 'scanning' && (
                <circle cx={0} cy={0} r={hexSize * 0.8} fill="url(#scanPulse)">
                  <animate attributeName="r" values={`${hexSize * 0.5};${hexSize * 1.1};${hexSize * 0.5}`} dur="2s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Found pulse */}
              {isDroneTarget && drone?.status === 'found' && (
                <circle cx={0} cy={0} r={hexSize * 0.7} fill="none" stroke="#34d399" strokeWidth="2" opacity="0.6">
                  <animate attributeName="r" values={`${hexSize * 0.5};${hexSize * 0.9};${hexSize * 0.5}`} dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Tile icons */}
              {isCenter ? (
                <>
                  <text x={0} y={2} textAnchor="middle" className="fill-emerald-300 text-xl">🏠</text>
                  <text x={0} y={22} textAnchor="middle" className="fill-emerald-400 text-[9px] font-bold">HQ</text>
                </>
              ) : isDroneTarget && drone?.status === 'scanning' ? (
                <>
                  <text x={0} y={2} textAnchor="middle" className="text-lg" style={{ fill: '#38bdf8' }}>📡</text>
                  <text x={0} y={22} textAnchor="middle" className="text-[8px] font-bold" style={{ fill: '#7dd3fc' }}>SCAN</text>
                </>
              ) : isDroneTarget && drone?.status === 'found' ? (
                <>
                  <text x={0} y={2} textAnchor="middle" className="text-lg">✨</text>
                  <text x={0} y={22} textAnchor="middle" className="text-[8px] font-bold" style={{ fill: '#34d399' }}>FOUND</text>
                </>
              ) : !tile.discovered ? (
                <text x={0} y={5} textAnchor="middle" className="fill-gray-500 text-lg">?</text>
              ) : tile.type === 'energy' ? (
                <>
                  <text x={0} y={5} textAnchor="middle" className="fill-yellow-400 text-lg">⚡</text>
                  <text x={0} y={22} textAnchor="middle" className="fill-white text-[10px] font-bold">Lv{tile.level}</text>
                </>
              ) : tile.type === 'crystal' ? (
                <>
                  <text x={0} y={5} textAnchor="middle" className="fill-purple-400 text-lg">💎</text>
                  <text x={0} y={22} textAnchor="middle" className="fill-white text-[10px] font-bold">Lv{tile.level}</text>
                </>
              ) : tile.type === 'factory' ? (
                <>
                  <text x={0} y={5} textAnchor="middle" className="fill-orange-400 text-lg">🏭</text>
                  <text x={0} y={22} textAnchor="middle" className="fill-white text-[10px] font-bold">Lv{tile.level}</text>
                </>
              ) : tile.type === 'artifact' ? (
                <>
                  <text x={0} y={5} textAnchor="middle" className="fill-cyan-400 text-lg">⭐</text>
                  <text x={0} y={22} textAnchor="middle" className="fill-white text-[10px] font-bold">Lv{tile.level}</text>
                </>
              ) : tile.type === 'empty' ? (
                <text x={0} y={5} textAnchor="middle" className="fill-gray-500 text-sm">·</text>
              ) : null}
            </g>
          )
        })}

        {/* ═══════ DRONE ═══════ */}
        {droneVisible && (
          <g
            transform={`translate(${dronePos.x}, ${dronePos.y - 20})`}
            style={{ filter: 'url(#droneGlow)' }}
          >
            {/* Drone body */}
            <rect x={-8} y={-4} width={16} height={8} rx={3} fill="#60a5fa" stroke="#93c5fd" strokeWidth={1} />
            {/* Propellers */}
            <line x1={-12} y1={-4} x2={-4} y2={-4} stroke="#93c5fd" strokeWidth={1.5}>
              <animate attributeName="x1" values="-12;-10;-12" dur="0.15s" repeatCount="indefinite" />
            </line>
            <line x1={4} y1={-4} x2={12} y2={-4} stroke="#93c5fd" strokeWidth={1.5}>
              <animate attributeName="x2" values="12;10;12" dur="0.15s" repeatCount="indefinite" />
            </line>
            {/* Light underneath */}
            <circle cx={0} cy={6} r={2} fill="#38bdf8" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.3;0.8" dur="0.8s" repeatCount="indefinite" />
            </circle>
            {/* Trail particles when flying */}
            {(drone?.status === 'deploying' || drone?.status === 'returning') && (
              <>
                <circle cx={-5} cy={10} r={1.5} fill="#60a5fa" opacity="0.4">
                  <animate attributeName="cy" values="10;20;10" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.4;0;0.4" dur="1s" repeatCount="indefinite" />
                </circle>
                <circle cx={5} cy={12} r={1} fill="#38bdf8" opacity="0.3">
                  <animate attributeName="cy" values="12;22;12" dur="0.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="0.8s" repeatCount="indefinite" />
                </circle>
              </>
            )}
          </g>
        )}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur rounded-lg px-3 py-2 text-xs space-y-1 border border-white/10">
        <div className="flex items-center gap-2"><span>🏠</span> <span className="text-emerald-400">HQ (Claim)</span></div>
        <div className="flex items-center gap-2"><span>⚡</span> <span className="text-yellow-400">Energy</span></div>
        <div className="flex items-center gap-2"><span>💎</span> <span className="text-purple-400">Crystal</span></div>
        <div className="flex items-center gap-2"><span>🏭</span> <span className="text-orange-400">Factory</span></div>
        <div className="flex items-center gap-2"><span>⭐</span> <span className="text-cyan-400">Artifact</span></div>
        {drone && drone.status !== 'idle' && (
          <div className="flex items-center gap-2"><span>🛸</span> <span className="text-sky-400">Drone Active</span></div>
        )}
      </div>

      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
