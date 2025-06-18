"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Eye
} from "lucide-react"
import { 
  getStudentFees, 
  getPayments, 
  getReceipts, 
  calculateStudentFeesSummary 
} from "@/lib/fees-storage"
import type { StudentFee, Payment, Receipt, StudentFeesSummary } from "@/lib/types/fees"
import type { Student } from "@/lib/school-storage"

interface StudentFeeStatementProps {
  schoolCode: string
  student: Student
  onMakePayment?: () => void
  onViewReceipt?: (receipt: Receipt) => void
}

export function StudentFeeStatement({ 
  schoolCode, 
  student, 
  onMakePayment, 
  onViewReceipt 
}: StudentFeeStatementProps) {
  const [studentFees, setStudentFees] = useState<StudentFee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [feesSummary, setFeesSummary] = useState<StudentFeesSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFeeData()
  }, [schoolCode, student.id])

  const loadFeeData = () => {
    try {
      const fees = getStudentFees(schoolCode, student.id)
      const paymentsData = getPayments(schoolCode, student.id)
      const receiptsData = getReceipts(schoolCode, student.id)
      const summary = calculateStudentFeesSummary(schoolCode, student.id)

      setStudentFees(fees)
      setPayments(paymentsData)
      setReceipts(receiptsData)
      setFeesSummary(summary)
    } catch (error) {
      console.error("Error loading fee data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'partial':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>
      case 'partial':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Partial</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mobile_money':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'bank_transfer':
        return <TrendingDown className="w-4 h-4 text-blue-600" />
      case 'cash':
        return <DollarSign className="w-4 h-4 text-green-600" />
      case 'check':
        return <FileText className="w-4 h-4 text-purple-600" />
      default:
        return <CreditCard className="w-4 h-4 text-gray-600" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // New function to generate fee statement HTML
  const generateStatementHTML = () => {
    // Placeholder for current class, year, term - replace with actual data if available
    const currentClass = "GRADE 1"; 
    const currentYear = "2024";
    const currentTerm = "1";

    // Calculate total debit and credit amounts
    const totalDebit = studentFees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalCredit = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const feesBalance = feesSummary ? feesSummary.totalBalance : 0;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Fee Statement - ${student.name}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-size: 12px;
            }
            .container {
              width: 100%;
              border: 1px solid #ccc;
              padding: 20px;
              box-sizing: border-box;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .school-name {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .school-address {
              font-size: 11px;
              color: #666;
            }
            .statement-title {
              font-size: 22px;
              font-weight: bold;
              text-align: center;
              margin: 20px 0;
              color: #333;
            }
            .student-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 20px;
              border: 1px solid #eee;
              padding: 10px;
              background-color: #f9f9f9;
            }
            .student-info div span:first-child {
              font-weight: bold;
              color: #555;
            }
            .fee-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            .fee-table th,
            .fee-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            .fee-table th {
              background-color: #f2f2f2;
              font-weight: bold;
            }
            .summary-section {
              margin-top: 20px;
              border-top: 2px solid #333;
              padding-top: 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
            }
            .summary-label {
              font-weight: bold;
            }
            .total-balance {
              font-size: 16px;
              font-weight: bold;
              color: #e00;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 10px;
              color: #888;
            }
            @media print {
              body { margin: 0; }
              .container { border: none; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="school-name">A.I.C. PIPELINE SCHOOL - PRIMARY & J.S.S</div>
              <div class="school-address">P.O. BOX 70420-00400, NAIROBI</div>
              <div class="school-address">CELL: 0723675441</div>
            </div>

            <div class="statement-title">Fees Statement</div>

            <div class="student-info">
              <div><span>Adm NO:</span> ${student.admissionNumber}</div>
              <div><span>Name:</span> ${student.name}</div>
              <div><span>Current Class:</span> ${currentClass}</div>
              <div><span>Year:</span> ${currentYear}</div>
              <div><span>Term:</span> ${currentTerm}</div>
            </div>

            <table class="fee-table">
              <thead>
                <tr>
                  <th>TDate</th>
                  <th>REF No:</th>
                  <th>Description</th>
                  <th>(DR) Amount</th>
                  <th>(CR) Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td></td>
                  <td></td>
                  <td>Fees Balance B/F</td>
                  <td>${(feesSummary?.openingBalance || 0).toLocaleString()}</td>
                  <td>0.00</td>
                </tr>
                ${studentFees.map(fee => `
                  <tr>
                    <td>${formatDate(fee.dueDate)}</td>
                    <td>N/A</td> <!-- Assuming no REF No for fee assignments -->
                    <td>${fee.id}</td>
                    <td>${fee.amount.toLocaleString()}</td>
                    <td>0.00</td>
                  </tr>
                `).join('')}
                ${payments.map(payment => `
                  <tr>
                    <td>${formatDate(payment.date)}</td>
                    <td>${payment.receiptNumber}</td>
                    <td>Payment Received</td>
                    <td>0.00</td>
                    <td>${payment.amount.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="summary-section">
              <div class="summary-row">
                <span class="summary-label">Total Amount KShs:</span>
                <span>(DR) ${totalDebit.toLocaleString()} (CR) ${totalCredit.toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Fees Balance KShs:</span>
                <span class="total-balance">${feesBalance.toLocaleString()}</span>
              </div>
            </div>

            <div class="footer">
              <p>Print Date: ${formatDate(new Date().toISOString())}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const downloadStatement = () => {
    const htmlContent = generateStatementHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fee-statement-${student.admissionNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Optionally, show a toast notification
    // toast({
    //   title: "Statement Downloaded",
    //   description: `Fee statement for ${student.name} downloaded.`,
    // });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {feesSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="w-6 h-6 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Fees</p>
                  <p className="text-lg font-semibold">
                    KES {feesSummary.totalFees.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CreditCard className="w-6 h-6 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-lg font-semibold text-green-600">
                    KES {feesSummary.totalPaid.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Balance</p>
                  <p className="text-lg font-semibold text-red-600">
                    KES {feesSummary.totalBalance.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="w-6 h-6 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-lg font-semibold text-yellow-600">
                    KES {feesSummary.overdueAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Fee Statement</h2>
          <p className="text-gray-600">Student: {student.name} ({student.admissionNumber})</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={downloadStatement} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download Statement
          </Button>
          {onMakePayment && (
            <Button onClick={onMakePayment} size="sm">
              <CreditCard className="w-4 h-4 mr-2" />
              Make Payment
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="fees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fees">Fee Breakdown</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
          <TabsTrigger value="receipts">Receipts</TabsTrigger>
        </TabsList>

        {/* Fee Breakdown Tab */}
        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fee Breakdown</CardTitle>
              <CardDescription>Detailed breakdown of all fees assigned to this student</CardDescription>
            </CardHeader>
            <CardContent>
              {studentFees.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No fees assigned to this student yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentFees.map((fee) => (
                      <TableRow key={fee.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(fee.status)}
                            {fee.id}
                          </div>
                        </TableCell>
                        <TableCell>KES {fee.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {formatDate(fee.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(fee.status)}
                        </TableCell>
                        <TableCell className="font-semibold">
                          KES {fee.balance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All payment transactions for this student</CardDescription>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No payments recorded yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {formatDate(payment.paymentDate)}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.receiptNumber}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600">
                          KES {payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                            <span className="capitalize">
                              {payment.paymentMethod.replace('_', ' ')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{payment.referenceNumber || '-'}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {payment.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Receipts</CardTitle>
              <CardDescription>All generated payment receipts</CardDescription>
            </CardHeader>
            <CardContent>
              {receipts.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No receipts generated yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipts.map((receipt) => (
                      <TableRow key={receipt.id}>
                        <TableCell className="font-medium">
                          {receipt.receiptNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {formatDate(receipt.paymentDate)}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          KES {receipt.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          KES {receipt.balance.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => onViewReceipt?.(receipt)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Information */}
      {feesSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-600">Last Payment Date:</p>
                <p className="text-gray-900">
                  {feesSummary.lastPaymentDate 
                    ? formatDate(feesSummary.lastPaymentDate)
                    : "No payments yet"
                  }
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-600">Next Due Date:</p>
                <p className="text-gray-900">
                  {feesSummary.nextDueDate 
                    ? formatDate(feesSummary.nextDueDate)
                    : "No upcoming dues"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 