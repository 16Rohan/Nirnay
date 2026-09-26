import { useEffect, useRef } from 'react'

interface HeroCanvasEffectsProps {
  mouseX?: number
  mouseY?: number
}

export default function HeroCanvasEffects({ mouseX = 0, mouseY = 0 }: HeroCanvasEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    let isVisible = true
    const handleVisibilityChange = () => {
      isVisible = !document.hidden
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        isVisible = entry.isIntersecting && !document.hidden
      })
    }, { threshold: 0.05 })

    if (canvas) {
      observer.observe(canvas)
    }

    // ── Particle Systems ──
    // 1. Smoke particles near explosion (around x: 0.78, y: 0.22)
    const SMOKE_COUNT = 35
    const smokeParticles = Array.from({ length: SMOKE_COUNT }, () => ({
      x: width * 0.78 + (Math.random() - 0.5) * 140,
      y: height * 0.22 + (Math.random() - 0.5) * 90,
      radius: Math.random() * 45 + 30,
      vx: Math.random() * 0.4 + 0.1,
      vy: -(Math.random() * 0.35 + 0.15),
      alpha: Math.random() * 0.18 + 0.04,
      maxAlpha: Math.random() * 0.22 + 0.08,
      growRate: Math.random() * 0.08 + 0.03,
    }))

    // 2. Fire embers floating up from destroyed plane (x: 0.76, y: 0.24)
    const EMBER_COUNT = 45
    const emberParticles = Array.from({ length: EMBER_COUNT }, () => ({
      x: width * 0.76 + (Math.random() - 0.5) * 120,
      y: height * 0.24 + (Math.random() - 0.5) * 80,
      radius: Math.random() * 2.2 + 0.8,
      vx: (Math.random() - 0.3) * 0.8,
      vy: -(Math.random() * 1.5 + 0.6),
      alpha: Math.random() * 0.8 + 0.2,
      sineOffset: Math.random() * Math.PI * 2,
    }))

    // 3. Missile tracer trail particles along line from (0.46, 0.74) to (0.44, 0.22)
    const TRAIL_COUNT = 25
    const trailParticles = Array.from({ length: TRAIL_COUNT }, (_, i) => {
      const progress = i / TRAIL_COUNT
      return {
        progress,
        speed: 0.003 + Math.random() * 0.002,
        offset: (Math.random() - 0.5) * 4,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.7 + 0.3,
      }
    })

    // Radar circle state
    let radarRadius = 0
    const maxRadarRadius = 140

    // Pulse timer for nodes
    let time = 0

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render)
        return
      }

      time += 0.02
      ctx.clearRect(0, 0, width, height)

      // Parallax shift calculation
      const px = mouseX * 15
      const py = mouseY * 10

      // Coordinates based on screen dimensions
      const launchX = width * 0.455 + px * 0.3
      const launchY = height * 0.735 + py * 0.3

      const missileX = width * 0.435 + px * 0.5
      const missileY = height * 0.215 + py * 0.5

      const hostileX = width * 0.775 + px * 0.6
      const hostileY = height * 0.215 + py * 0.6

      const uavX = width * 0.175 + px * 0.4
      const uavY = height * 0.155 + py * 0.4

      // ── 1. GEOSPATIAL TERRAIN MESH OVERLAY ──
      ctx.save()
      ctx.strokeStyle = 'rgba(66, 199, 255, 0.14)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])

      // Perspective horizon grid on lower city/terrain area
      const horizonY = height * 0.52
      const bottomY = height * 0.92
      const gridCols = 14

      for (let i = 0; i <= gridCols; i++) {
        const factor = i / gridCols
        const startX = width * (0.2 + factor * 0.65) + px * 0.2
        const endX = width * (0.05 + factor * 0.9) + px * 0.8

        ctx.beginPath()
        ctx.moveTo(startX, horizonY)
        ctx.lineTo(endX, bottomY)
        ctx.stroke()
      }

      // Horizontal perspective grid lines
      const gridRows = 7
      for (let j = 1; j <= gridRows; j++) {
        const ratio = Math.pow(j / gridRows, 1.8)
        const currentY = horizonY + (bottomY - horizonY) * ratio

        ctx.beginPath()
        ctx.moveTo(width * 0.15 + px * 0.2, currentY)
        ctx.lineTo(width * 0.92 + px * 0.7, currentY)
        ctx.stroke()
      }
      ctx.restore()

      // ── 2. EXPANDING RADAR RINGS (Around Air Defence Launcher) ──
      radarRadius = (radarRadius + 0.6) % maxRadarRadius
      ctx.save()
      for (let r = 0; r < 3; r++) {
        const currentR = (radarRadius + r * 45) % maxRadarRadius
        const alpha = Math.max(0, 1 - currentR / maxRadarRadius) * 0.35
        ctx.strokeStyle = `rgba(66, 199, 255, ${alpha})`
        ctx.lineWidth = 1.2
        ctx.beginPath()
        ctx.ellipse(launchX, launchY, currentR, currentR * 0.45, 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.restore()

      // ── 3. TACTICAL TRAJECTORY CURVES & LINES ──
      // Cyan Trajectory Arc: Launcher -> Interceptor Missile
      ctx.save()
      ctx.strokeStyle = 'rgba(66, 199, 255, 0.6)'
      ctx.lineWidth = 1.8
      ctx.setLineDash([6, 6])
      ctx.lineDashOffset = -time * 20

      ctx.beginPath()
      ctx.moveTo(launchX, launchY)
      ctx.quadraticCurveTo(width * 0.47 + px * 0.4, height * 0.45 + py * 0.4, missileX, missileY)
      ctx.stroke()

      // Red Threat Lock Arc: Interceptor Missile -> Hostile Aircraft
      ctx.strokeStyle = 'rgba(255, 89, 104, 0.65)'
      ctx.beginPath()
      ctx.moveTo(missileX, missileY)
      ctx.quadraticCurveTo(width * 0.62 + px * 0.55, height * 0.12 + py * 0.55, hostileX, hostileY)
      ctx.stroke()
      ctx.restore()

      // ── 4. MISSILE TRACER SPARKS ──
      ctx.save()
      trailParticles.forEach((p) => {
        p.progress += p.speed
        if (p.progress > 1) p.progress = 0

        const currX = launchX + (missileX - launchX) * p.progress + Math.sin(time + p.progress * 10) * p.offset
        const currY = launchY + (missileY - launchY) * p.progress

        ctx.fillStyle = `rgba(99, 230, 255, ${p.alpha * (1 - p.progress * 0.5)})`
        ctx.shadowColor = '#42C7FF'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(currX, currY, p.size, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()

      // ── 5. PULSING GEOSPATIAL NODES ──
      const nodes = [
        { x: launchX, y: launchY, label: 'BATTERY A-3', color: '#42C7FF' },
        { x: missileX, y: missileY, label: 'INT-4581', color: '#63E6FF' },
        { x: hostileX, y: hostileY, label: 'HST-7732', color: '#FF5968' },
        { x: uavX, y: uavY, label: 'UAV-01', color: '#42C7FF' },
        { x: width * 0.62 + px * 0.4, y: height * 0.65 + py * 0.4, label: 'SECTOR 4', color: 'rgba(66,199,255,0.7)' },
      ]

      ctx.save()
      nodes.forEach((n) => {
        const pulse = Math.sin(time * 3) * 3 + 6
        ctx.fillStyle = n.color
        ctx.shadowColor = n.color
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.arc(n.x, n.y, 3.5, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = n.color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(n.x, n.y, pulse, 0, Math.PI * 2)
        ctx.stroke()
      })
      ctx.restore()

      // ── 6. VOLUMETRIC SMOKE PLUME ANIMATION (Upper Right Explosion) ──
      ctx.save()
      smokeParticles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.radius += p.growRate
        p.alpha -= 0.0008

        if (p.alpha <= 0 || p.y < height * 0.05) {
          p.x = hostileX + (Math.random() - 0.5) * 80
          p.y = hostileY + (Math.random() - 0.5) * 40
          p.radius = Math.random() * 30 + 20
          p.alpha = Math.random() * 0.16 + 0.05
        }

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius)
        grad.addColorStop(0, `rgba(45, 38, 32, ${p.alpha})`)
        grad.addColorStop(0.5, `rgba(25, 20, 16, ${p.alpha * 0.6})`)
        grad.addColorStop(1, 'rgba(10, 8, 6, 0)')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()

      // ── 7. RISING FIRE EMBERS (Explosion Core) ──
      ctx.save()
      emberParticles.forEach((p) => {
        p.x += p.vx + Math.sin(time * 2 + p.sineOffset) * 0.4
        p.y += p.vy
        p.alpha -= 0.005

        if (p.alpha <= 0 || p.y < height * 0.08) {
          p.x = hostileX + (Math.random() - 0.5) * 90
          p.y = hostileY + (Math.random() - 0.5) * 30
          p.alpha = Math.random() * 0.8 + 0.2
        }

        ctx.fillStyle = `rgba(255, ${Math.floor(140 + Math.random() * 80)}, 30, ${p.alpha})`
        ctx.shadowColor = '#FF781E'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.restore()

      // ── 8. EXPLOSION CORE ATMOSPHERIC LIGHT FLICKER ──
      ctx.save()
      const flicker = Math.sin(time * 12) * 0.04 + Math.cos(time * 7) * 0.03 + 0.12
      const lightGrad = ctx.createRadialGradient(hostileX, hostileY, 10, hostileX, hostileY, 220)
      lightGrad.addColorStop(0, `rgba(255, 120, 30, ${flicker})`)
      lightGrad.addColorStop(0.4, `rgba(255, 60, 10, ${flicker * 0.4})`)
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

      ctx.fillStyle = lightGrad
      ctx.beginPath()
      ctx.arc(hostileX, hostileY, 220, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      observer.disconnect()
      cancelAnimationFrame(animationFrameId)
    }
  }, [mouseX, mouseY])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-[3]"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
