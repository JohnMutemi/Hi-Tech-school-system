"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  CreditCard, 
  Phone, 
  DollarSign, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  Receipt as ReceiptIcon
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import SchoolPaymentMethods from "./SchoolPaymentMethods"
import ReceiptComponent from "./ReceiptComponent"

interface PaymentMethodConfig {
  id: string
  methodType: string
  displayName: string
  configuration: any
  instructions?: string
  isDefault: boolean
  isActive: boolean
}

interface EnhancedPaymentHubProps {
  studentId: string
  schoolCode: string
  initialSelectedTerm?: string
  initialAmount?: number
  initialAcademicYear?: string
  onPaymentComplete?: (receipt: any) => void
}

interface PaymentState {
  selectedMethod: PaymentMethodConfig | null
  paymentAmount: number
  additionalData: any
  isProcessing: boolean
  currentStep: 'method' | 'details' | 'processing' | 'complete'
}

export default function EnhancedPaymentHub({
  studentId,
  schoolCode,
  initialSelectedTerm,
  initialAmount = 0,
  initialAcademicYear,
  onPaymentComplete
}: EnhancedPaymentHubProps) {
  const { toast } = useToast()
  const [paymentState, setPaymentState] = useState<PaymentState>({
    selectedMethod: null,
    paymentAmount: initialAmount,
    additionalData: {},
    isProcessing: false,
    currentStep: 'method'
  })
  const [balanceData, setBalanceData] = useState<any>(null)
  const [loadingBalance, setLoadingBalance] = useState(true)
  const [receiptData, setReceiptData] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  useEffect(() => {
    fetchBalanceData()
  }, [studentId, schoolCode])

  const fetchBalanceData = async () => {
    try {
      setLoadingBalance(true)
      const response = await fetch(`/api/schools/${schoolCode}/students/${studentId}/balance`)
      if (response.ok) {
        const data = await response.json()
        setBalanceData(data)
      }
    } catch (error) {
      console.error('Error fetching balance data:', error)
    } finally {
      setLoadingBalance(false)
    }
  }

  const handlePaymentMethodSelect = (method: PaymentMethodConfig, paymentData: any) => {
    setPaymentState(prev => ({
      ...prev,
      selectedMethod: method,
      additionalData: paymentData,
      currentStep: 'details'
    }))
  }

  const handleAmountChange = (amount: string) => {
    const numAmount = parseFloat(amount) || 0
    setPaymentState(prev => ({
      ...prev,
      paymentAmount: numAmount
    }))
  }

  const processPayment = async () => {
    if (!paymentState.selectedMethod || !paymentState.paymentAmount) {
      toast({
        title: "Error",
        description: "Please select a payment method and enter an amount",
        variant: "destructive"
      })
      return
    }

    setPaymentState(prev => ({ ...prev, isProcessing: true, currentStep: 'processing' }))

    try {
      // Prepare payment request based on method type
      const paymentRequest: any = {
        studentId,
        amount: paymentState.paymentAmount,
        paymentMethod: paymentState.selectedMethod.methodType,
        feeType: 'School Fees',
        term: initialSelectedTerm || 'Current',
        academicYear: initialAcademicYear || new Date().getFullYear().toString(),
        description: `Payment via ${paymentState.selectedMethod.displayName}`,
        paymentMethodId: paymentState.selectedMethod.id,
        ...paymentState.additionalData
      }

      // Add method-specific data
      if (paymentState.selectedMethod.methodType.includes('mpesa')) {
        paymentRequest.phoneNumber = paymentState.additionalData.phoneNumber
      }

      const response = await fetch(`/api/schools/${schoolCode}/students/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentRequest),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payment failed')
      }

      const result = await response.json()
      
      // Set receipt data and show receipt
      setReceiptData({
        ...result,
        studentId,
        amount: paymentState.paymentAmount,
        paymentMethod: paymentState.selectedMethod.displayName,
        timestamp: new Date().toISOString()
      })
      
      setPaymentState(prev => ({ ...prev, currentStep: 'complete' }))
      setShowReceipt(true)
      
      // Refresh balance data
      await fetchBalanceData()
      
      // Call completion callback
      if (onPaymentComplete) {
        onPaymentComplete(result)
      }

      toast({
        title: "Payment Successful",
        description: `Payment of KES ${paymentState.paymentAmount.toLocaleString()} processed successfully`,
      })

    } catch (error) {
      console.error('Payment processing error:', error)
      toast({
        title: "Payment Failed",
        description: error instanceof Error ? error.message : "Payment processing failed",
        variant: "destructive"
      })
      setPaymentState(prev => ({ ...prev, currentStep: 'details' }))
    } finally {
      setPaymentState(prev => ({ ...prev, isProcessing: false }))
    }
  }

  const resetPayment = () => {
    setPaymentState({
      selectedMethod: null,
      paymentAmount: initialAmount,
      additionalData: {},
      isProcessing: false,
      currentStep: 'method'
    })
  }

  const renderStepIndicator = () => {
    const steps = [
      { id: 'method', label: 'Payment Method', icon: CreditCard },
      { id: 'details', label: 'Payment Details', icon: DollarSign },
      { id: 'processing', label: 'Processing', icon: Loader2 },
      { id: 'complete', label: 'Complete', icon: CheckCircle }
    ]

    const currentStepIndex = steps.findIndex(step => step.id === paymentState.currentStep)

    return (
      <div className="flex items-center justify-center mb-6">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index <= currentStepIndex
          const isCurrent = step.id === paymentState.currentStep
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                isActive 
                  ? 'bg-blue-500 border-blue-500 text-white' 
                  : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                <Icon className={`w-5 h-5 ${isCurrent && step.id === 'processing' ? 'animate-spin' : ''}`} />
              </div>
              <div className="ml-2 mr-4">
                <div className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>
                  {step.label}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-2 ${
                  index < currentStepIndex ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderMethodSelection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Payment Method</CardTitle>
          <CardDescription>
            Select from the payment methods configured by your school
          </CardDescription>
        </CardHeader>
      </Card>
      
      <SchoolPaymentMethods
        schoolCode={schoolCode}
        studentId={studentId}
        amount={paymentState.paymentAmount}
        onPaymentMethodSelect={handlePaymentMethodSelect}
      />
    </div>
  )

  const renderPaymentDetails = () => (
    <div className="space-y-6">
      {/* Selected Method Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Selected Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{paymentState.selectedMethod?.displayName}</h3>
              <p className="text-sm text-gray-600 capitalize">
                {paymentState.selectedMethod?.methodType.replace('_', ' ')}
              </p>
            </div>
            <Button variant="outline" onClick={resetPayment}>
              Change Method
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payment Amount */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                value={paymentState.paymentAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="text-lg font-semibold"
                min="1"
                step="0.01"
              />
            </div>
            
            {/* Balance Display */}
            {balanceData && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Current Balance</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Term Balance:</span>
                    <div className="font-bold text-blue-900">
                      KES {balanceData.termBalance?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700">Year Balance:</span>
                    <div className="font-bold text-blue-900">
                      KES {balanceData.academicYearBalance?.toLocaleString() || '0'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Action */}
      <Card>
        <CardContent className="pt-6">
          <Button 
            onClick={processPayment}
            disabled={paymentState.isProcessing || !paymentState.paymentAmount}
            className="w-full py-3 text-lg font-semibold"
          >
            {paymentState.isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pay KES {paymentState.paymentAmount.toLocaleString()}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )

  const renderProcessing = () => (
    <Card className="text-center py-12">
      <CardContent>
        <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
        <h3 className="text-xl font-semibold mb-2">Processing Your Payment</h3>
        <p className="text-gray-600">
          Please wait while we process your payment of KES {paymentState.paymentAmount.toLocaleString()}
        </p>
        <div className="mt-4">
          <Badge variant="outline" className="bg-blue-50">
            {paymentState.selectedMethod?.displayName}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )

  const renderComplete = () => (
    <Card className="text-center py-12">
      <CardContent>
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
        <h3 className="text-xl font-semibold mb-2 text-green-800">Payment Successful!</h3>
        <p className="text-gray-600 mb-6">
          Your payment of KES {paymentState.paymentAmount.toLocaleString()} has been processed successfully.
        </p>
        <div className="space-y-3">
          <Button onClick={() => setShowReceipt(true)} className="mr-3">
            <ReceiptIcon className="w-4 h-4 mr-2" />
            View Receipt
          </Button>
          <Button variant="outline" onClick={resetPayment}>
            Make Another Payment
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loadingBalance) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Loading payment information...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Current Step Content */}
      {paymentState.currentStep === 'method' && renderMethodSelection()}
      {paymentState.currentStep === 'details' && renderPaymentDetails()}
      {paymentState.currentStep === 'processing' && renderProcessing()}
      {paymentState.currentStep === 'complete' && renderComplete()}

      {/* Receipt Modal */}
      {showReceipt && receiptData && (
        <ReceiptComponent
          receiptData={receiptData}
          onClose={() => setShowReceipt(false)}
        />
      )}
    </div>
  )
}


