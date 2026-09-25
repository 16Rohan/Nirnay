import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const METRICS = [
  {
    category: 'Mission Success',
    rows: [
      { label: 'Strategy Alpha', value: 82, color: '#42D99A',  text: '82%' },
      { label: 'Strategy Bravo', value: 61, color: '#FFB347',  text: '61%' },
      { label: 'Strategy Charlie',value: 35, color: '#FF5968', text: '35%' },
    ],
  },
  {
    category: 'Risk Level',
    rows: [
      { label: 'Strategy Alpha', value: 44, color: '#FFB347',  text: 'MEDIUM' },
      { label: 'Strategy Bravo', value: 28, color: '#42D99A',  text: 'LOW' },
      { label: 'Strategy Charlie',value: 78, color: '#FF5968', text: 'HIGH' },
    ],
  },
  {
    category: 'Resource Usage',
    rows: [
      { label: 'Strategy Alpha', value: 76, color: '#42C7FF',  text: '76%' },
      { label: 'Strategy Bravo', value: 48, color: '#42C7FF',  text: '48%' },
      { label: 'Strategy Charlie',value: 22, color: '#42C7FF', text: '22%' },
    ],
  },
  {
    category: 'Confidence',
    rows: [
      { label: 'Strategy Alpha', value: 82, color: '#42D99A',  text: 'HIGH' },
      { label: 'Strategy Bravo', value: 61, color: '#FFB347',  text: 'MED' },
      { label: 'Strategy Charlie',value: 35, color: '#FF5968', text: 'LOW' },
    ],
  },
]

const SUMMARY_STATS = [
  { value: '98%', label: 'Detection Accuracy',   sub: 'Across 1,200+ simulations' },
  { value: '340ms', label: 'Decision Latency',   sub: 'Sensor input to COA output' },
  { value: '12',  label: 'Concurrent Agents',    sub: 'Running per scenario' },
  { value: '4.7K', label: 'Scenarios Executed',  sub: 'Live and training exercises' },
]

export default function AnalyticsSection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      id="analytics"
      className="relative py-28 lg:py-36"
      style={{ background: 'linear-gradient(to bottom, #02070D 0%, #06111C 50%, #02070D 100%)' }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-0 w-[500px] h-[400px] rounded-full
                        bg-blue-primary/4 blur-[130px]" />
      </div>

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
            <span className="t-eyebrow text-blue-light">COMPARATIVE ANALYSIS</span>
          </div>
          <h2 className="t-section text-text-primary mb-4 max-w-xl">
            Compare the Outcomes
          </h2>
          <p className="t-body text-text-muted max-w-xl">
            Side-by-side outcome analysis across every simulated strategy.
            Data-driven clarity before the point of commitment.
          </p>
        </motion.div>

        {/* Comparison table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-14">
          {METRICS.map((m, mi) => (
            <motion.div
              key={m.category}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: mi * 0.08, ease: [0.19, 1, 0.22, 1] }}
              style={{
                background: 'rgba(4,15,26,0.55)',
                border: '1px solid rgba(100,190,255,0.12)',
                borderRadius: '10px',
                backdropFilter: 'blur(16px)',
                padding: '1.25rem 1.5rem',
              }}
            >
              <div className="t-label text-[10px] text-blue-light mb-4 pb-2"
                style={{ borderBottom: '1px solid rgba(100,190,255,0.08)' }}>
                {m.category.toUpperCase()}
              </div>
              <div className="flex flex-col gap-4">
                {m.rows.map(({ label, value, color, text }, ri) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="t-label text-[10px]">{label}</span>
                      <span className="font-mono text-xs font-semibold" style={{ color }}>{text}</span>
                    </div>
                    <div className="metric-bar-track">
                      <motion.div
                        className="metric-bar-fill"
                        style={{ background: color, width: '0%' }}
                        animate={inView ? { width: `${value}%` } : {}}
                        transition={{ duration: 1.1, delay: 0.3 + mi * 0.08 + ri * 0.06, ease: [0.19,1,0.22,1] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Summary stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.19, 1, 0.22, 1] }}
          style={{
            background: 'rgba(4,15,26,0.55)',
            border: '1px solid rgba(100,190,255,0.12)',
            borderRadius: '10px',
            backdropFilter: 'blur(16px)',
          }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {SUMMARY_STATS.map(({ value, label, sub }, i) => (
              <div
                key={label}
                className="px-8 py-6 text-center"
                style={{
                  borderRight: i < SUMMARY_STATS.length - 1 ? '1px solid rgba(100,190,255,0.08)' : 'none',
                  borderTop: i > 1 ? '1px solid rgba(100,190,255,0.08)' : 'none',
                }}
              >
                <div
                  className="font-display font-bold text-text-primary mb-1"
                  style={{ fontSize: 'clamp(1.75rem,3.5vw,2.5rem)' }}
                >
                  {value}
                </div>
                <div className="font-display font-semibold text-text-secondary text-xs tracking-wide mb-1 uppercase">
                  {label}
                </div>
                <div className="t-label text-[9px] text-text-muted">{sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="divider mt-24 mx-8 lg:mx-24" />
    </section>
  )
}
