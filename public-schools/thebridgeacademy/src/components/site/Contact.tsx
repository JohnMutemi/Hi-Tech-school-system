import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock, MessageCircle } from "lucide-react";
import { SiteContainer, SiteSection, SectionHeader } from "@/components/site/layout";

const WHATSAPP_URL =
  "https://wa.me/254723800347?text=" +
  encodeURIComponent("Hello, I'd like to leave a message for The Bridge Academy.");

type ContactCard = {
  icon: typeof MapPin;
  title: string;
  lines: string[];
  href?: string;
};

const cards: ContactCard[] = [
  {
    icon: MapPin,
    title: "Address",
    lines: ["Near Malioni Centre, Kavingoni Junction", "Mwingi–Kyuso Road, Kenya"],
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    lines: ["0723 800 347 — tap to leave a message"],
    href: WHATSAPP_URL,
  },
  { icon: Phone, title: "Phone", lines: ["0723 800 347"] },
  {
    icon: Mail,
    title: "Email",
    lines: ["info@bridgeacademy.ac.ke", "admissions@bridgeacademy.ac.ke"],
  },
  {
    icon: Clock,
    title: "Office Hours",
    lines: ["Mon – Fri · 8:00 AM – 5:00 PM", "Sat · 9:00 AM – 1:00 PM"],
  },
];

function ContactCardItem({ card }: { card: ContactCard }) {
  const inner = (
    <>
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
        <card.icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <h3 className="font-semibold text-foreground">{card.title}</h3>
        {card.lines.map((l) => (
          <p key={l} className="text-sm leading-snug text-muted-foreground">
            {l}
          </p>
        ))}
      </div>
    </>
  );

  const className =
    "site-card flex gap-4 p-4 transition hover:shadow-card sm:p-5";

  if (card.href) {
    return (
      <a
        href={card.href}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} hover:border-[#25D366]/50 active:scale-[0.99]`}
      >
        {inner}
      </a>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function Contact() {
  return (
    <SiteSection id="contact" className="bg-secondary/40">
      <SiteContainer>
        <SectionHeader
          eyebrow="Find Us"
          title="Find us on the map"
          lead="Near Malioni Centre, Kavingoni Junction — Mwingi–Kyuso Road, Kenya."
        />

        <div className="mt-8 flex flex-col gap-6 lg:mt-10 lg:grid lg:grid-cols-5 lg:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="site-card overflow-hidden lg:col-span-3 lg:order-1"
          >
            <iframe
              title="Map to The Bridge Academy"
              src="https://www.google.com/maps?q=Malioni,+Mwingi,+Kenya&output=embed"
              className="h-56 w-full border-0 sm:h-72 lg:h-full lg:min-h-[22rem]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>

          <div className="flex flex-col gap-3 sm:gap-4 lg:col-span-2">
            {cards.map((card) => (
              <ContactCardItem key={card.title} card={card} />
            ))}
          </div>
        </div>
      </SiteContainer>
    </SiteSection>
  );
}
