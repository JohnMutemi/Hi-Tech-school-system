"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Smartphone, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Loader2,
  AlertTriangle,
  CreditCard,
  Building2
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface MpesaConfig {
  id: string
  name: string
  type: 'paybill' | 'till' | 'buygoods'
  businessShortCode: string
  instructions?: string
  configuration: {
    displayName?: string
    accountType?: string
    businessShortCode?: string
  }
}

interface MpesaPaymentFormProps {
  schoolCode: string
  studentId: string
  paymentMethods: MpesaConfig[]
  amount: number
  description?: string
  onPaymentSuccess?: (data: any) => void
  onPaymentError?: (error: string) => void
}

interface PaymentStatus {
  status: 'idle' | 'initiating' | 'pending' | 'completed' | 'failed' | 'cancelled' | 'timeout'
  checkoutRequestID?: string
  customerMessage?: string
  mpesaReceiptNumber?: string
  error?: string
}

export function MpesaPaymentForm({ 
  schoolCode, 
  studentId, 
  paymentMethods, 
  amount, 
  description,
  onPaymentSuccess,
  onPaymentError 
}: MpesaPaymentFormProps) {
  const { toast } = useToast()
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [paymentType, setPaymentType] = useState<'stk' | 'card'>('stk')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'idle' })
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null)

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval)
      }
    }
  }, [statusCheckInterval])

  const formatPhoneNumber = (phone: string) => {
    // Remove any non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Format as Kenyan phone number
    if (digits.startsWith('254')) {
      return digits
    } else if (digits.startsWith('0')) {
      return '254' + digits.substring(1)
    } else if (digits.length === 9) {
      return '254' + digits
    }
    return digits
  }

  const validatePhoneNumber = (phone: string) => {
    const formatted = formatPhoneNumber(phone)
    return /^254[17]\d{8}$/.test(formatted)
  }

  const initiatePayment = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter your M-PESA phone number",
        variant: "destructive"
      })
      return
    }

    if (!selectedPaymentMethod) {
      toast({
        title: "Error",
        description: "Please select a payment method",
        variant: "destructive"
      })
      return
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Kenyan phone number (e.g., 0712345678)",
        variant: "destructive"
      })
      return
    }

    setPaymentStatus({ status: 'initiating' })

    try {
      const endpoint = paymentType === 'card' 
        ? `/api/schools/${schoolCode}/mpesa/card-payment`
        : `/api/schools/${schoolCode}/mpesa/initiate`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethodId: selectedPaymentMethod,
          studentId,
          amount,
          phoneNumber: formatPhoneNumber(phoneNumber),
          description,
          paymentType
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setPaymentStatus({
          status: 'pending',
          checkoutRequestID: data.checkoutRequestID || data.transactionId,
          customerMessage: data.customerMessage || data.message
        })

        toast({
          title: "Payment Initiated",
          description: data.customerMessage || data.message || "Check your phone for M-PESA prompt",
        })

        // Start checking payment status
        startStatusChecking(data.checkoutRequestID || data.transactionId)
      } else {
        throw new Error(data.error || 'Failed to initiate payment')
      }
    } catch (error: any) {
      console.error('Payment initiation error:', error)
      setPaymentStatus({ 
        status: 'failed', 
        error: error.message 
      })
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to initiate M-PESA payment",
        variant: "destructive"
      })
      onPaymentError?.(error.message)
    }
  }

  const startStatusChecking = (checkoutRequestID: string) => {
    let attempts = 0
    const maxAttempts = 30 // Check for 5 minutes (10 second intervals)

    const interval = setInterval(async () => {
      attempts++
      
      try {
        const response = await fetch(`/api/schools/${schoolCode}/mpesa/status/${checkoutRequestID}`)
        const statusData = await response.json()

        if (response.ok) {
          if (statusData.status === 'completed') {
            setPaymentStatus({
              status: 'completed',
              checkoutRequestID,
              mpesaReceiptNumber: statusData.mpesaReceiptNumber
            })
            clearInterval(interval)
            toast({
              title: "Payment Successful!",
              description: `Receipt: ${statusData.mpesaReceiptNumber}`,
            })
            onPaymentSuccess?.(statusData)
          } else if (statusData.status === 'failed' || statusData.status === 'cancelled' || statusData.status === 'timeout') {
            setPaymentStatus({
              status: statusData.status,
              checkoutRequestID,
              error: statusData.resultDesc
            })
            clearInterval(interval)
            toast({
              title: "Payment Failed",
              description: statusData.resultDesc || "Payment was not completed",
              variant: "destructive"
            })
            onPaymentError?.(statusData.resultDesc)
          }
        }

        // Stop checking after max attempts
        if (attempts >= maxAttempts) {
          setPaymentStatus({
            status: 'timeout',
            checkoutRequestID,
            error: 'Payment verification timed out'
          })
          clearInterval(interval)
          toast({
            title: "Payment Timeout",
            description: "Payment verification timed out. Please check your M-PESA messages.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Status check error:', error)
      }
    }, 10000) // Check every 10 seconds

    setStatusCheckInterval(interval)
  }

  const resetPayment = () => {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval)
      setStatusCheckInterval(null)
    }
    setPaymentStatus({ status: 'idle' })
    setPhoneNumber('')
  }

  const getStatusIcon = () => {
    switch (paymentStatus.status) {
      case 'initiating':
      case 'pending':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-6 h-6 text-red-600" />
      case 'timeout':
        return <Clock className="w-6 h-6 text-orange-600" />
      default:
        return <Smartphone className="w-6 h-6 text-gray-600" />
    }
  }

  const getStatusMessage = () => {
    switch (paymentStatus.status) {
      case 'initiating':
        return "Initiating M-PESA payment..."
      case 'pending':
        return "Check your phone for M-PESA prompt and enter your PIN"
      case 'completed':
        return `Payment successful! Receipt: ${paymentStatus.mpesaReceiptNumber}`
      case 'failed':
        return `Payment failed: ${paymentStatus.error}`
      case 'cancelled':
        return "Payment was cancelled"
      case 'timeout':
        return "Payment verification timed out"
      default:
        return "Ready to pay with M-PESA"
    }
  }

  const selectedMethod = paymentMethods.find(method => method.id === selectedPaymentMethod)

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-green-100">
            <Smartphone className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-xl">M-PESA Payment</CardTitle>
            <CardDescription>Secure mobile money payment</CardDescription>
          </div>
        </div>
        <div className="text-3xl font-bold text-green-600">
          KSh {amount.toLocaleString()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Type Selection */}
        <div className="space-y-3">
          <Label>Payment Type</Label>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={paymentType === 'stk' ? 'default' : 'outline'}
              className="h-16 flex flex-col gap-1"
              onClick={() => setPaymentType('stk')}
            >
              <Smartphone className="w-5 h-5" />
              <span className="text-xs">STK Push</span>
            </Button>
            <Button
              variant={paymentType === 'card' ? 'default' : 'outline'}
              className="h-16 flex flex-col gap-1"
              onClick={() => setPaymentType('card')}
            >
              <CreditCard className="w-5 h-5" />
              <span className="text-xs">M-PESA Card</span>
            </Button>
          </div>
        </div>

        {/* Payment Method Selection */}
        {paymentMethods.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Select Payment Method</Label>
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Choose payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    <div className="flex items-center gap-2">
                      {method.type === 'paybill' ? <Building2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      <span>{method.name}</span>
                      <span className="text-xs text-gray-500">({method.businessShortCode})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Payment Details */}
        {selectedMethod && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">{selectedMethod.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">{selectedMethod.type}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Number:</span>
              <span className="font-medium">{selectedMethod.businessShortCode}</span>
            </div>
            {description && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Description:</span>
                <span className="font-medium">{description}</span>
              </div>
            )}
          </div>
        )}

        {/* Status Display */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
          {getStatusIcon()}
          <div>
            <p className="text-sm font-medium">{getStatusMessage()}</p>
            {paymentStatus.customerMessage && (
              <p className="text-xs text-gray-600 mt-1">{paymentStatus.customerMessage}</p>
            )}
          </div>
        </div>

        {/* Phone Number Input */}
        {paymentStatus.status === 'idle' && (
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">M-PESA Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 0712345678"
              className="text-lg"
            />
            <p className="text-xs text-gray-500">
              Enter the phone number registered with M-PESA
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {paymentStatus.status === 'idle' && (
            <Button 
              onClick={initiatePayment}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
              disabled={!phoneNumber.trim() || !selectedPaymentMethod}
            >
              {paymentType === 'card' ? <CreditCard className="w-5 h-5 mr-2" /> : <Smartphone className="w-5 h-5 mr-2" />}
              {paymentType === 'card' ? 'Pay with M-PESA Card' : 'Pay with M-PESA'}
            </Button>
          )}

          {paymentStatus.status === 'pending' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Complete the payment on your phone. This page will update automatically when payment is confirmed.
              </AlertDescription>
            </Alert>
          )}

          {(paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled' || paymentStatus.status === 'timeout') && (
            <Button 
              onClick={resetPayment}
              variant="outline" 
              className="w-full"
            >
              Try Again
            </Button>
          )}

          {paymentStatus.status === 'completed' && (
            <div className="text-center">
              <Badge className="bg-green-100 text-green-800 px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                Payment Completed
              </Badge>
            </div>
          )}
        </div>

        {/* Instructions */}
        {selectedMethod?.instructions && (
          <div className="bg-blue-50 rounded-lg p-3">
            <h4 className="font-medium text-blue-900 mb-2">Payment Instructions:</h4>
            <div className="text-sm text-blue-800 whitespace-pre-wrap">
              {selectedMethod.instructions}
            </div>
          </div>
        )}

        {/* General Instructions */}
        <div className="bg-yellow-50 rounded-lg p-3">
          <h4 className="font-medium text-yellow-900 mb-2">Payment Tips:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Ensure you have sufficient M-PESA balance</li>
            <li>• {paymentType === 'stk' ? 'Check your phone for STK push prompt' : 'Have your M-PESA PIN ready for card payment'}</li>
            <li>• Payment confirmation will be sent via SMS</li>
            <li>• Keep your transaction receipt safe</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
