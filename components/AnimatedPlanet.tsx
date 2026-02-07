'use client'

import { useRef, useEffect, useState, memo } from 'react'
import {
  type PlanetRarity, type PlanetVisualType,
  SPRITE_COLS, SPRITE_ROWS, SPRITE_TITLE_OFFSET,
  RARITY_FPS, RARITY_GLOW_COLORS, getSpriteSheet,
  PLANET_ROTATION_SPEED_MULTIPLIER,
} from '@/lib/planetSpriteConfig'

// ═══════════════════════════════════════════════════════
// ANIMATED PLANET — Multi-Sheet Sprite Renderer
// ═══════════════════════════════════════════════════════

interface AnimatedPlanetProps {
  rarity?: PlanetRarity
  visualType?: PlanetVisualType   // row 0-4
  sheetIndex?: number             // which sheet file (0-4)
  size?: number
  fps?: number
  spriteSheet?: string            // override path
  className?: string
  paused?: boolean
  showLabel?: boolean
  onClick?: () => void
}

export type { PlanetRarity, PlanetVisualType }

function AnimatedPlanetInner({
  rarity = 'common',
  visualType = 0,
  sheetIndex = 0,
  size = 120,
  fps,
  spriteSheet,
  className = '',
  paused = false,
  showLabel = false,
  onClick,
}: AnimatedPlanetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const frameRef = useRef(0)
  const lastTimeRef = useRef(0)
  const rafRef = useRef<number>(0)
  const [loaded, setLoaded] = useState(false)

  const sheetPath = spriteSheet ?? getSpriteSheet(rarity, sheetIndex)
  const baseFps = fps ?? RARITY_FPS[rarity]
  // Apply global cinematic multiplier (also affects any per-instance fps override)
  const animFps = Math.max(0.25, baseFps * PLANET_ROTATION_SPEED_MULTIPLIER)
  const glow = RARITY_GLOW_COLORS[rarity]
  const row = Math.max(0, Math.min(visualType, SPRITE_ROWS - 1))

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => { imgRef.current = img; setLoaded(true) }
    img.onerror = () => setLoaded(false)
    img.src = sheetPath
    return () => { img.onload = null; img.onerror = null }
  }, [sheetPath])

  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imgRef.current
    const frameW = img.naturalWidth / SPRITE_COLS
    const frameH = (img.naturalHeight - SPRITE_TITLE_OFFSET) / SPRITE_ROWS
    const interval = 1000 / animFps

    const draw = (time: number) => {
      rafRef.current = requestAnimationFrame(draw)
      if (paused) return
      if (time - lastTimeRef.current < interval) return
      lastTimeRef.current = time

      frameRef.current = (frameRef.current + 1) % SPRITE_COLS
      const sx = frameRef.current * frameW
      const sy = SPRITE_TITLE_OFFSET + row * frameH

      ctx.clearRect(0, 0, size, size)
      ctx.save()
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.clip()
      ctx.drawImage(img, sx, sy, frameW, frameH, 0, 0, size, size)
      ctx.restore()
    }

    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [loaded, animFps, size, paused, row])

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}
      style={{ width: size, height: showLabel ? size + 22 : size }}
      onClick={onClick}>
      
      {(rarity === 'epic' || rarity === 'legendary') && (
        <>
          <div className="absolute rounded-full animate-pulse pointer-events-none"
            style={{ inset: -Math.round(size * 0.1), border: `1.5px solid ${glow.ring}`, animationDuration: '3s' }} />
          {rarity === 'legendary' && (
            <div className="absolute rounded-full animate-pulse pointer-events-none"
              style={{ inset: -Math.round(size * 0.18), border: `1px solid ${glow.ring}`, animationDuration: '4s', animationDelay: '1s' }} />
          )}
        </>
      )}
      {rarity === 'rare' && (
        <div className="absolute rounded-full animate-pulse pointer-events-none"
          style={{ inset: -Math.round(size * 0.08), border: `1px solid ${glow.ring}`, animationDuration: '4s' }} />
      )}

      <canvas ref={canvasRef} width={size} height={size} className="rounded-full"
        style={{ width: size, height: size,
          filter: loaded ? `drop-shadow(${glow.shadow})` : undefined,
          cursor: onClick ? 'pointer' : undefined }} />

      {!loaded && (
        <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${glow.bgGradient} animate-pulse`}
          style={{ width: size, height: size }} />
      )}

      {showLabel && (
        <span className={`absolute -bottom-1 px-2 py-0.5 rounded-full font-bold border ${glow.label}`}
          style={{ fontSize: Math.max(8, size * 0.08) }}>
          {rarity.toUpperCase()}
        </span>
      )}
    </div>
  )
}

const AnimatedPlanet = memo(AnimatedPlanetInner)
export default AnimatedPlanet
