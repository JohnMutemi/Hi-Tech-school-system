import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schools } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const found = await db.select().from(schools).where(eq(schools.code, schoolCode)).limit(1)
    if (found.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }
    const currentStatus = found[0].status
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active'
    await db.update(schools)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(schools.code, schoolCode))
    return NextResponse.json({
      success: true,
      message: `School status updated to ${newStatus}`,
      status: newStatus
    })
  } catch (error) {
    console.error('Error toggling school status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 