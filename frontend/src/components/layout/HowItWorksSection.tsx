import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Globe2, Cpu, Swords, Activity, AlertTriangle, Users, Brain
} from 'lucide-react'

const AGENTS = [
  {
    icon: Globe2,
    name: 'Environment Agent',
    desc: 'Terrain, weather, logistics, geospatial modelling',
    status: 'ACTIVE',
    color: 'blue',
  },
  {
    icon: Cpu,
    name: 'Blue Strategy Agent',
    desc: 'Friendly COA generation and optimization',
    status: 'ACTIVE',
    color: 'blue',
  },
  {
    icon: Swords,
    name: 'Red Adversary Agent',
    desc: 'Adversarial counter-play and stress testing',
    status: 'ACTIVE',
    color: 'red',
  },
  {
    icon: Activity,
    name: 'Simulation Agent',
    desc: 'Deterministic scenario branch execution',
    status: 'ACTIVE',
    color: 'blue',
  },
  {
    icon: AlertTriangle,
    name: 'Risk Analyst',
    desc: 'Outcome scoring, risk matrices, confidence',
    status: 'ACTIVE',
    color: 'amber',
  },
  {
    icon: Brain,
    name: 'Assessment Agent',
    desc: 'Doctrine alignment and performance scoring',
    status: 'STANDBY',
    color: 'blue',
  },
  {
    icon: Users,
    name: 'Advisor',
    desc: 'Final ranked decision recommendations',
    status: 'ACTIVE',
    color: 'green',
  },
]

const colorMap = {
  blue:  { dot: 'status-active',  icon: 'icon-blue',  border: 'rgba(66,199,255,0.22)',  bg: 'rgba(22,140,255,0.06)'  },
  red:   { dot: 'status-threat',  icon: 'icon-red',   border: 'rgba(255,89,104,0.22)',  bg: 'rgba(255,89,104,0.04)'  },
  amber: { dot: 'status-warn',    icon: 'icon-amber', border: 'rgba(255,179,71,0.22)',  bg: 'rgba(255,179,71,0.04)'  },
  green: { dot: 'status-live',    icon: 'icon-green', border: 'rgba(66,217,154,0.22)',  bg: 'rgba(66,217,154,0.04)'  },
}

export default function HowItWorksSection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      id="from-scenario"
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #02070D 0%, #0A1929 40%, #06111C 100%)' }}
    >
      {/* grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(22,140,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(22,140,255,0.04) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      {/* ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full
                      bg-blue-primary/4 blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="mb-14 lg:mb-18"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[rgba(66,199,255,0.4)]" />
            <span className="t-eyebrow text-blue-light">AI ORCHESTRATION</span>
          </div>
          <h2 className="t-section text-text-primary mb-4 max-w-xl">
            From Scenario to Decision
          </h2>
          <p className="t-body text-text-muted max-w-2xl">
            Seven specialised agents operate in a coordinated pipeline. Each agent handles
            a distinct cognitive domain — together they form a complete AI decision cycle.
          </p>
        </motion.div>

        {/* Agent grid */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {AGENTS.map((agent, i) => {
            const c = colorMap[agent.color as keyof typeof colorMap]
            return (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.6, delay: i * 0.08, ease: [0.19, 1, 0.22, 1] }}
                className="relative group"
                style={{
                  background: `linear-gradient(135deg, ${c.bg} 0%, rgba(4,15,26,0.55) 100%)`,
                  border: `1px solid ${c.border}`,
                  borderRadius: '10px',
                  backdropFilter: 'blur(16px)',
                  transition: 'all 0.3s cubic-bezier(0.19,1,0.22,1)',
                  padding: '1.25rem',
                }}
              >
                {/* Status badge */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                  <span className={`status-dot ${c.dot} ${agent.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
                  <span className="t-label" style={{ fontSize: '8px' }}>{agent.status}</span>
                </div>

                {/* Icon */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3
                             group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `${c.bg}`, border: `1px solid ${c.border}` }}
                >
                  <agent.icon className={`w-4 h-4 ${c.icon}`} strokeWidth={1.5} />
                </div>

                {/* Text */}
                <h3 className="font-display font-semibold text-text-primary text-sm mb-1.5 pr-8">
                  {agent.name}
                </h3>
                <p className="t-body-sm text-text-muted text-xs leading-relaxed">{agent.desc}</p>

                {/* hover bottom accent */}
                <div
                  className="absolute bottom-0 left-4 right-4 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{ background: `linear-gradient(90deg, transparent, ${c.border}, transparent)` }}
                />
              </motion.div>
            )
          })}
        </div>

        {/* Connected flow label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center justify-center gap-4 mt-12"
        >
          <div className="h-px flex-1 max-w-[200px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(22,140,255,0.3))' }} />
          <span className="t-eyebrow text-text-muted">AGENTS COORDINATE IN REAL TIME</span>
          <div className="h-px flex-1 max-w-[200px]"
            style={{ background: 'linear-gradient(90deg, rgba(22,140,255,0.3), transparent)' }} />
        </motion.div>
      </div>

      <div className="divider mt-24 mx-8 lg:mx-24" />
    </section>
  )
}
