import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

export default function FinalCTASection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="cta"
      className="relative py-32 lg:py-44 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #02070D 0%, #06111C 40%, #02070D 100%)' }}
    >
      {/* Cinematic background treatment */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Wide atmospheric glow */}
        <div className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 90% 60% at 50% 55%, rgba(22,140,255,0.07) 0%, transparent 70%)',
          }} />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(22,140,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(22,140,255,0.04) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }} />
      </div>

      <div ref={ref} className="max-w-5xl mx-auto px-6 lg:px-10 text-center relative z-10">

        {/* Top eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="h-px w-16"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(66,199,255,0.35))' }} />
          <span className="t-eyebrow text-blue-light">STRATEGIC AI PLATFORM</span>
          <div className="h-px w-16"
            style={{ background: 'linear-gradient(90deg, rgba(66,199,255,0.35), transparent)' }} />
        </motion.div>

        {/* Main headline */}
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.08, ease: [0.19, 1, 0.22, 1] }}
          className="t-section text-text-primary mb-6 max-w-3xl mx-auto"
          style={{ lineHeight: '1.12' }}
        >
          Decisions should be tested{' '}
          <span
            style={{
              background: 'linear-gradient(90deg, #42C7FF 0%, #168CFF 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            before they are made.
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.16, ease: [0.19, 1, 0.22, 1] }}
          className="t-body text-text-muted max-w-xl mx-auto mb-12 text-lg"
        >
          Explore scenarios. Challenge strategies. Understand the trade-offs.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.24, ease: [0.19, 1, 0.22, 1] }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <NavLink
            to="/simulation"
            className="btn-primary text-sm px-8 py-3.5"
            style={{ fontSize: '0.9375rem', letterSpacing: '0.1em' }}
          >
            <span>LAUNCH NIRNAY</span>
            <ChevronRight className="w-4 h-4" />
          </NavLink>
          <NavLink to="/scenarios" className="btn-secondary text-sm px-8 py-3.5">
            <span>BROWSE SCENARIOS</span>
          </NavLink>
        </motion.div>

        {/* Tagline strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {['SIMULATE', 'CHALLENGE', 'EVALUATE', 'DECIDE'].map((word, i, arr) => (
            <span key={word} className="flex items-center gap-3">
              <span
                className="font-display font-semibold tracking-[0.18em] text-sm"
                style={{ color: 'rgba(66,199,255,0.55)' }}
              >
                {word}
              </span>
              {i < arr.length - 1 && (
                <span className="w-1 h-1 rounded-full bg-[rgba(66,199,255,0.25)]" />
              )}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
