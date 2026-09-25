import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Stagger fade-up animation for a set of elements triggered on scroll.
 * @param selector  CSS selector or NodeList of elements to animate
 * @param trigger   The ScrollTrigger anchor element (usually the parent section)
 */
export function staggerFadeUp(
  selector: string | NodeListOf<Element>,
  trigger: Element,
  options: { delay?: number; stagger?: number; y?: number } = {}
) {
  const { delay = 0, stagger = 0.1, y = 30 } = options

  gsap.fromTo(
    selector,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration: 0.85,
      ease: 'expo.out',
      stagger,
      delay,
      scrollTrigger: {
        trigger,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    }
  )
}

/**
 * Pin a section and scrub an animation to scroll progress.
 */
export function createScrollScrub(
  trigger: Element,
  animation: gsap.core.Tween | gsap.core.Timeline,
  scrubAmount = 1
) {
  return ScrollTrigger.create({
    trigger,
    start: 'top center',
    end: 'bottom center',
    scrub: scrubAmount,
    animation,
  })
}

/**
 * Animate a counter from 0 to target value when it enters the viewport.
 */
export function animateCounter(
  element: HTMLElement,
  target: number,
  suffix = '',
  duration = 2
) {
  const obj = { value: 0 }
  return gsap.to(obj, {
    value: target,
    duration,
    ease: 'power2.out',
    roundProps: 'value',
    onUpdate: () => {
      element.textContent = obj.value.toLocaleString() + suffix
    },
    scrollTrigger: {
      trigger: element,
      start: 'top 85%',
      toggleActions: 'play none none none',
    },
  })
}

/**
 * Apply a parallax drift to any element relative to scroll.
 * @param element Target element
 * @param speed   0 = pinned, 1 = normal scroll, -1 = reverse
 */
export function applyParallax(element: Element, speed = 0.3) {
  return gsap.to(element, {
    yPercent: speed * 40,
    ease: 'none',
    scrollTrigger: {
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
    },
  })
}

/**
 * Horizontal reveal from behind a clip mask — good for section titles.
 */
export function clipReveal(element: Element, options: { delay?: number } = {}) {
  return gsap.fromTo(
    element,
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      duration: 1.1,
      ease: 'expo.inOut',
      delay: options.delay ?? 0,
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    }
  )
}
