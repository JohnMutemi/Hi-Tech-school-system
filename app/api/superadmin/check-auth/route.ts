import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key"

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get("superadmin-token")?.value
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    const decoded = jwt.verify(token, JWT_SECRET)
    return NextResponse.json({ authenticated: true, user: decoded })
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
} 