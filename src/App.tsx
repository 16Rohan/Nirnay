import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import Simulation from './pages/Simulation'
import { initLenis } from './utils/smoothScroll'

export default function App() {
  useEffect(() => {
    const lenis = initLenis()
    return () => lenis?.destroy()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        {/* Existing app routes — untouched */}
        <Route path="/scenarios"  element={<PlaceholderPage title="Scenarios" />} />
        <Route path="/simulation" element={<Simulation />} />
        <Route path="/analytics"  element={<PlaceholderPage title="Analytics" />} />
        <Route path="/reports"    element={<PlaceholderPage title="Reports" />} />
      </Routes>
    </BrowserRouter>
  )
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-space-navy">
      <h1 className="display-section text-signal-cyan">{title}</h1>
    </div>
  )
}
