import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { FeaturesSection } from "@/components/features-section"
import { PricingSection } from "@/components/pricing-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-indigo-100/30 dark:from-gray-900 dark:via-gray-800/30 dark:to-slate-900/30 transition-colors duration-300">
      <Header />
      <main className="relative">
        {/* Hero Section */}
        <section id="hero">
          <HeroSection />
        </section>
        
        {/* About Section */}
        <section id="about">
          <AboutSection />
        </section>
        
        {/* Features Section */}
        <section id="features">
          <FeaturesSection />
        </section>
        
        {/* Pricing Section */}
        <section id="pricing">
          <PricingSection />
        </section>
        
        {/* Contact Section */}
        <section id="contact">
          <ContactSection />
        </section>
      </main>
      <Footer />
    </div>
  )
}
