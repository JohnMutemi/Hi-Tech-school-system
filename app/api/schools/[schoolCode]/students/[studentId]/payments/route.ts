import { NextRequest, NextResponse } from 'next/server'
import { paymentService } from '@/lib/services/payment-service'
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Enhanced logging utility for API routes
const logApiRequest = (method: string, endpoint: string, data: any, type: 'request' | 'response' | 'error' = 'request') => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    method,
    endpoint,
    type,
    data: typeof data === 'object' ? JSON.stringify(data, null, 2) : data
  };
  
  console.log(`🟢 [API-${method.toUpperCase()}] ${timestamp}:`, logData);
  
  // Also log to server logs for production
  if (process.env.NODE_ENV === 'production') {
    console.log(`📊 [SERVER-LOG] API ${method} ${endpoint}:`, logData);
  }
};

export async function POST(
  req: NextRequest,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  const { schoolCode, studentId } = params;
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  
  logApiRequest('POST', `/api/schools/${schoolCode}/students/${studentId}/payments`, {
    requestId,
    schoolCode,
    studentId,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  try {
    const body = await req.json();
    const { paymentType, amount, phoneNumber, description, paymentMethod, receivedBy, academicYear, term } = body;

    logApiRequest('POST', `/api/schools/${schoolCode}/students/${studentId}/payments`, {
      requestId,
      body: {
        paymentType,
        amount,
        phoneNumber: phoneNumber ? '***' + phoneNumber.slice(-4) : undefined,
        description,
        paymentMethod,
        receivedBy,
        academicYear,
        term
      }
    }, 'request');

    // Validate required fields
    if (!amount || amount <= 0) {
      logApiRequest('POST', `/api/schools/${schoolCode}/students/${studentId}/payments`, {
        requestId,
        error: 'Invalid amount',
        amount
      }, 'error');

      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // M-Pesa validation commented out for simulation
    /*
    if (paymentType === 'daraja' && !phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required for M-Pesa payments' },
        { status: 400 }
      )
    }
    */

    let result;

    // Daraja payment handling commented out for simulation
    /*
    if (paymentType === 'daraja') {
      // Daraja API payment
      result = await paymentService.createDarajaPayment(
        schoolCode,
        studentId,
        {
          amount,
          phoneNumber,
          description,
          callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/daraja`
        }
      )

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: 'Payment request created successfully',
          data: {
            transactionId: result.transactionId,
            referenceNumber: result.referenceNumber,
            status: result.status,
            message: result.message,
            metadata: result.metadata
          }
        })
      } else {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        )
      }
    } else {
    */
    // Always use manual payment for simulation
    {
      logApiRequest('POST', `/api/schools/${schoolCode}/students/${studentId}/payments`, {
        requestId,
        stage: 'PROCESSING_START',
        paymentData: {
          amount,
          paymentMethod: paymentMethod || 'cash',
          description,
          receivedBy: receivedBy || 'Parent Portal',
          academicYear,
          term
        }
      });

      // Semi-automated payment
      result = await paymentService.createSemiAutomatedPayment(
        schoolCode,
        studentId,
        {
          amount,
          paymentMethod: paymentMethod || 'cash',
          description,
          receivedBy: receivedBy || 'Parent Portal',
          academicYear,
          term
        }
      )

      if (result.success && result.payment && result.receipt) {
        const responseData = {
          success: true,
          message: 'Payment processed successfully',
          payment: {
            id: result.payment.id,
            amount: result.payment.amount,
            receiptNumber: result.payment.receiptNumber,
            referenceNumber: result.payment.referenceNumber,
            paymentMethod: result.payment.paymentMethod,
            studentName: result.payment.studentName,
            className: result.payment.className,
            admissionNumber: result.payment.admissionNumber,
            schoolName: result.payment.schoolName,
            academicYearOutstandingAfter: result.payment.academicYearOutstandingAfter,
            termOutstandingAfter: result.payment.termOutstandingAfter,
            cached: result.cached || false
          },
          receipt: {
            id: result.receipt.id,
            receiptNumber: result.receipt.receiptNumber,
            amount: result.receipt.amount,
            academicYearOutstandingBefore: result.receipt.academicYearOutstandingBefore,
            academicYearOutstandingAfter: result.receipt.academicYearOutstandingAfter,
            termOutstandingBefore: result.receipt.termOutstandingBefore,
            termOutstandingAfter: result.receipt.termOutstandingAfter
          },
          // Enhanced payment information
          paymentDistribution: result.paymentDistribution || [],
          overpaymentAmount: result.overpaymentAmount || 0,
          nextTermApplied: result.nextTermApplied || null,
          totalPaid: result.totalPaid || result.payment.amount,
          remainingBalance: result.remainingBalance || 0,
          allPayments: result.allPayments || [],
          allReceipts: result.allReceipts || []
        };

        logApiRequest('POST', `/api/schools/${schoolCode}/students/${studentId}/payments`, {
          requestId,
          stage: 'SUCCESS',
          response: responseData
        }, 'response');

        return NextResponse.json(responseData, { status: 201 })
      } else {
        logApiRequest('POST', `/api/schools/${schoolCode}/students/${studentId}/payments`, {
          requestId,
          stage: 'FAILED',
          error: result.message
        }, 'error');

        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        )
      }
    }
  } catch (error) {
    logApiRequest('POST', `/api/schools/${schoolCode}/students/${studentId}/payments`, {
      requestId,
      stage: 'EXCEPTION',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 'error');

    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolCode: string; studentId: string } }
) {
  try {
    const { schoolCode, studentId } = params;
    const { searchParams } = new URL(request.url);
    
    const academicYearId = searchParams.get("academicYearId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const debug = searchParams.get("debug") === "true";

    // Find the school
    const school = await prisma.school.findUnique({
      where: { code: schoolCode },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Verify the student belongs to this school
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        schoolId: school.id,
        isActive: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Build where clause for payments
    const whereClause: any = {
      studentId: studentId,
    };

    // Filter by academic year if specified
    if (academicYearId) {
      whereClause.academicYearId = academicYearId;
    }

    // Fetch payments with related data
    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        paymentDate: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.payment.count({
      where: whereClause,
    });

    // If debug mode, return detailed payment information
    if (debug) {
      const feeStructures = await prisma.termlyFeeStructure.findMany({
        where: {
          gradeId: student.class?.gradeId,
          isActive: true,
        },
        include: {
          termRef: true,
        },
      });

      return NextResponse.json({
        payments: payments.map(p => ({
          id: p.id,
          amount: p.amount,
          paymentDate: p.paymentDate,
          termId: p.termId,
          termName: p.term?.name,
          academicYearId: p.academicYearId,
          academicYearName: p.academicYear?.name,
          description: p.description,
        })),
        feeStructures: feeStructures.map(fs => ({
          id: fs.id,
          term: fs.term,
          year: fs.year,
          termId: fs.termId,
          termName: fs.termRef?.name,
          totalAmount: fs.totalAmount,
        })),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      });
    }

    return NextResponse.json({
      payments,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment history" },
      { status: 500 }
    );
  }
} 