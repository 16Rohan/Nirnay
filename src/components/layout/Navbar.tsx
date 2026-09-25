import { useState, useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronRight, User, Bell } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Overview',   to: '/' },
  { label: 'Wargaming',  to: '/wargaming' },
  { label: 'Scenarios',  to: '/scenarios' },
  { label: 'Simulation', to: '/simulation' },
  { label: 'Analytics',  to: '/analytics' },
  { label: 'Reports',    to: '/reports' },
]


export default function Navbar() {
  const [scrolled,   setScrolled]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [hidden,     setHidden]     = useState(false)
  const lastY = useRef(0)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 50)
      setHidden(y > lastY.current && y > 150)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [location])

  return (
    <>
      <motion.header
        animate={{ y: hidden ? -100 : 0 }}
        transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
        className="fixed top-0 left-0 right-0 z-50 select-none"
        style={{
          background: scrolled
            ? 'rgba(4, 15, 26, 0.85)'
            : 'linear-gradient(to bottom, rgba(2, 7, 13, 0.75) 0%, rgba(2, 7, 13, 0.25) 80%, transparent 100%)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: scrolled ? '1px solid rgba(100, 190, 255, 0.15)' : '1px solid rgba(100, 190, 255, 0.06)',
          transition: 'background 0.4s ease, border-color 0.4s ease',
        }}
      >
        <div className="max-w-[1500px] mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">

            {/* ── Logo (left) ── */}
            <NavLink to="/" className="flex items-center gap-3 flex-shrink-0 group">
              <div className="w-8 h-8 relative flex-shrink-0 flex items-center justify-center">
                <svg viewBox="0 0 28 28" fill="none" className="w-full h-full drop-shadow-[0_0_10px_rgba(66,199,255,0.7)]">
                  <polygon
                    points="14,2 26,26 14,21 2,26"
                    stroke="#42C7FF"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle cx="14" cy="14" r="2" fill="#63E6FF" />
                  <line x1="14" y1="2" x2="14" y2="21" stroke="rgba(66,199,255,0.5)" strokeWidth="1" />
                </svg>
                <div className="absolute inset-0 rounded-full bg-[#42C7FF]/10 scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </div>
              <span
                className="t-logo text-xl tracking-[0.25em] text-white font-bold font-display"
                style={{ textShadow: '0 0 16px rgba(66,199,255,0.45)' }}
              >
                NIRNAY
              </span>
            </NavLink>

            {/* ── Center Nav Links (desktop) ── */}
            <nav className="hidden lg:flex items-center gap-9 justify-center">
              {NAV_LINKS.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `relative text-sm tracking-wide font-display font-medium py-2 transition-colors duration-200 ${
                      isActive
                        ? 'text-white font-semibold'
                        : 'text-[#A6B6C6] hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span>{label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="navActiveLine"
                          className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#42C7FF] rounded-full"
                          style={{ boxShadow: '0 0 10px #42C7FF, 0 0 20px rgba(66,199,255,0.6)' }}
                          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* ── Right Controls ── */}
            <div className="flex items-center gap-3">
              {/* Notification icon button */}
              <button
                aria-label="Notifications"
                className="hidden md:flex relative w-9 h-9 rounded-full items-center justify-center
                           border border-[rgba(100,190,255,0.25)] bg-[rgba(4,15,26,0.6)]
                           text-[#A6B6C6] hover:text-white hover:border-[#42C7FF]
                           hover:bg-[rgba(22,140,255,0.12)] transition-all duration-200 group"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#42C7FF] shadow-[0_0_6px_#42C7FF]" />
              </button>

              {/* START SCENARIO > CTA */}
              <NavLink
                to="/wargaming"
                className="hidden md:inline-flex items-center gap-2 px-5 py-2 rounded-md
                           bg-[rgba(4,15,26,0.70)] border border-[rgba(66,199,255,0.65)]
                           text-white font-display text-xs font-semibold tracking-wider uppercase
                           shadow-[0_0_15px_rgba(22,140,255,0.25)]
                           hover:border-[#63E6FF] hover:bg-[rgba(22,140,255,0.2)]
                           hover:shadow-[0_0_24px_rgba(66,199,255,0.45)] hover:-translate-y-0.5
                           transition-all duration-200"
              >
                <span>START SCENARIO</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#42C7FF]" />
              </NavLink>

              {/* Profile icon button */}
              <button
                aria-label="User Profile"
                className="hidden md:flex w-9 h-9 rounded-full items-center justify-center
                           border border-[rgba(100,190,255,0.25)] bg-[rgba(4,15,26,0.6)]
                           text-[#A6B6C6] hover:text-white hover:border-[#42C7FF]
                           hover:bg-[rgba(22,140,255,0.12)] transition-all duration-200"
              >
                <User className="w-4 h-4" />
              </button>

              {/* Mobile menu toggle */}
              <button
                aria-label="Toggle navigation"
                onClick={() => setMobileOpen(v => !v)}
                className="lg:hidden flex items-center justify-center w-9 h-9 rounded-md
                           border border-[rgba(100,190,255,0.25)] text-[#A6B6C6]
                           hover:text-white hover:border-[#42C7FF] transition-all duration-200"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Hairline glow separator */}
        <div
          className="h-[1px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(66,199,255,0.2) 30%, rgba(66,199,255,0.4) 50%, rgba(66,199,255,0.2) 70%, transparent)' }}
        />
      </motion.header>

      {/* ── Mobile Menu Drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(2,7,13,0.8)', backdropFilter: 'blur(6px)' }}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 flex flex-col pt-20 pb-8 px-6 lg:hidden"
              style={{
                background: 'rgba(4,15,26,0.96)',
                backdropFilter: 'blur(24px)',
                borderLeft: '1px solid rgba(100,190,255,0.2)',
              }}
            >
              <div className="flex flex-col gap-1.5">
                {NAV_LINKS.map(({ label, to }, i) => (
                  <motion.div
                    key={to}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.03 * i }}
                  >
                    <NavLink
                      to={to}
                      end={to === '/'}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-4 py-3 rounded-md font-display text-sm tracking-wide transition-all ${
                          isActive
                            ? 'text-white bg-[rgba(22,140,255,0.18)] border border-[rgba(100,190,255,0.3)]'
                            : 'text-[#A6B6C6] hover:text-white hover:bg-[rgba(22,140,255,0.08)]'
                        }`
                      }
                    >
                      <span>{label}</span>
                      <ChevronRight className="w-4 h-4 text-[#42C7FF]/60" />
                    </NavLink>
                  </motion.div>
                ))}
              </div>
              <div className="mt-auto">
                <div className="h-px bg-gradient-to-r from-transparent via-[rgba(100,190,255,0.2)] to-transparent mb-5" />
                <NavLink
                  to="/simulation"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-md
                             bg-[rgba(22,140,255,0.25)] border border-[rgba(66,199,255,0.6)]
                             text-white font-display text-xs font-semibold tracking-wider uppercase"
                >
                  <span>Start Scenario</span>
                  <ChevronRight className="w-4 h-4 text-[#42C7FF]" />
                </NavLink>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
