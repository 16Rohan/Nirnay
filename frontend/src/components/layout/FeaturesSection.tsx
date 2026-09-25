import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Upload, Cpu, Swords, BarChart3,
  CheckCircle, ChevronDown, Activity
} from 'lucide-react'

const LOOP_STEPS = [
  {
    id: '01',
    icon: Upload,
    title: 'CREATE SCENARIO',
    desc: 'Define theatre, objectives, order-of-battle, constraints and environmental parameters.',
    color: 'blue',
  },
  {
    id: '02',
    icon: Activity,
    title: 'ENVIRONMENT AGENT',
    desc: 'Models terrain, weather, logistics and geospatial conditions with physical accuracy.',
    color: 'blue',
  },
  {
    id: '03',
    icon: Cpu,
    title: 'BLUE STRATEGY AGENT',
    desc: 'Generates and evaluates friendly courses of action against mission objectives.',
    color: 'blue',
  },
  {
    id: '04',
    icon: Swords,
    title: 'RED ADVERSARY AGENT',
    desc: 'Stress-tests every COA with adversarial counter-play to expose weaknesses.',
    color: 'red',
  },
  {
    id: '05',
    icon: BarChart3,
    title: 'SIMULATION AGENT',
    desc: 'Runs deterministic what-if analysis across thousands of scenario branches.',
    color: 'blue',
  },
  {
    id: '06',
    icon: Activity,
    title: 'RISK ANALYSIS',
    desc: 'Scores outcomes against risk tolerance, resource constraints and doctrine.',
    color: 'amber',
  },
  {
    id: '07',
    icon: CheckCircle,
    title: 'HUMAN DECISION',
    desc: 'Commander receives ranked recommendations with full confidence chain.',
    color: 'green',
  },
]

const colorMap = {
  blue:  { border: 'rgba(66,199,255,0.30)',  icon: 'icon-blue',  dot: 'status-active', label: 'rgba(66,199,255,0.55)'  },
  red:   { border: 'rgba(255,89,104,0.30)',  icon: 'icon-red',   dot: 'status-threat', label: 'rgba(255,89,104,0.55)'  },
  amber: { border: 'rgba(255,179,71,0.30)',  icon: 'icon-amber', dot: 'status-warn',   label: 'rgba(255,179,71,0.55)'  },
  green: { border: 'rgba(66,217,154,0.30)',  icon: 'icon-green', dot: 'status-live',   label: 'rgba(66,217,154,0.55)'  },
}

export default function FeaturesSection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      id="decision-loop"
      className="relative py-28 lg:py-36"
      style={{ background: 'linear-gradient(to bottom, #02070D 0%, #06111C 50%, #02070D 100%)' }}
    >
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full
                        bg-blue-primary/5 blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[rgba(66,199,255,0.4)]" />
            <span className="t-eyebrow text-blue-light">THE DECISION LOOP</span>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[rgba(66,199,255,0.4)]" />
          </div>
          <h2 className="t-section text-text-primary mb-4">
            How NIRNAY Thinks
          </h2>
          <p className="t-body text-text-muted max-w-xl mx-auto">
            A structured, multi-agent AI pipeline that moves from raw scenario data
            to command-ready decisions in a single continuous loop.
          </p>
        </motion.div>

        {/* Vertical step flow */}
        <div ref={ref} className="relative">
          {/* Central connector line */}
          <div className="absolute left-[28px] lg:left-1/2 top-0 bottom-0 w-px
                          bg-gradient-to-b from-transparent via-[rgba(22,140,255,0.3)] to-transparent" />

          <div className="flex flex-col gap-0">
            {LOOP_STEPS.map((step, i) => {
              const c = colorMap[step.color as keyof typeof colorMap]
              const isRight = i % 2 === 1

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: isRight ? 30 : -30 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.65, delay: i * 0.1, ease: [0.19, 1, 0.22, 1] }}
                  className={`flex items-center gap-6 lg:gap-8 relative pb-0
                    ${isRight ? 'lg:flex-row-reverse lg:text-right' : 'lg:flex-row'}`}
                >
                  {/* Spacer for alternating layout on desktop */}
                  <div className="hidden lg:block flex-1" />

                  {/* Center node */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(4,15,26,0.8)',
                        border: `1px solid ${c.border}`,
                        boxShadow: `0 0 16px ${c.border}`,
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <step.icon className={`w-5 h-5 ${c.icon}`} strokeWidth={1.5} />
                    </div>
                    {/* Connector arrow */}
                    {i < LOOP_STEPS.length - 1 && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 pt-1">
                        <ChevronDown
                          className="w-3.5 h-3.5"
                          style={{ color: c.label }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Content card */}
                  <div className="flex-1 py-4 lg:py-5">
                    <div
                      className="glass-card p-5 group"
                      style={{ borderColor: `${c.border}` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`status-dot ${c.dot} flex-shrink-0`} />
                        <span className="t-eyebrow" style={{ color: c.label, fontSize: '9px' }}>
                          {step.id}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-text-primary text-sm tracking-wide mb-1.5">
                        {step.title}
                      </h3>
                      <p className="t-body-sm text-text-muted">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="divider mt-24 mx-8 lg:mx-24" />
    </section>
  )
}
