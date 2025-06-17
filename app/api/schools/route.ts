import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Return a message indicating client-side data fetching
    return NextResponse.json({ 
      message: "Schools data should be fetched client-side using getAllSchools()",
      schools: []
    })
  } catch (error) {
    console.error("Error in schools API:", error)
    return NextResponse.json({ error: "Failed to fetch schools" }, { status: 500 })
  }
}
