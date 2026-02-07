'use client'

import { useRef, useEffect, useState, memo } from 'react'

// ═══════════════════════════════════════════════════════
// ANIMATED PLANET — Sprite Sheet Canvas Renderer
// ═══════════════════════════════════════════════════════
// Renders a rotating planet from a sprite sheet grid
// Uses requestAnimationFrame + circular canvas clip
// ═══════════════════════════════════════════════════════

export type PlanetRarity = 'common' | 'rare' | 'epic' | 'legendary'

interface AnimatedPlanetProps {
  /** Path to sprite sheet image */
  spriteSheet?: string
  /** Grid columns in the sprite sheet */
  cols?: number
  /** Grid rows in the sprite sheet */
  rows?: number
  /** Frames per second for rotation */
  fps?: number
  /** Display size in pixels */
  size?: number
  /** Planet rarity for glow effects */
  rarity?: PlanetRarity
  /** Pixel offset from top of image (for title headers) */
  titleOffset?: number
  /** Additional CSS classes */
  className?: string
  /** Whether animation is paused */
  paused?: boolean
  /** Show rarity label below planet */
  showLabel?: boolean
  /** Callback when canvas is clicked */
  onClick?: () => void
}

// Rarity glow configs
const RARITY_GLOW: Record<PlanetRarity, { color: string; shadow: string; ring: string; label: string }> = {
  common: {
    color: 'rgba(156,163,175,0.3)',
    shadow: '0 0 20px rgba(156,163,175,0.2)',
    ring: 'rgba(156,163,175,0.15)',
    label: 'text-gray-400 border-gray-500/40 bg-gray-500/10',
  },
  rare: {
    color: 'rgba(59,130,246,0.4)',
    shadow: '0 0 30px rgba(59,130,246,0.3), 0 0 60px rgba(59,130,246,0.1)',
    ring: 'rgba(59,130,246,0.2)',
    label: 'text-blue-400 border-blue-500/40 bg-blue-500/10',
  },
  epic: {
    color: 'rgba(124,58,237,0.5)',
    shadow: '0 0 40px rgba(124,58,237,0.4), 0 0 80px rgba(124,58,237,0.15)',
    ring: 'rgba(124,58,237,0.25)',
    label: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
  },
  legendary: {
    color: 'rgba(251,191,36,0.5)',
    shadow: '0 0 40px rgba(251,191,36,0.4), 0 0 80px rgba(251,191,36,0.15), 0 0 120px rgba(251,191,36,0.08)',
    ring: 'rgba(251,191,36,0.3)',
    label: 'text-yellow-400 border-yellow-400/40 bg-yellow-500/10',
  },
}

function AnimatedPlanetInner({
  spriteSheet = '/sprites/legendary_planet.png',
  cols = 4,
  rows = 5,
  fps = 12,
  size = 120,
  rarity = 'legendary',
  titleOffset = 115,
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

  const totalFrames = cols * rows
  const glow = RARITY_GLOW[rarity]

  // Load sprite sheet
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      setLoaded(true)
    }
    img.onerror = () => setLoaded(false)
    img.src = spriteSheet
    return () => { img.onload = null; img.onerror = null }
  }, [spriteSheet])

  // Animation loop
  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = imgRef.current
    const imgW = img.naturalWidth
    const imgH = img.naturalHeight
    const gridH = imgH - titleOffset
    const frameW = imgW / cols
    const frameH = gridH / rows
    const interval = 1000 / fps

    const draw = (time: number) => {
      rafRef.current = requestAnimationFrame(draw)

      if (paused) return
      if (time - lastTimeRef.current < interval) return
      lastTimeRef.current = time

      frameRef.current = (frameRef.current + 1) % totalFrames

      const col = frameRef.current % cols
      const row = Math.floor(frameRef.current / cols)
      const sx = col * frameW
      const sy = titleOffset + row * frameH

      ctx.clearRect(0, 0, size, size)

      // Circular clip
      ctx.save()
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
      ctx.clip()

      ctx.drawImage(img, sx, sy, frameW, frameH, 0, 0, size, size)
      ctx.restore()
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [loaded, cols, rows, fps, size, titleOffset, totalFrames, paused])

  return (
    <div
      className={`relative inline-flex flex-col items-center ${className}`}
      style={{ width: size, height: showLabel ? size + 24 : size }}
      onClick={onClick}
    >
      {/* Outer glow ring — epic & legendary only */}
      {(rarity === 'epic' || rarity === 'legendary') && (
        <>
          <div
            className="absolute rounded-full animate-pulse pointer-events-none"
            style={{
              inset: -Math.round(size * 0.1),
              border: `1.5px solid ${glow.ring}`,
              animationDuration: '3s',
            }}
          />
          {rarity === 'legendary' && (
            <div
              className="absolute rounded-full animate-pulse pointer-events-none"
              style={{
                inset: -Math.round(size * 0.18),
                border: `1px solid ${glow.ring}`,
                animationDuration: '4s',
                animationDelay: '1s',
              }}
            />
          )}
        </>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
        style={{
          width: size,
          height: size,
          filter: loaded ? `drop-shadow(${glow.shadow})` : undefined,
          cursor: onClick ? 'pointer' : undefined,
        }}
      />

      {/* Fallback if not loaded */}
      {!loaded && (
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-cyan-600 animate-pulse"
          style={{ width: size, height: size }}
        />
      )}

      {/* Rarity label */}
      {showLabel && (
        <span
          className={`absolute -bottom-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${glow.label}`}
          style={{ fontSize: Math.max(8, size * 0.08) }}
        >
          {rarity.toUpperCase()}
        </span>
      )}
    </div>
  )
}

// Memo to prevent re-renders
const AnimatedPlanet = memo(AnimatedPlanetInner)
export default AnimatedPlanet
