"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Phone, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

interface SimplePaymentFormProps {
  schoolCode: string
  studentId: string
  amount: number
  description: string
  onPaymentSuccess?: (payment: any) => void
  onPaymentError?: (error: string) => void
}

export function SimplePaymentForm({ 
  schoolCode, 
  studentId, 
  amount, 
  description,
  onPaymentSuccess,
  onPaymentError 
}: SimplePaymentFormProps) {
  const { toast } = useToast()
  const [paymentType, setPaymentType] = useState<'semi_automated' | 'daraja'>('daraja')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [receivedBy, setReceivedBy] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
  const [transactionId, setTransactionId] = useState('')

  const handlePayment = async () => {
    setIsLoading(true)
    setPaymentStatus('processing')

    try {
      const response = await fetch(`/api/schools/${schoolCode}/students/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId,
          paymentType,
          amount,
          phoneNumber: paymentType === 'daraja' ? phoneNumber : undefined,
          description,
          paymentMethod: paymentType === 'semi_automated' ? paymentMethod : undefined,
          receivedBy: paymentType === 'semi_automated' ? receivedBy : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPaymentStatus('success')
        if (paymentType === 'daraja') {
          setTransactionId(result.data.transactionId)
          toast({
            title: "Payment Request Sent!",
            description: "Please check your phone for M-Pesa prompt and complete the payment.",
          })
        } else {
          toast({
            title: "Payment Recorded!",
            description: "Payment has been recorded successfully.",
          })
        }
        onPaymentSuccess?.(result.data)
      } else {
        setPaymentStatus('error')
        toast({
          title: "Payment Failed",
          description: result.error || "Failed to process payment",
          variant: "destructive",
        })
        onPaymentError?.(result.error)
      }
    } catch (error) {
      setPaymentStatus('error')
      console.error('Payment error:', error)
      toast({
        title: "Payment Failed",
        description: "An error occurred while processing payment",
        variant: "destructive",
      })
      onPaymentError?.('Payment processing failed')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyPayment = async () => {
    if (!transactionId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/schools/${schoolCode}/students/payments/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checkoutRequestId: transactionId,
        }),
      })

      const result = await response.json()

      if (result.success && result.data.status === 'completed') {
        toast({
          title: "Payment Confirmed!",
          description: "Payment has been successfully processed.",
        })
        onPaymentSuccess?.(result.data)
      } else {
        toast({
          title: "Payment Pending",
          description: "Payment is still being processed. Please try again in a moment.",
        })
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast({
        title: "Verification Failed",
        description: "Failed to verify payment status",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Payment Type Selection */}
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select value={paymentType} onValueChange={(value: 'semi_automated' | 'daraja') => setPaymentType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daraja">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                M-Pesa
              </div>
            </SelectItem>
            <SelectItem value="semi_automated">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Manual Payment
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payment Type Specific Fields */}
      {paymentType === 'daraja' ? (
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
            Enter the phone number registered with M-Pesa
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="check">Check</SelectItem>
            </SelectContent>
          </Select>

          <Label htmlFor="receivedBy">Received By</Label>
          <Input
            id="receivedBy"
            placeholder="Admin name"
            value={receivedBy}
            onChange={(e) => setReceivedBy(e.target.value)}
          />
        </div>
      )}

      {/* Payment Status */}
      {paymentStatus === 'success' && paymentType === 'daraja' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Payment Request Sent</span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              Check your phone for M-Pesa prompt
            </p>
            <Button 
              onClick={verifyPayment} 
              disabled={isLoading}
              className="mt-2"
              size="sm"
            >
              {isLoading ? 'Verifying...' : 'Verify Payment'}
            </Button>
          </CardContent>
        </Card>
      )}

      {paymentStatus === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Payment Failed</span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Please try again or contact support
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      {paymentStatus !== 'success' && (
        <Button 
          onClick={handlePayment} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Processing...' : paymentType === 'daraja' ? 'Pay with M-Pesa' : 'Record Payment'}
        </Button>
      )}
    </div>
  )
} 