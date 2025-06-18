import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const email = "admin@hitechsms.co.ke";
  const password = "admin123";
  const hashedPassword = "$2b$12$QvZmJRnTt5h.Haos1SPi2uOxSmzXLtk/jwT7KG/rkju37wXKJ1ksK";

  // Check if user already exists
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log("Superadmin already exists.");
    process.exit(0);
  }

  await db.insert(users).values({
    name: "Super Admin",
    email,
    password: hashedPassword,
    role: "super_admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("Superadmin created.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}); 