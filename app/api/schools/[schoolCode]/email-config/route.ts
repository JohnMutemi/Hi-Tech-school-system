import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Fetch email configuration for a school
export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    console.log('📥 GET email-config for school:', schoolCode)

    // Get school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode.toLowerCase() },
      include: {
        emailNotificationConfig: true
      }
    })

    console.log('🏫 School found:', !!school, school?.name)
    console.log('📧 Email config found:', !!school?.emailNotificationConfig)

    if (!school) {
      console.error('❌ School not found for code:', schoolCode)
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    const emailConfig = school.emailNotificationConfig || null
    console.log('📧 Email config found:', !!emailConfig)
    
    if (emailConfig) {
      console.log('📧 Email config details:', {
        id: emailConfig.id,
        isEnabled: emailConfig.isEnabled,
        emailProvider: emailConfig.emailProvider,
        fromEmail: emailConfig.fromEmail,
        fromName: emailConfig.fromName
      })
    }
    
    // Don't return sensitive configuration in the response
    if (emailConfig) {
      const safeConfig = {
        ...emailConfig,
        configuration: {} // Don't expose sensitive config in GET
      }
      console.log('✅ Returning email config (sanitized):', safeConfig)
      return NextResponse.json(safeConfig)
    }

    console.log('📧 No email config found, returning default structure')
    return NextResponse.json({
      id: null,
      isEnabled: false,
      emailProvider: '',
      configuration: {},
      fromEmail: '',
      fromName: '',
      paymentConfirmationEnabled: true,
      receiptAttachmentEnabled: true
    })
  } catch (error) {
    console.error('❌ Error fetching email config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create email configuration
export async function POST(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    console.log('📥 POST email-config for school:', schoolCode)
    
    const body = await request.json()
    console.log('📋 Request body:', body)
    
    const {
      isEnabled,
      emailProvider,
      configuration,
      fromEmail,
      fromName,
      paymentConfirmationEnabled = true,
      receiptAttachmentEnabled = true
    } = body

    console.log('🔍 Extracted fields:', {
      isEnabled,
      emailProvider,
      fromEmail,
      fromName,
      hasConfiguration: !!configuration
    })

    // Validate required fields
    if (isEnabled) {
      if (!emailProvider || !fromEmail || !fromName) {
        console.error('❌ Missing required fields')
        return NextResponse.json(
          { error: 'Missing required fields: emailProvider, fromEmail, fromName' },
          { status: 400 }
        )
      }
    }

    // Get school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode.toLowerCase() }
    })

    console.log('🏫 School found:', !!school, school?.name)

    if (!school) {
      console.error('❌ School not found for code:', schoolCode)
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    // Check if configuration already exists
    const existingConfig = await prisma.emailNotificationConfig.findUnique({
      where: { schoolId: school.id }
    })

    if (existingConfig) {
      return NextResponse.json(
        { error: 'Email configuration already exists. Use PUT to update.' },
        { status: 409 }
      )
    }

    // Create the email configuration
    const emailConfig = await prisma.emailNotificationConfig.create({
      data: {
        schoolId: school.id,
        isEnabled,
        emailProvider,
        configuration,
        fromEmail,
        fromName,
        paymentConfirmationEnabled,
        receiptAttachmentEnabled
      }
    })

    // Return without sensitive configuration
    return NextResponse.json({
      ...emailConfig,
      configuration: {}
    })
  } catch (error) {
    console.error('Error creating email config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update email configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: { schoolCode: string } }
) {
  try {
    const { schoolCode } = params
    console.log('📥 PUT email-config for school:', schoolCode)
    
    const body = await request.json()
    console.log('📋 PUT request body:', body)
    
    const {
      id,
      isEnabled,
      emailProvider,
      configuration,
      fromEmail,
      fromName,
      paymentConfirmationEnabled,
      receiptAttachmentEnabled
    } = body

    console.log('🔍 PUT extracted fields:', {
      id,
      isEnabled,
      emailProvider,
      fromEmail,
      fromName,
      hasConfiguration: !!configuration
    })

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

    // Check if configuration exists
    const existingConfig = await (prisma as any).emailNotificationConfig.findUnique({
      where: { schoolId: school.id }
    })

    console.log('📧 Existing config found for update:', !!existingConfig)

    if (!existingConfig) {
      console.error('❌ Email config not found for school:', school.id)
      return NextResponse.json(
        { error: 'Email configuration not found' },
        { status: 404 }
      )
    }

    // Update the email configuration
    console.log('💾 Updating email config for school:', school.id)
    const updatedConfig = await (prisma as any).emailNotificationConfig.update({
      where: { schoolId: school.id },
      data: {
        isEnabled,
        emailProvider,
        configuration,
        fromEmail,
        fromName,
        paymentConfirmationEnabled,
        receiptAttachmentEnabled,
        updatedAt: new Date()
      }
    })

    console.log('✅ Email config updated successfully')

    // Return without sensitive configuration
    return NextResponse.json({
      ...updatedConfig,
      configuration: {}
    })
  } catch (error) {
    console.error('Error updating email config:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


