import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Clear the session cookie
    cookies().set("parent_auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: -1, // Expire the cookie immediately
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Parent logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 