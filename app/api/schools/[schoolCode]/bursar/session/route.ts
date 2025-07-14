import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params;
    const session = await getSession();

    // Check if user is logged in and is a bursar
    if (!session.isLoggedIn || session.role !== "bursar") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if bursar belongs to the correct school
    if (session.schoolId) {
      // You might want to verify the school code matches the schoolId
      // For now, we'll just return the session data
    }

    return NextResponse.json({
      id: session.id,
      name: session.name,
      email: session.email,
      role: session.role,
      schoolId: session.schoolId,
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json(
      { error: "Session check failed" },
      { status: 500 }
    );
  }
} 