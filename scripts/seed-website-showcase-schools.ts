/**
 * Creates four demo schools (one per public layout) for local/staging QA.
 * Password for each admin: Showcase2026!
 *
 * Run from repo root (Hi-Tech-school-system): `npx tsx scripts/seed-website-showcase-schools.ts`
 * Requires DATABASE_URL and NEXT_PUBLIC_BASE_URL (optional; used only in log output).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SchoolWebsiteSeedingService } from "../lib/services/school-website-seeding-service";
import { getPlatformBaseUrl } from "../lib/school-website/platform-url";

const prisma = new PrismaClient();

const PASSWORD_PLAIN = "Showcase2026!";

const DEMOS = [
  {
    code: "demo-kabianga",
    name: "Showcase — Kabianga-style layout",
    template: "minimal" as const,
    palette: "slate" as const,
    theme: "#475569",
    adminEmail: "showcase+kabianga@example.invalid",
  },
  {
    code: "demo-embuni",
    name: "Showcase — Embu University College–style layout",
    template: "compact" as const,
    palette: "forest" as const,
    theme: "#15803d",
    adminEmail: "showcase+embuni@example.invalid",
  },
  {
    code: "demo-uon",
    name: "Showcase — University of Nairobi–style layout",
    template: "classic" as const,
    palette: "royal" as const,
    theme: "#1d4ed8",
    adminEmail: "showcase+uon@example.invalid",
  },
  {
    code: "demo-ku",
    name: "Showcase — Kenyatta University–style layout",
    template: "modern" as const,
    palette: "ocean" as const,
    theme: "#0d9488",
    adminEmail: "showcase+ku@example.invalid",
  },
];

async function main() {
  const hashed = await bcrypt.hash(PASSWORD_PLAIN, 12);
  const base = getPlatformBaseUrl();

  for (const d of DEMOS) {
    const existing = await prisma.school.findUnique({ where: { code: d.code } });
    if (existing) {
      console.log(`Skip ${d.code} (already exists)`);
      continue;
    }

    const school = await prisma.school.create({
      data: {
        name: d.name,
        code: d.code,
        address: "Nairobi, Kenya (demo)",
        phone: "+254700000000",
        email: `noreply+${d.code}@example.invalid`,
        colorTheme: d.theme,
        colorPaletteSlug: d.palette,
        websiteTemplateSlug: d.template,
        packageType: "full",
        motto: "Excellence • Integrity • Service",
        principalName: "Dr. Demo Principal",
        establishedYear: 2012,
        description: `${d.name} demonstrates the Hi-Tech SMS public website. Use this to review layout, navigation, and seeded content before onboarding a real institution.`,
        publicWebsiteEnabled: true,
        isActive: true,
      },
    });

    await prisma.user.create({
      data: {
        name: "Showcase Admin",
        email: d.adminEmail,
        password: hashed,
        role: "admin",
        schoolId: school.id,
        isActive: true,
        mustChangePassword: false,
        twoFactorEnabled: false,
      },
    });

    await SchoolWebsiteSeedingService.seedForSchool(school.id, school.name, d.template, {
      motto: school.motto ?? undefined,
      principalName: school.principalName ?? undefined,
      description: school.description ?? undefined,
      address: school.address,
      establishedYear: school.establishedYear,
    });

    console.log(`Created ${d.code} — public: ${base}/site/${d.code}`);
  }

  console.log(`\nDone. Staff login password for each showcase admin: ${PASSWORD_PLAIN}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
