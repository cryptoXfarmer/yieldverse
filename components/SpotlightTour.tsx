'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export type SpotlightStep = {
  /** Unique id mainly for debugging */
  id: string
  title: string
  body: string
  /** CSS selector for the element we want to highlight */
  target: string
  /** If provided, clicking Next on this step will navigate to this route */
  nextHref?: string
  nextLabel?: string
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

async function waitForElement(selector: string, timeoutMs = 2200): Promise<HTMLElement | null> {
  const start = Date.now()
  return new Promise((resolve) => {
    const tick = () => {
      const el = document.querySelector(selector) as HTMLElement | null
      if (el) return resolve(el)
      if (Date.now() - start > timeoutMs) return resolve(null)
      setTimeout(tick, 60)
    }
    tick()
  })
}

export default function SpotlightTour({
  open,
  steps,
  startAt = 0,
  onClose,
}: {
  open: boolean
  steps: SpotlightStep[]
  startAt?: number
  onClose: () => void
}) {
  const router = useRouter()
  const [index, setIndex] = useState(startAt)
  const [box, setBox] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [targetFound, setTargetFound] = useState(true)

  // reset when opened / startAt changes
  useEffect(() => {
    if (!open) return
    setIndex(startAt)
  }, [open, startAt])

  const current = useMemo(() => steps[index], [steps, index])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    ;(async () => {
      setTargetFound(true)
      setBox(null)

      const el = await waitForElement(current?.target || '')
      if (cancelled) return
      if (!el) {
        setTargetFound(false)
        return
      }

      // Smoothly bring it into view
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      } catch {}

      // Wait a beat so the scroll/DOM settles
      setTimeout(() => {
        if (cancelled) return
        const r = el.getBoundingClientRect()
        const pad = 10
        setBox({
          top: Math.max(8, r.top - pad),
          left: Math.max(8, r.left - pad),
          width: Math.max(40, r.width + pad * 2),
          height: Math.max(30, r.height + pad * 2),
        })
      }, 120)
    })()
    return () => {
      cancelled = true
    }
  }, [open, current?.target, index])

  // ESC to close
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !steps.length) return null

  const isFirst = index === 0
  const isLast = index === steps.length - 1

  const next = () => {
    if (current?.nextHref) {
      onClose()
      router.push(current.nextHref)
      return
    }
    if (!isLast) setIndex((i) => Math.min(steps.length - 1, i + 1))
    else onClose()
  }

  const back = () => {
    if (!isFirst) setIndex((i) => Math.max(0, i - 1))
  }

  const tooltip = (() => {
    const w = 360
    const margin = 16
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800
    const b = box || { top: vh / 2 - 40, left: vw / 2 - 80, width: 160, height: 80 }

    const placeBelow = b.top + b.height + 14 < vh - 240
    const left = clamp(b.left, margin, vw - w - margin)
    const top = placeBelow ? b.top + b.height + 14 : Math.max(margin, b.top - 14)
    const transform = placeBelow ? 'none' : 'translateY(-100%)'
    return { left, top, width: w, transform }
  })()

  return (
    <div className="fixed inset-0 z-[200]" aria-modal="true" role="dialog">
      {/* Dark overlay + highlight */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.55)' }} />
      {box && (
        <div
          className="absolute rounded-2xl"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            border: '1px solid rgba(0,240,255,0.35)',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(2px)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute rounded-2xl p-4"
        style={{
          ...tooltip,
          background: 'rgba(13,16,37,0.85)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 18px 60px rgba(0,0,0,0.55)',
          transform: tooltip.transform,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] tracking-[0.22em]" style={{ color: 'var(--text-dim)', fontFamily: 'Orbitron, sans-serif' }}>
              GUIDED TOUR • {index + 1}/{steps.length}
            </p>
            <p className="text-base font-black mt-1" style={{ fontFamily: 'Orbitron, sans-serif' }}>
              {current.title}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5" aria-label="Close">
            <X className="w-4 h-4 text-gray-300" />
          </button>
        </div>

        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          {targetFound ? current.body : 'Loading this part of the UI… (if it never appears, refresh the page)'}
        </p>

        <div className="flex items-center justify-between mt-4">
          <button
            onClick={back}
            disabled={isFirst}
            className={`btn-ghost px-4 py-2 text-sm ${isFirst ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <button onClick={next} className="btn-primary px-5 py-2 text-sm">
            {current.nextLabel || (isLast ? 'Done' : 'Next')} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
