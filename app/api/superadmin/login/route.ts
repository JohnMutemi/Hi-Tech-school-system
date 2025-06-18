import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { NextResponse } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key"
const JWT_EXPIRES_IN = 60 * 60 * 24 // 1 day

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    // Find superadmin user
    const found = await db.select().from(users).where(eq(users.email, email)).limit(1)
    const user = found[0]
    if (!user || user.role !== "super_admin") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    // Set JWT in HttpOnly cookie
    const response = NextResponse.json({
      success: true,
      user: { email: user.email, name: user.name, role: user.role }
    })
    response.cookies.set("superadmin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: JWT_EXPIRES_IN,
      path: "/"
    })
    return response
  } catch (error) {
    console.error("Super admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}