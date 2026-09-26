import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import HomePage from './pages/HomePage'
import OverviewPage from './pages/OverviewPage'
import WargamingPage from './pages/WargamingPage'
import ScenariosPage from './pages/ScenariosPage'
import Simulation from './pages/Simulation'
import SimulationPage from './pages/SimulationPage'
import AnalyticsPage from './pages/AnalyticsPage'
import ReportsPage from './pages/ReportsPage'
import { initLenis } from './utils/smoothScroll'

export default function App() {
  useEffect(() => {
    const lenis = initLenis()
    return () => lenis?.destroy()
  }, [])

  return (
    <BrowserRouter>
      <AppLayout>
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
      </AppLayout>
    </BrowserRouter>
  )
}
