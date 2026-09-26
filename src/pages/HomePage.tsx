import { lazy, Suspense } from 'react'
import Navbar from '../components/layout/Navbar'
import HeroSection from '../components/layout/HeroSection'

// Lazy-load below-the-fold landing page sections for ultra-fast first contentful paint (FCP)
const FeaturesSection = lazy(() => import('../components/layout/FeaturesSection'))
const HowItWorksSection = lazy(() => import('../components/layout/HowItWorksSection'))
const CapabilitiesSection = lazy(() => import('../components/layout/CapabilitiesSection'))
const StatsSection = lazy(() => import('../components/layout/StatsSection'))
const AnalyticsSection = lazy(() => import('../components/layout/AnalyticsSection'))
const FinalCTASection = lazy(() => import('../components/layout/FinalCTASection'))
const Footer = lazy(() => import('../components/layout/Footer'))

export default function HomePage() {
  return (
    <div className="relative" style={{ background: '#02070D' }}>
      <Navbar />
      <HeroSection />
      <Suspense fallback={<div className="min-h-[200px] bg-[#02070D]" />}>
        <FeaturesSection />
        <HowItWorksSection />
        <CapabilitiesSection />
        <StatsSection />
        <AnalyticsSection />
        <FinalCTASection />
        <Footer />
      </Suspense>
    </div>
  )
}
