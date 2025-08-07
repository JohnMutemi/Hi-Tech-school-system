import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; receiptId: string } }
) {
  try {
    const { schoolCode, receiptId } = params;

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Find the receipt with all related data
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            class: {
              include: {
                grade: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            parent: {
              select: {
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        payment: {
          select: {
            amount: true,
            paymentMethod: true,
            referenceNumber: true,
            description: true,
            receivedBy: true,
          },
        },
        academicYear: {
          select: {
            name: true,
          },
        },
        term: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Verify the receipt belongs to the school
    if (receipt.student.schoolId !== school.id) {
      return NextResponse.json(
        { error: 'Receipt not found in this school' },
        { status: 404 }
      );
    }

    // Format receipt data for display/printing
    const receiptData = {
      receipt: {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        amount: receipt.amount,
        paymentDate: receipt.paymentDate,
        paymentMethod: receipt.paymentMethod,
        referenceNumber: receipt.referenceNumber,
        balanceBefore: receipt.termOutstandingBefore,
        balanceAfter: receipt.termOutstandingAfter,
      },
      school: {
        name: school.name,
        address: school.address,
        phone: school.phone,
        email: school.email,
        logo: school.logo,
      },
      student: {
        name: receipt.student.user.name,
        admissionNumber: receipt.student.admissionNumber,
        className: receipt.student.class?.name,
        gradeName: receipt.student.class?.grade?.name,
      },
      parent: receipt.student.parent ? {
        name: receipt.student.parent.name,
        phone: receipt.student.parent.phone,
        email: receipt.student.parent.email,
      } : null,
      payment: {
        amount: receipt.payment.amount,
        method: receipt.payment.paymentMethod,
        reference: receipt.payment.referenceNumber,
        description: receipt.payment.description,
        receivedBy: receipt.payment.receivedBy,
      },
      academicInfo: {
        academicYear: receipt.academicYear?.name,
        term: receipt.term?.name,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: receiptData,
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

