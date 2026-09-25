import { Suspense, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import TerrainMesh from '../three/TerrainMesh'
import { Thermometer, Eye, Wind, Mountain, Layers, MapPin } from 'lucide-react'

const ENV_STATS = [
  { icon: Thermometer, label: 'Temperature', value: '–4°C'    },
  { icon: Eye,         label: 'Visibility',  value: '12.4 km' },
  { icon: Wind,        label: 'Wind Speed',  value: '18 kt'   },
  { icon: Mountain,    label: 'Elevation',   value: '2,340 m' },
  { icon: Layers,      label: 'Terrain',     value: 'Alpine'  },
  { icon: MapPin,      label: 'Grid Ref',    value: '37T NK'  },
]

export default function CapabilitiesSection() {
  const ref    = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      id="geospatial"
      className="relative py-28 lg:py-36 overflow-hidden"
      style={{ background: 'linear-gradient(to bottom, #02070D 0%, #06111C 60%, #02070D 100%)' }}
    >
      {/* ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px]
                        rounded-full bg-blue-primary/4 blur-[140px]" />
      </div>

      <div ref={ref} className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.19, 1, 0.22, 1] }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[rgba(66,199,255,0.4)]" />
            <span className="t-eyebrow text-blue-light">GEOSPATIAL INTELLIGENCE</span>
          </div>
          <h2 className="t-section text-text-primary mb-4 max-w-xl">
            Tactical Terrain Visualization
          </h2>
          <p className="t-body text-text-muted max-w-2xl">
            High-fidelity terrain rendering with live agent positions, trajectory overlays
            and radar coverage — all composited into one actionable intelligence layer.
          </p>
        </motion.div>

        {/* Main 3-col layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

          {/* ── 3D canvas (spans 2 cols) ── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
            className="lg:col-span-2 overflow-hidden"
            style={{
              background: 'rgba(2,7,13,0.75)',
              border: '1px solid rgba(100,190,255,0.15)',
              borderRadius: '12px',
              height: '440px',
            }}
          >
            {/* Top HUD bar */}
            <div
              className="flex items-center justify-between px-5 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(100,190,255,0.10)' }}
            >
              <div className="flex items-center gap-2">
                <span className="status-dot status-live animate-pulse" />
                <span className="t-label text-[10px]">LIVE TACTICAL FEED</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="t-label text-[10px] text-blue-light">ALPINE INTERCEPT — SCENARIO A</span>
                <span className="font-mono text-[10px] text-text-muted">T+00:04:32</span>
              </div>
            </div>

            {/* 3D Scene */}
            <div style={{ height: 'calc(100% - 44px)', position: 'relative' }}>
              <Canvas
                camera={{ position: [0, 3.2, 5.8], fov: 40 }}
                gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
                style={{ background: 'transparent', width: '100%', height: '100%' }}
                dpr={[1, 1.4]}
              >
                <ambientLight intensity={0.25} />
                <pointLight position={[3, 5, 3]}   intensity={1.0} color="#42C7FF" />
                <pointLight position={[-2, -1, 2]} intensity={0.4} color="#168CFF" />
                <Suspense fallback={null}>
                  <TerrainMesh />
                </Suspense>
              </Canvas>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 flex items-center gap-5">
                {[
                  { color: '#42C7FF', label: 'Friendly' },
                  { color: '#FF5968', label: 'Threat' },
                  { color: '#42D99A', label: 'Objective' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full"
                      style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                    <span className="t-label text-[9px]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── Info panels ── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.19, 1, 0.22, 1] }}
            className="flex flex-col gap-3"
          >
            {/* Environment */}
            <div style={{
              background: 'rgba(4,15,26,0.65)',
              border: '1px solid rgba(100,190,255,0.15)',
              borderRadius: '10px',
              backdropFilter: 'blur(16px)',
              padding: '1.125rem 1.25rem',
            }}>
              <div className="flex items-center gap-2 mb-4">
                <span className="status-dot status-active" />
                <span className="t-label text-[10px] text-blue-light">ENVIRONMENT</span>
              </div>
              {ENV_STATS.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between py-2"
                  style={{ borderBottom: '1px solid rgba(100,190,255,0.06)' }}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 icon-blue" strokeWidth={1.5} />
                    <span className="t-label text-[10px]">{label}</span>
                  </div>
                  <span className="font-mono text-xs text-text-primary font-medium">{value}</span>
                </div>
              ))}
            </div>

            {/* Threats */}
            <div style={{
              background: 'rgba(255,89,104,0.04)',
              border: '1px solid rgba(255,89,104,0.22)',
              borderRadius: '10px',
              backdropFilter: 'blur(16px)',
              padding: '1.125rem 1.25rem',
            }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="status-dot status-threat animate-pulse" />
                <span className="t-label text-[10px] text-threat-red">ACTIVE THREATS</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="font-display font-bold text-4xl text-text-primary">3</span>
                <span className="t-label text-[10px] text-text-muted mb-2">TRACKS</span>
              </div>
            </div>

            {/* Radar coverage */}
            <div style={{
              background: 'rgba(66,217,154,0.04)',
              border: '1px solid rgba(66,217,154,0.18)',
              borderRadius: '10px',
              backdropFilter: 'blur(16px)',
              padding: '1.125rem 1.25rem',
            }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="status-dot status-live" />
                <span className="t-label text-[10px] text-success-green">RADAR COVERAGE</span>
              </div>
              <div className="flex items-end gap-1.5">
                <span className="font-display font-bold text-4xl text-text-primary">94</span>
                <span className="font-mono text-xl text-success-green mb-1">%</span>
              </div>
              <div className="metric-bar-track mt-2.5">
                <motion.div
                  className="metric-bar-fill"
                  style={{ background: 'linear-gradient(90deg,#42D99A,#42C7FF)', width: '0%' }}
                  animate={inView ? { width: '94%' } : {}}
                  transition={{ duration: 1.4, delay: 0.6, ease: [0.19,1,0.22,1] }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="divider mt-24 mx-8 lg:mx-24" />
    </section>
  )
}
