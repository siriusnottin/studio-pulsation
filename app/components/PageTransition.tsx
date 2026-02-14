"use client"

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const overlayRef = useRef<HTMLDivElement | null>(null)
  // contentRef removed to avoid animating content (prevents flicker)

  useEffect(() => {
    if (!overlayRef.current) return
    const el = overlayRef.current
    const tl = gsap.timeline()

    // start with overlay off-screen above
    gsap.set(el, { yPercent: -100, display: 'block' })

    // cover: slide overlay down to cover the page
    tl.to(el, { yPercent: 0, duration: 0.45, ease: 'power2.in' })

    // reveal: slide overlay up to uncover the page
    tl.to(el, { yPercent: -100, duration: 0.55, ease: 'power2.out', delay: 0.08 })

    return () => {
      tl.kill()
    }
  }, [pathname])

  return (
    <>
      <div
        ref={overlayRef}
        aria-hidden
        className="fixed inset-0 bg-white z-50 pointer-events-none"
        style={{ transform: 'translate3d(0, -100%, 0)' }}
      />
      <div>{children}</div>
    </>
  )
}
