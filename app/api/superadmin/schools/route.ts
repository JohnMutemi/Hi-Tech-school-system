import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schools } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

// GET: List all schools
export async function GET() {
  try {
    const allSchools = await db.select().from(schools)
    // Optionally transform to match UI expectations
    return NextResponse.json(allSchools)
  } catch (error) {
    console.error('Error fetching schools:', error)
    return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 })
  }
}

// POST: Create a new school (optional, usually handled by /api/schools)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    // You can reuse the logic from /api/schools/route.ts if needed
    // For now, just return 405
    return NextResponse.json({ error: 'Not implemented here. Use /api/schools.' }, { status: 405 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Bulk delete by code[] (optional, for admin mass delete)
export async function DELETE(request: NextRequest) {
  try {
    const { codes } = await request.json()
    if (!Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json({ error: 'No codes provided' }, { status: 400 })
    }
    await db.delete(schools).where(inArray(schools.code, codes))
    return NextResponse.json({ success: true, message: 'Schools deleted' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 