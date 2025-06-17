import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { schoolCode: string } }) {
  try {
    const schoolCode = params.schoolCode.toLowerCase()

    // Return a message indicating client-side data fetching
    return NextResponse.json({ 
      message: `School data for ${schoolCode} should be fetched client-side using getSchool()`,
      schoolCode
    })
  } catch (error) {
    console.error("Error in school API:", error)
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 })
  }
}
