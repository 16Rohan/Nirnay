import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance: Lenis | null = null

/**
 * Initialise Lenis smooth-scroll and wire it into GSAP's ScrollTrigger ticker.
 * Call once on app mount; call lenis.destroy() on unmount.
 */
export function initLenis(): Lenis {
  // Respect reduced-motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Return a no-op stub so callers can still call .destroy()
    return { destroy: () => {} } as unknown as Lenis
  }

  lenisInstance = new Lenis({
    duration: 1.25,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
    orientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.8,
  })

  // Sync Lenis RAF with GSAP ticker for ScrollTrigger compatibility
  gsap.ticker.add((time) => {
    lenisInstance?.raf(time * 1000)
  })
  gsap.ticker.lagSmoothing(0)

  // Keep ScrollTrigger in sync with Lenis scroll position
  lenisInstance.on('scroll', ScrollTrigger.update)

  return lenisInstance
}

/** Access the running Lenis instance anywhere in the app. */
export function getLenis(): Lenis | null {
  return lenisInstance
}

/**
 * Smooth-scroll to any element or selector.
 * Falls back to native scrollIntoView if Lenis isn't running.
 */
export function scrollTo(
  target: string | HTMLElement,
  options: { offset?: number; duration?: number } = {}
): void {
  const { offset = 0, duration = 1.2 } = options

  if (lenisInstance) {
    lenisInstance.scrollTo(target as string, { offset, duration })
  } else {
    const el = typeof target === 'string' ? document.querySelector(target) : target
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
