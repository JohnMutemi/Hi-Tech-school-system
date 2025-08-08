import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; paymentId: string } }
) {
  try {
    const { schoolCode, paymentId } = params;

    // Get school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Get payment with receipt details
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        student: {
          schoolId: school.id
        }
      },
      include: {
        receipt: true,
        student: {
          include: {
            user: true,
            class: true
          }
        },
        academicYear: true,
        term: true
      }
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Get receipt details
    const receipt = payment.receipt;
    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found for this payment' },
        { status: 404 }
      );
    }

    // Return receipt data with all necessary information
    return NextResponse.json({
      receiptNumber: receipt.receiptNumber,
      paymentId: payment.id,
      amount: payment.amount,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      term: payment.term?.name || 'N/A',
      academicYear: payment.academicYear?.name || 'N/A',
      referenceNumber: payment.referenceNumber,
      phoneNumber: payment.phoneNumber,
      transactionId: payment.transactionId,
      description: payment.description,
      status: payment.status || 'completed',
      
      // Balance information from receipt
      termOutstandingBefore: receipt.termOutstandingBefore || 0,
      termOutstandingAfter: receipt.termOutstandingAfter || 0,
      academicYearOutstandingBefore: receipt.academicYearOutstandingBefore || 0,
      academicYearOutstandingAfter: receipt.academicYearOutstandingAfter || 0,
      
      // Student information
      studentId: payment.student.id,
      studentName: payment.student.user.name,
      admissionNumber: payment.student.admissionNumber,
      className: payment.student.class?.name || 'N/A',
      
      // School information
      schoolName: school.name,
      schoolCode: school.code,
      
      // Additional payment details
      receivedBy: payment.receivedBy || 'School Portal',
      carryForwardAmount: payment.carryForwardAmount || 0,
      overpaymentAmount: payment.overpaymentAmount || 0,
      appliedToTerm: payment.appliedToTerm,
      appliedToAcademicYear: payment.appliedToAcademicYear,
      
      // Receipt metadata
      receiptId: receipt.id,
      receiptCreatedAt: receipt.createdAt || payment.paymentDate,
    });

  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}