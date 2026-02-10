'use client'

import { useEffect, useRef } from 'react'

export default function AdBanner() {
  const containerRef = useRef<HTMLDivElement>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current || !containerRef.current) return
    loaded.current = true

    const iframe = document.createElement('iframe')
    iframe.setAttribute('data-aa', '2427041')
    iframe.src = '//acceptable.a-ads.com/2427041/?size=Adaptive'
    iframe.style.cssText = 'border:0; padding:0; width:100%; height:auto; overflow:hidden; display:block;'

    containerRef.current.appendChild(iframe)
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full flex justify-center"
      style={{
        maxWidth: '728px',
        margin: '0 auto',
        padding: '8px 16px',
        zIndex: 99998,
        position: 'relative',
      }}
    />
  )
}
