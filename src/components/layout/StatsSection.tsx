import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { ChevronRight, TrendingUp, AlertTriangle, Package, Clock, Star } from 'lucide-react'

const STRATEGIES = [
  {
    id: 'A',
    label: 'STRATEGY ALPHA',
    subtitle: 'Air-Defence Suppression + Flanking Assault',
    color: '#42C7FF',
    borderColor: 'rgba(66,199,255,0.28)',
    bg: 'rgba(22,140,255,0.05)',
    metrics: [
      { icon: Star,          label: 'Outcome',     value: 'HIGH',  raw: 82, color: '#42D99A', suffix: '%' },
      { icon: AlertTriangle, label: 'Risk',         value: 'MED',   raw: 44, color: '#FFB347', suffix: '%' },
      { icon: Package,       label: 'Resources',    value: 'HIGH',  raw: 76, color: '#42C7FF', suffix: '%' },
      { icon: Clock,         label: 'Time',         value: '14 hr', raw: 58, color: '#A6B6C6', suffix: '' },
      { icon: TrendingUp,    label: 'Confidence',   value: '82%',   raw: 82, color: '#42D99A', suffix: '%' },
    ],
    recommended: true,
  },
  {
    id: 'B',
    label: 'STRATEGY BRAVO',
    subtitle: 'Defensive Hold + Electronic Warfare',
    color: '#A6B6C6',
    borderColor: 'rgba(100,190,255,0.15)',
    bg: 'rgba(4,15,26,0.55)',
    metrics: [
      { icon: Star,          label: 'Outcome',     value: 'MED',   raw: 61, color: '#FFB347', suffix: '%' },
      { icon: AlertTriangle, label: 'Risk',         value: 'LOW',   raw: 28, color: '#42D99A', suffix: '%' },
      { icon: Package,       label: 'Resources',    value: 'MED',   raw: 48, color: '#42C7FF', suffix: '%' },
      { icon: Clock,         label: 'Time',         value: '22 hr', raw: 88, color: '#A6B6C6', suffix: '' },
      { icon: TrendingUp,    label: 'Confidence',   value: '61%',   raw: 61, color: '#FFB347', suffix: '%' },
    ],
    recommended: false,
  },
  {
    id: 'C',
    label: 'STRATEGY CHARLIE',
    subtitle: 'Rapid Extraction + Strategic Retreat',
    color: '#FF5968',
    borderColor: 'rgba(255,89,104,0.22)',
    bg: 'rgba(255,89,104,0.03)',
    metrics: [
      { icon: Star,          label: 'Outcome',     value: 'LOW',   raw: 35, color: '#FF5968', suffix: '%' },
      { icon: AlertTriangle, label: 'Risk',         value: 'HIGH',  raw: 78, color: '#FF5968', suffix: '%' },
      { icon: Package,       label: 'Resources',    value: 'LOW',   raw: 22, color: '#42C7FF', suffix: '%' },
      { icon: Clock,         label: 'Time',         value: '6 hr',  raw: 24, color: '#A6B6C6', suffix: '' },
      { icon: TrendingUp,    label: 'Confidence',   value: '35%',   raw: 35, color: '#FF5968', suffix: '%' },
    ],
    recommended: false,
  },
]

export default function StatsSection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      id="simulate"
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #02070D 0%, #0A1929 40%, #06111C 100%)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(22,140,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(22,140,255,0.04) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="mb-14"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[rgba(66,199,255,0.4)]" />
            <span className="t-eyebrow text-blue-light">WHAT-IF ANALYSIS</span>
          </div>
          <h2 className="t-section text-text-primary mb-4 max-w-xl">
            Simulate the Possibilities
          </h2>
          <p className="t-body text-text-muted max-w-2xl">
            Each strategy is stress-tested across thousands of scenario branches.
            Compare outcomes before committing to a course of action.
          </p>
        </motion.div>

        {/* Strategy cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STRATEGIES.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.19, 1, 0.22, 1] }}
              className="relative flex flex-col"
              style={{
                background: s.bg,
                border: `1px solid ${s.borderColor}`,
                borderRadius: '12px',
                backdropFilter: 'blur(16px)',
                padding: '1.5rem',
              }}
            >
              {/* Recommended badge */}
              {s.recommended && (
                <div className="absolute -top-3 left-5">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                    style={{
                      background: 'rgba(66,199,255,0.15)',
                      border: '1px solid rgba(66,199,255,0.35)',
                    }}
                  >
                    <span className="status-dot status-active" />
                    <span className="t-label text-[9px] text-blue-light">RECOMMENDED</span>
                  </div>
                </div>
              )}

              {/* Strategy header */}
              <div className="mb-5 mt-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="font-display font-bold text-2xl"
                    style={{ color: s.color }}
                  >
                    {s.id}
                  </span>
                  <div className="h-px flex-1" style={{ background: `${s.borderColor}` }} />
                </div>
                <div className="font-display font-semibold text-text-primary text-sm tracking-wide mb-1">
                  {s.label}
                </div>
                <div className="t-body-sm text-text-muted text-xs">{s.subtitle}</div>
              </div>

              {/* Metrics */}
              <div className="flex flex-col gap-3 flex-1">
                {s.metrics.map(({ icon: Icon, label, value, raw, color }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3 h-3" style={{ color }} strokeWidth={1.5} />
                        <span className="t-label text-[10px]">{label}</span>
                      </div>
                      <span className="font-mono text-xs font-medium" style={{ color }}>{value}</span>
                    </div>
                    {raw > 0 && (
                      <div className="metric-bar-track">
                        <motion.div
                          className="metric-bar-fill"
                          style={{ background: color, width: '0%' }}
                          animate={inView ? { width: `${raw}%` } : {}}
                          transition={{ duration: 1.2, delay: 0.4 + i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-5 pt-4"
                style={{ borderTop: `1px solid ${s.borderColor}` }}>
                <NavLink
                  to="/simulation"
                  className="flex items-center justify-between w-full group"
                >
                  <span className="t-label text-[10px] text-text-muted group-hover:text-text-primary transition-colors">
                    RUN SIMULATION →
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-text-muted group-hover:text-blue-light transition-colors" />
                </NavLink>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="divider mt-24 mx-8 lg:mx-24" />
    </section>
  )
}
