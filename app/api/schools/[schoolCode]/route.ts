import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schools } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const found = await db.select().from(schools).where(eq(schools.code, schoolCode)).limit(1)
    if (found.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }
    const school = found[0]
    // Transform to match the expected SchoolData interface if needed
    return NextResponse.json(school)
  } catch (error) {
    console.error('Error fetching school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const body = await request.json()
    const { name, address, phone, email, website, principalName, establishedYear, description, motto } = body

    if (!name || !address || !phone || !email) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const found = await db.select().from(schools).where(eq(schools.code, schoolCode)).limit(1)
    if (found.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    const adminFirstName = principalName?.split(" ")[0] || name.split(" ")[0] || "Admin"
    const adminLastName = principalName?.split(" ").slice(1).join(" ") || name.split(" ").slice(1).join(" ") || "User"

    await db.update(schools)
      .set({
        name,
        address,
        phone,
        email,
        adminEmail: email,
        adminFirstName,
        adminLastName,
        description,
        updatedAt: new Date(),
      })
      .where(eq(schools.code, schoolCode))

    return NextResponse.json({ success: true, message: "School updated successfully" })
  } catch (error) {
    console.error('Error updating school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const found = await db.select().from(schools).where(eq(schools.code, schoolCode)).limit(1)
    if (found.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }
    await db.delete(schools).where(eq(schools.code, schoolCode))
    return NextResponse.json({ success: true, message: "School deleted successfully" })
  } catch (error) {
    console.error('Error deleting school:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
