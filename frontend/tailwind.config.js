/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary backgrounds
        'void':        '#02070D',
        'deep-navy':   '#06111C',
        'mid-navy':    '#081521',
        'panel':       '#0A1929',
        'panel-light': '#0D2035',
        // Interface blues
        'blue-primary': '#168CFF',
        'blue-bright':  '#249DFF',
        'blue-light':   '#42C7FF',
        'cyan-hi':      '#63E6FF',
        // Text
        'text-primary':   '#F5FAFF',
        'text-secondary': '#A6B6C6',
        'text-muted':     '#71869A',
        // Accents
        'threat-red':   '#FF5968',
        'success-green':'#42D99A',
        'amber-warn':   '#FFB347',
        // Legacy aliases (keep for any existing refs)
        'space-navy':   '#02070D',
        'panel-dark':   '#0A1929',
        'signal-cyan':  '#42C7FF',
        'deep-cyan':    '#168CFF',
        'blast-amber':  '#FFB347',
        'ember-orange': '#FF5968',
        'off-white':    '#F5FAFF',
        'muted-slate':  '#71869A',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        'display': '0.08em',
        'logo':    '0.3em',
        'label':   '0.12em',
        'wide2':   '0.2em',
      },
      fontSize: {
        'hero':    ['clamp(3.5rem, 9vw, 7.5rem)', { lineHeight: '1.0', letterSpacing: '-0.01em' }],
        'section': ['clamp(2rem, 4.5vw, 3.75rem)', { lineHeight: '1.1', letterSpacing: '-0.01em' }],
        'card-h':  ['1.125rem', { lineHeight: '1.3', fontWeight: '600' }],
      },
      backgroundImage: {
        // Hero image layering
        'hero-overlay':
          'linear-gradient(to bottom, rgba(2,7,13,0.35) 0%, rgba(2,7,13,0.15) 35%, rgba(2,7,13,0.45) 70%, rgba(2,7,13,0.92) 100%)',
        'hero-cyan-atm':
          'radial-gradient(ellipse 80% 50% at 30% 60%, rgba(22,140,255,0.10) 0%, transparent 70%)',
        'hero-vignette':
          'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 50%, rgba(2,7,13,0.6) 100%)',
        // Panels
        'glass-surface':
          'linear-gradient(135deg, rgba(22,140,255,0.06) 0%, rgba(4,15,26,0.55) 100%)',
        'card-hover-surface':
          'linear-gradient(135deg, rgba(22,140,255,0.10) 0%, rgba(8,21,33,0.70) 100%)',
        // Buttons
        'btn-blue':
          'linear-gradient(135deg, rgba(22,140,255,0.25) 0%, rgba(66,199,255,0.12) 100%)',
        'btn-blue-hover':
          'linear-gradient(135deg, rgba(36,157,255,0.40) 0%, rgba(99,230,255,0.20) 100%)',
        // Section gradients
        'section-dark':
          'linear-gradient(to bottom, #02070D 0%, #06111C 50%, #02070D 100%)',
        'section-panel':
          'linear-gradient(to bottom, #02070D 0%, #0A1929 40%, #06111C 100%)',
      },
      boxShadow: {
        'glow-blue':    '0 0 24px rgba(22,140,255,0.45), 0 0 64px rgba(22,140,255,0.15)',
        'glow-blue-sm': '0 0 10px rgba(22,140,255,0.5)',
        'glow-cyan':    '0 0 20px rgba(99,230,255,0.35), 0 0 50px rgba(99,230,255,0.12)',
        'glow-amber':   '0 0 20px rgba(255,179,71,0.4)',
        'glow-red':     '0 0 16px rgba(255,89,104,0.5)',
        'panel':        '0 4px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(100,190,255,0.08)',
        'panel-hover':  '0 8px 56px rgba(0,0,0,0.7), 0 0 28px rgba(22,140,255,0.18), inset 0 1px 0 rgba(100,190,255,0.14)',
        'card':         '0 2px 24px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(100,190,255,0.08)',
        'card-active':  '0 4px 32px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(22,140,255,0.30)',
      },
      borderColor: {
        'glass':      'rgba(100,190,255,0.20)',
        'glass-hi':   'rgba(100,190,255,0.40)',
        'glass-dim':  'rgba(100,190,255,0.08)',
      },
      animation: {
        'smoke-drift-1': 'smokeDrift1 18s ease-in-out infinite',
        'smoke-drift-2': 'smokeDrift2 24s ease-in-out infinite',
        'smoke-drift-3': 'smokeDrift3 20s ease-in-out infinite',
        'smoke-expand':  'smokeExpand 16s ease-out infinite',
        'pulse-blue':    'pulseBlue 3s ease-in-out infinite',
        'radar-sweep':   'radarSweep 4s linear infinite',
        'float-slow':    'floatSlow 8s ease-in-out infinite',
        'scan-h':        'scanH 6s linear infinite',
        'flicker':       'flicker 5s ease-in-out infinite',
        'trajectory':    'trajectory 3s ease-in-out infinite',
      },
      keyframes: {
        smokeDrift1: {
          '0%':   { transform: 'translate(0,0) scale(1)',     opacity: '0.12' },
          '33%':  { transform: 'translate(30px,-20px) scale(1.15)', opacity: '0.18' },
          '66%':  { transform: 'translate(-15px,-40px) scale(1.3)', opacity: '0.10' },
          '100%': { transform: 'translate(0,0) scale(1)',     opacity: '0.12' },
        },
        smokeDrift2: {
          '0%':   { transform: 'translate(0,0) scale(1)',      opacity: '0.08' },
          '50%':  { transform: 'translate(-40px,-30px) scale(1.2)', opacity: '0.14' },
          '100%': { transform: 'translate(0,0) scale(1)',      opacity: '0.08' },
        },
        smokeDrift3: {
          '0%':   { transform: 'translate(0,0) scale(1)',     opacity: '0.10' },
          '40%':  { transform: 'translate(20px,-50px) scale(1.25)', opacity: '0.06' },
          '100%': { transform: 'translate(0,0) scale(1)',     opacity: '0.10' },
        },
        smokeExpand: {
          '0%':   { transform: 'scale(1)',   opacity: '0.15' },
          '50%':  { transform: 'scale(1.4)', opacity: '0.08' },
          '100%': { transform: 'scale(1)',   opacity: '0.15' },
        },
        pulseBlue: {
          '0%,100%': { boxShadow: '0 0 12px rgba(22,140,255,0.3)' },
          '50%':     { boxShadow: '0 0 28px rgba(22,140,255,0.6), 0 0 56px rgba(22,140,255,0.2)' },
        },
        radarSweep: {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        floatSlow: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':     { transform: 'translateY(-12px) rotate(1deg)' },
        },
        scanH: {
          '0%':   { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
        flicker: {
          '0%,100%': { opacity: '1' },
          '92%':     { opacity: '1' },
          '93%':     { opacity: '0.7' },
          '94%':     { opacity: '1' },
          '96%':     { opacity: '0.85' },
          '97%':     { opacity: '1' },
        },
        trajectory: {
          '0%':   { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      backdropBlur: { xs: '2px', '2xl': '40px' },
      transitionTimingFunction: {
        'out-expo':  'cubic-bezier(0.19, 1, 0.22, 1)',
        'in-expo':   'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
        'out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
      },
    },
  },
  plugins: [],
}
