import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch payment methods for a school
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params

    // Get school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode.toLowerCase() },
      include: {
        paymentMethodConfigs: {
          where: { isActive: true },
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    })

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(school.paymentMethodConfigs)
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new payment method configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    const body = await request.json()
    
    const {
      methodType,
      displayName,
      configuration,
      instructions,
      isDefault = false
    } = body

    // Validate required fields
    if (!methodType || !displayName || !configuration) {
      return NextResponse.json(
        { error: 'Missing required fields: methodType, displayName, configuration' },
        { status: 400 }
      )
    }

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

    // If this is being set as default, unset any existing default
    if (isDefault) {
      await prisma.paymentMethodConfig.updateMany({
        where: { 
          schoolId: school.id,
          isDefault: true 
        },
        data: { isDefault: false }
      })
    }

    // Create the new payment method config
    const paymentMethodConfig = await prisma.paymentMethodConfig.create({
      data: {
        schoolId: school.id,
        methodType,
        displayName,
        configuration,
        instructions,
        isDefault,
        isActive: true
      }
    })

    return NextResponse.json(paymentMethodConfig)
  } catch (error) {
    console.error('Error creating payment method:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


