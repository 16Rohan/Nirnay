import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Mail, Github, ExternalLink, Shield } from 'lucide-react'

const LINKS = {
  Platform:  [{ l: 'Overview', t: '/' }, { l: 'Scenarios', t: '/scenarios' }, { l: 'Simulation', t: '/simulation' }, { l: 'Analytics', t: '/analytics' }, { l: 'Reports', t: '/reports' }],
  Resources: [{ l: 'Documentation', t: '#' }, { l: 'API Reference', t: '#' }, { l: 'Changelog', t: '#' }, { l: 'Status', t: '#' }],
  Legal:     [{ l: 'Privacy Policy', t: '#' }, { l: 'Terms of Use', t: '#' }, { l: 'Security', t: '#' }],
}

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden"
      style={{
        background: '#02070D',
        borderTop: '1px solid rgba(100,190,255,0.10)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Main grid */}
        <div className="py-14 grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Brand */}
          <div className="lg:col-span-2">
            <NavLink to="/" className="flex items-center gap-3 group mb-5 w-fit">
              <div className="w-7 h-7 flex-shrink-0">
                <svg viewBox="0 0 28 28" fill="none" className="w-full h-full">
                  <polygon points="14,2 26,26 14,22 2,26" stroke="rgba(66,199,255,0.85)"
                    strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                  <circle cx="14" cy="14" r="2.5" fill="#42C7FF" />
                </svg>
              </div>
              <span className="t-logo text-base tracking-[0.28em]">NIRNAY</span>
            </NavLink>

            <p className="t-body-sm text-text-muted max-w-xs mb-5 leading-relaxed">
              Agentic AI platform for strategic scenario simulation, decision support and
              synthetic wargaming.
            </p>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded w-fit mb-6"
              style={{ background: 'rgba(255,89,104,0.06)', border: '1px solid rgba(255,89,104,0.18)' }}>
              <Shield className="w-3 h-3 text-threat-red/70" strokeWidth={1.5} />
              <span className="t-label text-[9px] text-threat-red/70">FOR AUTHORISED USE ONLY</span>
            </div>

            <div className="flex items-center gap-2">
              {[
                { icon: Mail,         href: 'mailto:contact@nirnay.ai', label: 'Email' },
                { icon: Github,       href: 'https://github.com',        label: 'GitHub' },
                { icon: ExternalLink, href: '#',                          label: 'Docs' },
              ].map(({ icon: Icon, href, label }) => (
                <a key={label} href={href} aria-label={label}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="w-8 h-8 rounded flex items-center justify-center
                             text-text-muted hover:text-text-primary transition-colors duration-200"
                  style={{ border: '1px solid rgba(100,190,255,0.15)' }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="t-label text-[10px] text-blue-light mb-5">{group.toUpperCase()}</h4>
              <ul className="space-y-3">
                {links.map(({ l, t }) => (
                  <li key={l}>
                    <NavLink to={t}
                      className="t-body-sm text-text-muted hover:text-text-primary
                                 transition-colors duration-200 inline-flex items-center gap-1 group">
                      <ChevronRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 -ml-1 transition-opacity" />
                      {l}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: '1px solid rgba(100,190,255,0.07)' }}>
          <p className="font-mono text-[11px] text-text-muted">
            © {new Date().getFullYear()} NIRNAY — All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="status-dot status-live animate-pulse" />
            <span className="t-label text-[9px] text-success-green/70">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
