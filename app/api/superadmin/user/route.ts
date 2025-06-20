import { getSession } from "@/lib/session"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await getSession()

  if (session.isLoggedIn) {
    return NextResponse.json({
      isLoggedIn: true,
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
    })
  }

  return NextResponse.json({
    isLoggedIn: false,
  })
} 