import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { FeaturesSection } from "@/components/features-section"
import { PricingSection } from "@/components/pricing-section"
import { ContactSection } from "@/components/contact-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="border-b border-gray-200 bg-gradient-to-br from-slate-50 to-blue-50" id="hero">
          <HeroSection />
        </section>
        <section className="border-b border-gray-100 bg-white" id="about">
          <AboutSection />
        </section>
        <section className="border-b border-gray-100 bg-gray-50" id="features">
          <FeaturesSection />
        </section>
        <section className="border-b border-gray-100 bg-white" id="pricing">
          <PricingSection />
        </section>
        <section className="bg-gray-50" id="contact">
          <ContactSection />
        </section>
      </main>
      <Footer />
    </div>
  )
}
