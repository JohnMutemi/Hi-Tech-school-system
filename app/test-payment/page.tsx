"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Phone, CreditCard, Receipt, CheckCircle, Download } from 'lucide-react'

interface ReceiptData {
  receiptNumber: string
  paymentId: string
  studentId: string
  schoolCode: string
  amount: number
  paymentMethod: string
  feeType: string
  term: string
  academicYear: string
  reference: string
  phoneNumber?: string
  transactionId?: string
  status: string
  issuedAt: Date
  issuedBy: string
  schoolName: string
  studentName: string
  currency: string
}

export default function TestPaymentPage() {
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'manual'>('mpesa')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [amount, setAmount] = useState(5000)
  const [customAmount, setCustomAmount] = useState(5000)
  const [showCustomAmount, setShowCustomAmount] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)

  const handlePayment = async () => {
    setIsProcessing(true)

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Generate receipt data
      const receipt: ReceiptData = {
        receiptNumber: `RCP-${Date.now()}`,
        paymentId: `pay_${Date.now()}`,
        studentId: 'DEMO_STUDENT_001',
        schoolCode: 'DEMO_SCHOOL',
        amount: customAmount,
        paymentMethod,
        feeType: 'Tuition Fees',
        term: 'Term 1',
        academicYear: '2024',
        reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        phoneNumber: paymentMethod === 'mpesa' ? phoneNumber : undefined,
        transactionId: paymentMethod === 'manual' ? transactionId : undefined,
        status: 'completed',
        issuedAt: new Date(),
        issuedBy: 'School System',
        schoolName: 'Demo School',
        studentName: 'Demo Student',
        currency: 'KES'
      }

      setReceiptData(receipt)
      setShowReceipt(true)

      toast.success('Payment completed successfully! Receipt generated.')
    } catch (error) {
      toast.error('Payment failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadReceipt = () => {
    if (!receiptData) return
    
    const receiptContent = `
Payment Receipt

School: ${receiptData.schoolName}
Receipt #: ${receiptData.receiptNumber}

Student Information:
- Student ID: ${receiptData.studentId}
- Student Name: ${receiptData.studentName}

Payment Details:
- Fee Type: ${receiptData.feeType}
- Term: ${receiptData.term}
- Academic Year: ${receiptData.academicYear}
- Payment Method: ${receiptData.paymentMethod.toUpperCase()}
${receiptData.phoneNumber ? `- Phone Number: ${receiptData.phoneNumber}` : ''}
${receiptData.transactionId ? `- Transaction ID: ${receiptData.transactionId}` : ''}
- Reference: ${receiptData.reference}
- Status: ${receiptData.status.toUpperCase()}

Total Amount: ${receiptData.currency} ${receiptData.amount.toLocaleString()}

Issued on: ${receiptData.issuedAt.toLocaleDateString()}
Issued by: ${receiptData.issuedBy}

Thank you for your payment!
    `

    const blob = new Blob([receiptContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `receipt-${receiptData.receiptNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success("Receipt downloaded successfully!")
  }

  if (showReceipt && receiptData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center border-b">
            <CardTitle className="text-xl font-bold">{receiptData.schoolName}</CardTitle>
            <p className="text-sm text-gray-600">Payment Receipt</p>
            <p className="text-xs text-gray-500">Receipt #: {receiptData.receiptNumber}</p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Student ID:</span>
                <p>{receiptData.studentId}</p>
              </div>
              <div>
                <span className="font-medium">Student Name:</span>
                <p>{receiptData.studentName}</p>
              </div>
              <div>
                <span className="font-medium">Fee Type:</span>
                <p>{receiptData.feeType}</p>
              </div>
              <div>
                <span className="font-medium">Term:</span>
                <p>{receiptData.term}</p>
              </div>
              <div>
                <span className="font-medium">Academic Year:</span>
                <p>{receiptData.academicYear}</p>
              </div>
              <div>
                <span className="font-medium">Payment Method:</span>
                <p className="uppercase">{receiptData.paymentMethod}</p>
              </div>
              {receiptData.phoneNumber && (
                <div>
                  <span className="font-medium">Phone Number:</span>
                  <p>{receiptData.phoneNumber}</p>
                </div>
              )}
              {receiptData.transactionId && (
                <div>
                  <span className="font-medium">Transaction ID:</span>
                  <p>{receiptData.transactionId}</p>
                </div>
              )}
              <div className="col-span-2">
                <span className="font-medium">Reference:</span>
                <p className="text-xs">{receiptData.reference}</p>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <p className="uppercase font-bold text-green-600">{receiptData.status}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total Amount:</span>
                <span>{receiptData.currency} {receiptData.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Issued on: {receiptData.issuedAt.toLocaleDateString()}</p>
              <p>Issued by: {receiptData.issuedBy}</p>
              <p className="font-medium">Thank you for your payment!</p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownloadReceipt} className="flex-1" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Receipt
              </Button>
              <Button onClick={() => setShowReceipt(false)} className="flex-1">
                New Payment
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Test Payment System
          </CardTitle>
          <p className="text-sm text-gray-600">
            This is a development simulation for testing payments and receipt generation.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Amount Selection */}
          <div className="space-y-2">
            <Label>Payment Amount</Label>
            <div className="flex gap-2">
              <Button
                variant={!showCustomAmount ? "default" : "outline"}
                onClick={() => setShowCustomAmount(false)}
                className="flex-1"
              >
                Full Amount: KES {amount.toLocaleString()}
              </Button>
              <Button
                variant={showCustomAmount ? "default" : "outline"}
                onClick={() => setShowCustomAmount(true)}
                className="flex-1"
              >
                Custom Amount
              </Button>
            </div>
            
            {showCustomAmount && (
              <div className="space-y-2">
                <Label htmlFor="customAmount">Enter Amount (KES)</Label>
                <Input
                  id="customAmount"
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  min="1"
                  max={amount}
                />
                <p className="text-sm text-gray-500">
                  Maximum amount: KES {amount.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(value: 'mpesa' | 'manual') => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mpesa">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    M-Pesa (Simulated)
                  </div>
                </SelectItem>
                <SelectItem value="manual">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Manual Payment
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Specific Fields */}
          {paymentMethod === 'mpesa' ? (
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number (M-Pesa)</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="254700000000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                Enter any phone number for simulation
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                type="text"
                placeholder="Enter transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                required
              />
              <p className="text-sm text-gray-500">
                Enter any transaction ID for simulation
              </p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Payment Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Fee Type:</span>
                <span>Tuition Fees</span>
              </div>
              <div className="flex justify-between">
                <span>Term:</span>
                <span>Term 1</span>
              </div>
              <div className="flex justify-between">
                <span>Academic Year:</span>
                <span>2024</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total Amount:</span>
                <span>KES {customAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handlePayment} 
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </>
            ) : (
              <>
                <Receipt className="w-4 h-4 mr-2" />
                Simulate Payment
              </>
            )}
          </Button>

          <div className="text-center text-xs text-gray-500">
            This is a development simulation. No real payments will be processed.
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 