import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import { initLenis } from './utils/smoothScroll'

// Lazy-load secondary and heavier pages for lightning-fast initial load times
const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const WargamingPage = lazy(() => import('./pages/WargamingPage'))
const ScenariosPage = lazy(() => import('./pages/ScenariosPage'))
const Simulation = lazy(() => import('./pages/Simulation'))
const SimulationPage = lazy(() => import('./pages/SimulationPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))

function PageLoadingFallback() {
  return (
    <div className="min-h-screen bg-[#02070D] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        <span className="text-[11px] font-mono tracking-widest text-cyan-400/60 uppercase">INITIALIZING NIRNAY...</span>
      </div>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    const lenis = initLenis()
    return () => lenis?.destroy()
  }, [])

  return (
    <BrowserRouter>
      <AppLayout>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/wargaming" element={<WargamingPage />} />
            <Route path="/scenarios" element={<ScenariosPage />} />
            {/* Standalone 3D simulation sandbox (mock engine) */}
            <Route path="/simulation" element={<Simulation />} />
            {/* Text-based wargame results inspector */}
            <Route path="/simulation/results" element={<SimulationPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </BrowserRouter>
  )
}
