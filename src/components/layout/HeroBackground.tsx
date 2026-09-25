import HeroCanvasEffects from './HeroCanvasEffects'

interface HeroBackgroundProps {
  mouseX?: number
  mouseY?: number
}

export default function HeroBackground({ mouseX = 0, mouseY = 0 }: HeroBackgroundProps) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden select-none pointer-events-none" aria-hidden="true">

      {/* ── Layer 0: Original High-Resolution Cinematic Hero Background Image ── */}
      <div
        className="absolute inset-0 transition-transform duration-700 ease-out"
        style={{
          backgroundImage: `url('/assets/nirnay-hero-bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          transform: `scale(1.02) translate(${mouseX * -8}px, ${mouseY * -5}px)`,
        }}
      />

      {/* ── Layer 1: Minimal Top/Bottom Vignette (Preserves Natural Image Brightness & Vividness) ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(2,7,13,0.40) 0%, rgba(2,7,13,0.02) 20%, rgba(2,7,13,0.02) 70%, rgba(2,7,13,0.85) 100%)',
        }}
      />

      {/* ── Layer 2: Subtle Ambient Cyan & Sunset Golden Aura ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 15% 55%, rgba(22,140,255,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 85% 35%, rgba(255,120,30,0.05) 0%, transparent 65%)',
        }}
      />

      {/* ── Layer 3: Realtime Canvas FX (Volumetric Smoke, Fire Embers, Missile Trail, Geospatial Mesh & Radar) ── */}
      <HeroCanvasEffects mouseX={mouseX} mouseY={mouseY} />

      {/* ── Layer 4: Cinematic Micro-Grain ── */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.025] pointer-events-none z-[4]" aria-hidden="true">
        <filter id="cinematic-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#cinematic-grain)" />
      </svg>
    </div>
  )
}
