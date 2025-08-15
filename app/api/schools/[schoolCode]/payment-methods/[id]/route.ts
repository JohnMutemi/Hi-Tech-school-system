import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PUT - Update a payment method configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { schoolCode: string; id: string } }
) {
  try {
    const { schoolCode, id } = params
    const body = await request.json()
    
    const {
      methodType,
      displayName,
      configuration,
      instructions,
      isDefault,
      isActive
    } = body

    // Get school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode.toLowerCase() }
    })

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    // Check if payment method exists and belongs to school
    const existingConfig = await prisma.paymentMethodConfig.findFirst({
      where: {
        id,
        schoolId: school.id
      }
    })

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Payment method configuration not found' },
        { status: 404 }
      )
    }

    // If this is being set as default, unset any existing default
    if (isDefault && !existingConfig.isDefault) {
      await prisma.paymentMethodConfig.updateMany({
        where: { 
          schoolId: school.id,
          isDefault: true,
          id: { not: id }
        },
        data: { isDefault: false }
      })
    }

    // Update the payment method config
    const updatedConfig = await prisma.paymentMethodConfig.update({
      where: { id },
      data: {
        ...(methodType && { methodType }),
        ...(displayName && { displayName }),
        ...(configuration && { configuration }),
        ...(instructions !== undefined && { instructions }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive })
      }
    })

    return NextResponse.json(updatedConfig)
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a payment method configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: { schoolCode: string; id: string } }
) {
  try {
    const { schoolCode, id } = params

    // Get school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode.toLowerCase() }
    })

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    // Check if payment method exists and belongs to school
    const existingConfig = await prisma.paymentMethodConfig.findFirst({
      where: {
        id,
        schoolId: school.id
      }
    })

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Payment method configuration not found' },
        { status: 404 }
      )
    }

    // Delete the payment method config
    await prisma.paymentMethodConfig.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Payment method deleted successfully' })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


