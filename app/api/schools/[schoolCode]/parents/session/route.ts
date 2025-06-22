import { type NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { cookies } from "next/headers";

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const token = request.cookies.get("parent_auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (payload.role !== "parent" || payload.schoolCode !== params.schoolCode.toLowerCase()) {
      return NextResponse.json({ error: "Invalid session for this school" }, { status: 401 });
    }

    return NextResponse.json({ 
        success: true, 
        parentId: payload.userId, 
        schoolCode: payload.schoolCode 
    });
  } catch (error) {
    console.error("Parent session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 