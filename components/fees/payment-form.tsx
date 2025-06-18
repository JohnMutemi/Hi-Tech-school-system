"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  DollarSign, 
  Smartphone, 
  Building, 
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentFormProps {
  studentId: string
  studentName: string
  currentBalance: number
  onPaymentSubmitted: (payment: any) => void
  onCancel: () => void
  schoolTheme?: string
}

const paymentMethods = [
  {
    id: "mobile_money",
    name: "Mobile Money",
    icon: Smartphone,
    description: "M-Pesa, Airtel Money, etc.",
    color: "text-green-600"
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: Building,
    description: "Direct bank transfer",
    color: "text-blue-600"
  },
  {
    id: "cash",
    name: "Cash",
    icon: DollarSign,
    description: "Physical cash payment",
    color: "text-green-600"
  },
  {
    id: "check",
    name: "Check",
    icon: FileText,
    description: "Bank check payment",
    color: "text-purple-600"
  }
]

export function PaymentForm({ 
  studentId, 
  studentName, 
  currentBalance, 
  onPaymentSubmitted, 
  onCancel,
  schoolTheme = "#3b82f6"
}: PaymentFormProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    amount: "",
    paymentMethod: "mobile_money",
    referenceNumber: "",
    description: "",
    receivedBy: "",
    notes: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = "Please enter a valid amount"
    }

    if (parseFloat(formData.amount) > currentBalance) {
      newErrors.amount = "Payment amount cannot exceed current balance"
    }

    if (!formData.receivedBy.trim()) {
      newErrors.receivedBy = "Please enter who received the payment"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const payment = {
        id: `payment_${Date.now()}`,
        studentId,
        amount: parseFloat(formData.amount),
        paymentDate: new Date().toISOString(),
        paymentMethod: formData.paymentMethod,
        referenceNumber: formData.referenceNumber,
        description: formData.description || `Payment for ${studentName}`,
        receivedBy: formData.receivedBy,
        notes: formData.notes,
        createdAt: new Date().toISOString()
      }

      onPaymentSubmitted(payment)
      
      toast({
        title: "Payment Recorded",
        description: "Payment has been successfully recorded",
      })

    } catch (error) {
      console.error("Error recording payment:", error)
      toast({
        title: "Error",
        description: "Failed to record payment. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "")
    
    // Ensure only one decimal point
    const parts = cleanValue.split(".")
    if (parts.length > 2) {
      return
    }
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) {
      return
    }

    setFormData({ ...formData, amount: cleanValue })
    
    // Clear amount error when user starts typing
    if (errors.amount) {
      setErrors({ ...errors, amount: "" })
    }
  }

  const selectedMethod = paymentMethods.find(m => m.id === formData.paymentMethod)

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Record Payment
        </CardTitle>
        <CardDescription>
          Record a new payment for {studentName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Balance Display */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Current Balance:</span>
              <Badge variant="outline" className="text-lg font-semibold">
                KES {currentBalance.toLocaleString()}
              </Badge>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount (KES) *</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                KES
              </span>
              <Input
                id="amount"
                type="text"
                value={formData.amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="pl-12"
                required
              />
            </div>
            {errors.amount && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.amount}
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method *</Label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon
                return (
                  <div
                    key={method.id}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.paymentMethod === method.id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setFormData({ ...formData, paymentMethod: method.id })}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${method.color}`} />
                      <div>
                        <p className="font-medium text-sm">{method.name}</p>
                        <p className="text-xs text-gray-500">{method.description}</p>
                      </div>
                    </div>
                    {formData.paymentMethod === method.id && (
                      <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-blue-500" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Reference Number */}
          <div className="space-y-2">
            <Label htmlFor="referenceNumber">Reference Number</Label>
            <Input
              id="referenceNumber"
              value={formData.referenceNumber}
              onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
              placeholder="Transaction reference or receipt number"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Payment Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this payment is for"
              rows={2}
            />
          </div>

          {/* Received By */}
          <div className="space-y-2">
            <Label htmlFor="receivedBy">Received By *</Label>
            <Input
              id="receivedBy"
              value={formData.receivedBy}
              onChange={(e) => setFormData({ ...formData, receivedBy: e.target.value })}
              placeholder="Staff member who received the payment"
              required
            />
            {errors.receivedBy && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />
                {errors.receivedBy}
              </div>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes or comments"
              rows={2}
            />
          </div>

          {/* Payment Summary */}
          {formData.amount && parseFloat(formData.amount) > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-2">
              <h4 className="font-medium text-blue-900">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Amount:</span>
                  <span className="font-semibold">KES {parseFloat(formData.amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Method:</span>
                  <span className="capitalize">{selectedMethod?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">New Balance:</span>
                  <span className="font-semibold">
                    KES {(currentBalance - parseFloat(formData.amount)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.amount || parseFloat(formData.amount) <= 0}
              style={{ backgroundColor: schoolTheme }}
            >
              {isSubmitting ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 