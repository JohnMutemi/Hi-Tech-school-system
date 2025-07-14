import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const session = await getSession();

    // Clear session data
    session.isLoggedIn = false;
    session.id = "";
    session.email = "";
    session.name = "";
    session.role = "";
    session.schoolId = "";
    
    await session.destroy();

    return NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
} 