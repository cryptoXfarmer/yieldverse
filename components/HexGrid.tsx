'use client'

import { useState } from 'react'
import { Zap, Diamond, Factory, Star, HelpCircle, Lock } from 'lucide-react'

export type TileType = 'unknown' | 'empty' | 'energy' | 'crystal' | 'factory' | 'artifact'

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

interface HexGridProps {
  tiles: Tile[]
  onTileClick: (tile: Tile) => void
  selectedTile: Tile | null
}

export default function HexGrid({ tiles, onTileClick, selectedTile }: HexGridProps) {
  const hexSize = 40
  
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

  const getColor = (tile: Tile) => {
    if (!tile.discovered) return { fill: '#1f2937', stroke: '#4b5563' }
    switch (tile.type) {
      case 'energy': return { fill: '#854d0e', stroke: '#eab308' }
      case 'crystal': return { fill: '#581c87', stroke: '#a855f7' }
      case 'factory': return { fill: '#9a3412', stroke: '#f97316' }
      case 'artifact': return { fill: '#155e75', stroke: '#22d3ee' }
      default: return { fill: '#374151', stroke: '#6b7280' }
    }
  }

  return (
    <div className="relative w-full h-[450px] bg-gradient-to-b from-gray-900 to-black rounded-2xl border border-white/10 overflow-hidden">
      {/* Stars background */}
      <div className="absolute inset-0">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `pulse ${2 + Math.random() * 2}s infinite`
            }}
          />
        ))}
      </div>

      <svg className="w-full h-full relative z-10">
        {tiles.map((tile) => {
          const { x, y } = hexToPixel(tile.q, tile.r)
          const colors = getColor(tile)
          const isSelected = selectedTile?.id === tile.id

          return (
            <g
              key={tile.id}
              transform={`translate(${x}, ${y})`}
              onClick={() => onTileClick(tile)}
              className="cursor-pointer"
              style={{ 
                transition: 'transform 0.2s',
                filter: isSelected ? 'drop-shadow(0 0 12px rgba(0, 240, 255, 0.8))' : 'none'
              }}
            >
              <polygon
                points={hexPoints()}
                fill={colors.fill}
                stroke={isSelected ? '#00f0ff' : colors.stroke}
                strokeWidth={isSelected ? 3 : 1.5}
                className="hover:brightness-125 transition-all"
              />

              {/* Icon */}
              {!tile.discovered ? (
                <text x={0} y={5} textAnchor="middle" className="fill-gray-500 text-lg">?</text>
              ) : tile.type === 'energy' ? (
                <text x={0} y={5} textAnchor="middle" className="fill-yellow-400 text-lg">⚡</text>
              ) : tile.type === 'crystal' ? (
                <text x={0} y={5} textAnchor="middle" className="fill-purple-400 text-lg">💎</text>
              ) : tile.type === 'factory' ? (
                <text x={0} y={5} textAnchor="middle" className="fill-orange-400 text-lg">🏭</text>
              ) : tile.type === 'artifact' ? (
                <text x={0} y={5} textAnchor="middle" className="fill-cyan-400 text-lg">⭐</text>
              ) : tile.type === 'empty' ? (
                <text x={0} y={5} textAnchor="middle" className="fill-gray-500 text-sm">·</text>
              ) : null}

              {/* Level */}
              {tile.discovered && tile.type !== 'empty' && tile.type !== 'unknown' && (
                <text x={0} y={22} textAnchor="middle" className="fill-white text-[10px] font-bold">
                  Lv{tile.level}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-black/70 rounded-lg px-3 py-2 text-xs space-y-1">
        <div className="flex items-center gap-2"><span>?</span> <span className="text-gray-400">Unknown</span></div>
        <div className="flex items-center gap-2"><span>⚡</span> <span className="text-yellow-400">Energy</span></div>
        <div className="flex items-center gap-2"><span>💎</span> <span className="text-purple-400">Crystal</span></div>
        <div className="flex items-center gap-2"><span>🏭</span> <span className="text-orange-400">Factory</span></div>
        <div className="flex items-center gap-2"><span>⭐</span> <span className="text-cyan-400">Artifact</span></div>
      </div>
    </div>
  )
}
