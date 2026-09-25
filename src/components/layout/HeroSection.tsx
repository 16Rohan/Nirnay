import { useState, useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import {
  ChevronRight,
  ChevronDown,
  Globe,
  Layers,
  Cloud,
  TrendingUp,
  Camera,
  Cpu,
  MapPin,
  Shield,
  BarChart2,
  ArrowRight,
  Crosshair,
  Zap,
} from 'lucide-react'
import HeroBackground from './HeroBackground'

/* ── 4 Bottom Feature Cards Specifications (ZONE F) ── */
const BOTTOM_FEATURE_CARDS = [
  {
    num: '01',
    icon: Cpu,
    title: 'AI STRATEGY AGENTS',
    desc: 'Multi-agent decision analysis',
    to: '/simulation',
  },
  {
    num: '02',
    icon: MapPin,
    title: 'REALISTIC ENVIRONMENT',
    desc: 'Terrain · Weather · Geospatial',
    to: '/scenarios',
  },
  {
    num: '03',
    icon: Shield,
    title: 'SCENARIO SIMULATION',
    desc: 'Deterministic what-if analysis',
    to: '/simulation',
  },
  {
    num: '04',
    icon: BarChart2,
    title: 'COMPARATIVE ANALYTICS',
    desc: 'Risks · Outcomes · Trade-offs',
    to: '/analytics',
  },
]

/* ── Right Floating Toolbar Items (ZONE E) ── */
const TOOLBAR_ITEMS = [
  { id: 'map', icon: Globe, label: '3D MAP' },
  { id: 'layers', icon: Layers, label: 'LAYERS' },
  { id: 'weather', icon: Cloud, label: 'WEATHER' },
  { id: 'trajectory', icon: TrendingUp, label: 'TRAJECTORY' },
  { id: 'camera', icon: Camera, label: 'CAMERA' },
]

export default function HeroSection() {
  const [activeTool, setActiveTool] = useState<string>('map')
  const sectionRef = useRef<HTMLElement>(null)

  /* Subtle Parallax Values */
  const rawMouseX = useMotionValue(0)
  const rawMouseY = useMotionValue(0)
  const [mPos, setMPos] = useState({ x: 0, y: 0 })

  const contentX = useTransform(rawMouseX, [-0.5, 0.5], [-5, 5])
  const contentY = useTransform(rawMouseY, [-0.5, 0.5], [-3, 3])

  const hudX = useTransform(rawMouseX, [-0.5, 0.5], [-8, 8])
  const hudY = useTransform(rawMouseY, [-0.5, 0.5], [-5, 5])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      rawMouseX.set(x)
      rawMouseY.set(y)
      setMPos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [rawMouseX, rawMouseY])

  const scrollToNext = () => {
    const nextSection = document.getElementById('features') || document.getElementById('decision-loop')
    nextSection?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full h-screen min-h-[800px] flex flex-col justify-between overflow-hidden bg-[#02070D] select-none"
      aria-label="NIRNAY — Agentic AI Strategic Decision Support"
    >
      {/* ── ZONE C: Fullscreen High-Resolution Clean Background Image + Realtime FX ── */}
      <HeroBackground mouseX={mPos.x} mouseY={mPos.y} />

      {/* ════════════════════════════════════════════════════════════
         ZONE D: INTELLIGENCE HUD (Spatially Positioned in Dedicated Safe Areas)
         ════════════════════════════════════════════════════════════ */}

      {/* 1. TOP-LEFT ENVIRONMENT HUD: LIVE SIMULATION & UAV-01 (Positioned ABOVE Zone B Title Safe Area) */}
      <motion.div
        style={{ x: hudX, y: hudY }}
        className="absolute top-[88px] left-[5%] z-20 hidden md:flex items-center gap-3.5 pointer-events-auto"
      >
        {/* LIVE SIMULATION Card */}
        <div
          className="px-3.5 py-2.5 rounded-lg border border-[rgba(50,180,255,0.28)] bg-[rgba(3,15,27,0.65)] backdrop-blur-md shadow-[0_0_30px_rgba(0,130,255,0.08)] transition-all duration-300 hover:border-[#42C7FF]"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#42C7FF] animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#42C7FF] -ml-4" />
            <span className="font-mono text-[10px] font-semibold tracking-wider text-[#42C7FF] uppercase">
              LIVE SIMULATION
            </span>
          </div>

          {/* Mini Sparkline Curve */}
          <div className="w-32 h-6 my-1">
            <svg viewBox="0 0 140 28" fill="none" className="w-full h-full">
              <path
                d="M0,18 L20,12 L40,22 L60,8 L80,16 L100,6 L120,20 L140,10"
                stroke="#42C7FF"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M0,18 L20,12 L40,22 L60,8 L80,16 L100,6 L120,20 L140,10 L140,28 L0,28 Z"
                fill="url(#sparkline-grad-clean)"
                opacity="0.2"
              />
              <defs>
                <linearGradient id="sparkline-grad-clean" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#42C7FF" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Telemetry Data Grid */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[9px]">
            <div>
              <span className="text-[#71869A] block">Altitude</span>
              <span className="text-white font-semibold">4,200 m</span>
            </div>
            <div>
              <span className="text-[#71869A] block">Speed</span>
              <span className="text-white font-semibold">320 m/s</span>
            </div>
            <div>
              <span className="text-[#71869A] block">Heading</span>
              <span className="text-white font-semibold">127°</span>
            </div>
            <div>
              <span className="text-[#71869A] block">Status</span>
              <span className="text-[#42C7FF] font-semibold">Engaged</span>
            </div>
          </div>
        </div>

        {/* UAV-01 Card */}
        <div
          className="px-3.5 py-2.5 rounded-lg border border-[rgba(50,180,255,0.28)] bg-[rgba(3,15,27,0.65)] backdrop-blur-md shadow-[0_0_30px_rgba(0,130,255,0.08)] transition-all duration-300 hover:border-[#42C7FF]"
        >
          <div className="relative w-24 h-12 border border-[rgba(66,199,255,0.25)] rounded flex items-center justify-center mb-1.5 overflow-hidden bg-[rgba(22,140,255,0.08)]">
            <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t border-l border-[#42C7FF]" />
            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t border-r border-[#42C7FF]" />
            <div className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b border-l border-[#42C7FF]" />
            <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b border-r border-[#42C7FF]" />

            <svg viewBox="0 0 40 20" fill="none" className="w-14 h-7 text-[#42C7FF] drop-shadow-[0_0_6px_#42C7FF]">
              <path d="M20,2 L26,10 L38,12 L32,15 L20,13 L8,15 L2,12 L14,10 Z" stroke="#42C7FF" strokeWidth="1.2" fill="rgba(66,199,255,0.15)" />
              <circle cx="20" cy="10" r="1.5" fill="#63E6FF" />
            </svg>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-[11px] font-bold text-white tracking-wider">UAV-01</span>
            <span className="font-mono text-[8px] px-1 py-0.5 rounded bg-[rgba(66,199,255,0.15)] text-[#42C7FF] border border-[rgba(66,199,255,0.3)]">
              RECON · ACTIVE
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. INTERCEPTOR MISSILE CARD (Upper-Center Sky near Missile Trajectory) */}
      <motion.div
        style={{ x: hudX, y: hudY }}
        className="absolute top-[180px] left-[39%] z-20 hidden lg:flex items-center gap-2 pointer-events-none"
      >
        <div className="px-3.5 py-2 rounded-md border border-[rgba(50,180,255,0.35)] bg-[rgba(3,15,27,0.65)] backdrop-blur-md shadow-[0_0_24px_rgba(0,130,255,0.15)]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Zap className="w-3 h-3 text-[#42C7FF]" />
            <span className="font-display text-[11px] font-bold text-white tracking-wide">INTERCEPTOR MISSILE</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[9px] text-[#A6B6C6]">
            <span>ID: <strong className="text-white">INT-4581</strong></span>
            <span>STATUS: <strong className="text-[#42C7FF]">ACTIVE</strong></span>
          </div>
        </div>
        <div className="w-10 h-px bg-gradient-to-r from-[rgba(66,199,255,0.6)] to-transparent" />
      </motion.div>

      {/* 3. HOSTILE AIRCRAFT CARD (Upper-Right Sky near Destroyed Jet) */}
      <motion.div
        style={{ x: hudX, y: hudY }}
        className="absolute top-[105px] right-[6%] z-20 hidden lg:flex flex-col items-end gap-1 pointer-events-none"
      >
        <div className="absolute -top-10 -left-14 w-24 h-24 border border-[rgba(255,89,104,0.5)] rounded-lg pointer-events-none animate-pulse">
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#FF5968]" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#FF5968]" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#FF5968]" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#FF5968]" />
        </div>

        <div className="px-3.5 py-2 rounded-md border border-[rgba(255,89,104,0.45)] bg-[rgba(30,8,12,0.75)] backdrop-blur-md shadow-[0_0_24px_rgba(255,89,104,0.3)]">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#FF5968] animate-ping" />
            <span className="font-display text-[11px] font-bold text-[#FF5968] tracking-wide uppercase">
              HOSTILE AIRCRAFT
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-[9px] text-[#A6B6C6]">
            <span>ID: <strong className="text-white">HST-7732</strong></span>
            <span>ALT: <strong className="text-white">3,800 m</strong></span>
            <span>SPD: <strong className="text-white">615 m/s</strong></span>
            <span>STATUS: <strong className="text-[#FF5968]">DESTROYED</strong></span>
          </div>
        </div>
        <div className="w-12 h-px bg-gradient-to-l from-[rgba(255,89,104,0.6)] to-transparent mr-4" />
      </motion.div>

      {/* 4. AIR DEFENCE SYSTEM CARD (Lower-Center Ground near Launcher) */}
      <motion.div
        style={{ x: hudX, y: hudY }}
        className="absolute bottom-[220px] left-[42%] z-20 hidden lg:flex items-center gap-2 pointer-events-none"
      >
        <div className="px-3.5 py-2 rounded-md border border-[rgba(50,180,255,0.35)] bg-[rgba(3,15,27,0.65)] backdrop-blur-md shadow-[0_0_24px_rgba(0,130,255,0.15)]">
          <div className="flex items-center gap-1.5 mb-0.5">
            <Crosshair className="w-3 h-3 text-[#42C7FF]" />
            <span className="font-display text-[11px] font-bold text-white tracking-wide">AIR DEFENCE SYSTEM</span>
          </div>
          <div className="flex items-center gap-2.5 font-mono text-[9px] text-[#A6B6C6]">
            <span>BATTERY: <strong className="text-white">A-3</strong></span>
            <span>STATUS: <strong className="text-[#42C7FF]">ENGAGED</strong></span>
            <span>TARGET: <strong className="text-[#FF5968]">HST-7732</strong></span>
          </div>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
         ZONE B: LEFT HERO CONTENT (Protected Safe Area for Title & CTAs)
         ════════════════════════════════════════════════════════════ */}
      <motion.div
        style={{ x: contentX, y: contentY }}
        className="absolute top-[215px] left-[5%] z-10 max-w-xl w-full pointer-events-auto"
      >
        {/* 1. Eyebrow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full mb-4
                     bg-[rgba(22,140,255,0.10)] border border-[rgba(100,190,255,0.25)]
                     backdrop-blur-md shadow-[0_0_12px_rgba(22,140,255,0.15)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#42C7FF] shadow-[0_0_6px_#42C7FF] animate-pulse" />
          <span
            className="font-mono text-[11px] font-semibold tracking-[0.16em] text-[#42C7FF] uppercase"
            style={{ WebkitTextStroke: '0.4px rgba(0,0,0,0.4)', paintOrder: 'stroke fill' }}
          >
            AGENTIC AI · STRATEGIC DECISION SUPPORT
          </span>
        </motion.div>

        {/* 2. Main Title: NIRNAY (Clean 1px Subtle Outline) */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight text-[#F5FAFF] leading-none mb-3"
          style={{
            WebkitTextStroke: '1px rgba(0,0,0,0.65)',
            paintOrder: 'stroke fill',
            textShadow: '0 0 35px rgba(66, 199, 255, 0.35), 0 0 80px rgba(22, 140, 255, 0.15)',
          }}
        >
          NIRNAY
        </motion.h1>

        {/* 3. Sub-Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-mono text-xs sm:text-sm font-semibold tracking-[0.24em] text-[#42C7FF] uppercase mb-4"
          style={{ WebkitTextStroke: '0.5px rgba(0,0,0,0.45)', paintOrder: 'stroke fill' }}
        >
          SIMULATE · CHALLENGE · EVALUATE · DECIDE
        </motion.p>

        {/* 4. Description */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="font-body text-sm sm:text-base text-[#A6B6C6] max-w-lg leading-relaxed mb-7"
          style={{
            WebkitTextStroke: '0.4px rgba(0,0,0,0.35)',
            paintOrder: 'stroke fill',
            textShadow: '0 1px 6px rgba(2,7,13,0.9)',
          }}
        >
          An agentic AI platform for exploring complex scenarios, simulating competing strategies
          and understanding risks and trade-offs before decisions are made.
        </motion.p>

        {/* 5. Primary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="flex flex-wrap items-center gap-4"
        >
          {/* Primary CTA */}
          <NavLink
            to="/simulation"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                       bg-gradient-to-r from-[#168CFF] via-[#249DFF] to-[#42C7FF]
                       text-white font-display text-xs sm:text-sm font-bold tracking-wider uppercase
                       shadow-[0_0_24px_rgba(22,140,255,0.45)]
                       hover:shadow-[0_0_36px_rgba(66,199,255,0.65)] hover:-translate-y-0.5
                       transition-all duration-300 group"
          >
            <span>START SCENARIO</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white" />
          </NavLink>

          {/* Secondary CTA */}
          <NavLink
            to="/scenarios"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg
                       bg-[rgba(3,15,27,0.58)] border border-[rgba(50,180,255,0.28)]
                       text-white font-display text-xs sm:text-sm font-semibold tracking-wider uppercase
                       backdrop-blur-md
                       hover:border-[#42C7FF] hover:bg-[rgba(22,140,255,0.12)]
                       hover:shadow-[0_0_20px_rgba(66,199,255,0.3)] hover:-translate-y-0.5
                       transition-all duration-300"
          >
            <span>EXPLORE SIMULATION</span>
          </NavLink>
        </motion.div>
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
         ZONE E: RIGHT CONTROL TOOLBAR (Extreme Right Safe Area)
         ════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 z-30 hidden sm:flex flex-col gap-2 p-2 rounded-xl
                   bg-[rgba(3,15,27,0.65)] border border-[rgba(50,180,255,0.28)] backdrop-blur-md
                   shadow-[0_8px_32px_rgba(0,0,0,0.6)]"
      >
        {TOOLBAR_ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = activeTool === id
          return (
            <button
              key={id}
              onClick={() => setActiveTool(id)}
              className={`relative flex flex-col items-center justify-center w-14 h-12 py-2 px-1 rounded-lg
                         transition-all duration-200 group ${
                           isActive
                             ? 'bg-[rgba(22,140,255,0.22)] border border-[rgba(66,199,255,0.4)] text-[#42C7FF] shadow-[0_0_12px_rgba(66,199,255,0.25)]'
                             : 'text-[#71869A] hover:text-white hover:bg-[rgba(22,140,255,0.08)]'
                         }`}
              aria-label={label}
            >
              <Icon className="w-4 h-4 mb-1 transition-transform group-hover:scale-110" />
              <span className="font-mono text-[8px] font-semibold tracking-wider text-center leading-none">
                {label}
              </span>
              {isActive && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#42C7FF] rounded-l-full shadow-[0_0_8px_#42C7FF]" />
              )}
            </button>
          )
        })}
      </motion.div>

      {/* ════════════════════════════════════════════════════════════
         ZONE F: BOTTOM FEATURE CARDS SYSTEM (Coherent Horizontal Grid)
         ════════════════════════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-5 left-[5%] right-[5%] z-20 pointer-events-auto"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1500px] mx-auto">
          {BOTTOM_FEATURE_CARDS.map(({ num, icon: Icon, title, desc, to }) => (
            <NavLink
              key={num}
              to={to}
              className="group relative flex items-center justify-between p-4 rounded-xl
                         bg-[rgba(3,15,27,0.65)] border border-[rgba(50,180,255,0.28)]
                         backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.5)]
                         hover:bg-[rgba(8,21,33,0.85)] hover:border-[rgba(66,199,255,0.45)]
                         hover:shadow-[0_8px_36px_rgba(0,0,0,0.6),0_0_20px_rgba(22,140,255,0.2)]
                         hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start gap-3 min-w-0">
                {/* Icon Box */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                             bg-[rgba(22,140,255,0.12)] border border-[rgba(100,190,255,0.2)]
                             group-hover:border-[rgba(66,199,255,0.5)] group-hover:bg-[rgba(22,140,255,0.22)]
                             transition-all duration-300"
                >
                  <Icon className="w-4 h-4 text-[#42C7FF] drop-shadow-[0_0_6px_rgba(66,199,255,0.5)]" />
                </div>

                {/* Text Details */}
                <div className="min-w-0">
                  <span className="font-mono text-[9px] font-semibold text-[#42C7FF]/70 block mb-0.5">
                    {num}
                  </span>
                  <h3 className="font-display font-bold text-xs sm:text-sm text-white group-hover:text-[#42C7FF] transition-colors truncate">
                    {title}
                  </h3>
                  <p className="font-body text-[11px] text-[#71869A] group-hover:text-[#A6B6C6] transition-colors truncate">
                    {desc}
                  </p>
                </div>
              </div>

              {/* Circle Arrow Action Button */}
              <div
                className="w-6 h-6 rounded-full border border-[rgba(100,190,255,0.25)] flex items-center justify-center flex-shrink-0 ml-2
                           group-hover:border-[#42C7FF] group-hover:bg-[#42C7FF] group-hover:text-[#02070D] text-[#42C7FF]
                           transition-all duration-300 shadow-[0_0_8px_rgba(66,199,255,0.2)]"
              >
                <ArrowRight className="w-3 h-3" />
              </div>
            </NavLink>
          ))}
        </div>
      </motion.div>

      {/* Scroll Down Indicator */}
      <button
        onClick={scrollToNext}
        className="absolute bottom-1 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Scroll to content"
      >
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-4 h-4 text-[#42C7FF]" />
        </motion.div>
      </button>
    </section>
  )
}
