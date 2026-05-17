import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { About } from "@/components/site/About";
import { Stats } from "@/components/site/Stats";
import { Values } from "@/components/site/Values";
import { Admissions } from "@/components/site/Admissions";
import { News } from "@/components/site/News";
import { Gallery } from "@/components/site/Gallery";
import { Testimonials } from "@/components/site/Testimonials";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { ScrollTop } from "@/components/site/ScrollTop";
import { WhatsAppWidget } from "@/components/site/WhatsAppWidget";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Bridge Academy — Excellence in Education Since 2007" },
      {
        name: "description",
        content:
          "The Bridge Academy is a high-performing private comprehensive school in Malioni, Mwingi, Kenya — thriving since 2007. Apply now.",
      },
      { property: "og:title", content: "The Bridge Academy" },
      {
        property: "og:description",
        content: "A high-performing private comprehensive school thriving since 2007.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Stats />
        <Values />
        <Admissions />
        <News />
        <Gallery />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <ScrollTop />
      <WhatsAppWidget />
    </div>
  );
}
