import Navbar from '../components/layout/Navbar'
import HeroSection from '../components/layout/HeroSection'
import FeaturesSection from '../components/layout/FeaturesSection'
import HowItWorksSection from '../components/layout/HowItWorksSection'
import CapabilitiesSection from '../components/layout/CapabilitiesSection'
import StatsSection from '../components/layout/StatsSection'
import AnalyticsSection from '../components/layout/AnalyticsSection'
import FinalCTASection from '../components/layout/FinalCTASection'
import Footer from '../components/layout/Footer'

export default function HomePage() {
  return (
    <div className="relative" style={{ background: '#02070D' }}>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CapabilitiesSection />
      <StatsSection />
      <AnalyticsSection />
      <FinalCTASection />
      <Footer />
    </div>
  )
}
