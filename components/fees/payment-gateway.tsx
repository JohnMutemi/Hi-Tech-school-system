"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  DollarSign, 
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Lock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PaymentGatewayProps {
  amount: number
  studentName: string
  onPaymentSuccess: (paymentDetails: any) => void
  onPaymentFailed: (error: string) => void
  onCancel: () => void
  schoolTheme?: string
}

const paymentMethods = [
  {
    id: "mobile_money",
    name: "Mobile Money",
    icon: Smartphone,
    description: "M-Pesa, Airtel Money, etc.",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: Building,
    description: "Direct bank transfer",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  {
    id: "cash",
    name: "Cash",
    icon: DollarSign,
    description: "Physical cash payment",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  {
    id: "check",
    name: "Check",
    icon: FileText,
    description: "Bank check payment",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  }
]

export function PaymentGateway({ 
  amount, 
  studentName, 
  onPaymentSuccess, 
  onPaymentFailed, 
  onCancel,
  schoolTheme = "#3b82f6"
}: PaymentGatewayProps) {
  const { toast } = useToast()
  const [selectedMethod, setSelectedMethod] = useState("mobile_money")
  const [paymentStep, setPaymentStep] = useState<"method" | "details" | "processing" | "success" | "failed">("method")
  const [paymentDetails, setPaymentDetails] = useState({
    phoneNumber: "",
    accountNumber: "",
    checkNumber: "",
    referenceNumber: "",
    payerName: "",
    payerPhone: "",
    payerEmail: ""
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState("")

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod)

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId)
    setPaymentStep("details")
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPaymentStep("processing")
    setIsProcessing(true)

    // Simulate payment processing steps
    const steps = [
      "Validating payment details...",
      "Connecting to payment gateway...",
      "Processing transaction...",
      "Confirming payment...",
      "Generating receipt..."
    ]

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i])
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))
    }

    // Simulate success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1

    if (isSuccess) {
      setPaymentStep("success")
      const paymentResult = {
        transactionId: `TXN${Date.now()}`,
        amount,
        method: selectedMethod,
        reference: paymentDetails.referenceNumber || `REF${Date.now()}`,
        timestamp: new Date().toISOString(),
        status: "completed"
      }
      
      setTimeout(() => {
        onPaymentSuccess(paymentResult)
      }, 2000)
    } else {
      setPaymentStep("failed")
      setTimeout(() => {
        onPaymentFailed("Payment was declined. Please try again.")
      }, 2000)
    }

    setIsProcessing(false)
  }

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Select Payment Method</h3>
        <p className="text-gray-600">Choose your preferred payment method</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => {
          const Icon = method.icon
          return (
            <div
              key={method.id}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedMethod === method.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleMethodSelect(method.id)}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${method.color}`} />
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderPaymentDetails = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Payment Details</h3>
        <p className="text-gray-600">Complete your payment information</p>
      </div>

      <form onSubmit={handlePaymentSubmit} className="space-y-4">
        {selectedMethod === "mobile_money" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={paymentDetails.phoneNumber}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, phoneNumber: e.target.value })}
                placeholder="e.g., 254700000000"
                required
              />
            </div>
            <div>
              <Label htmlFor="payerName">Payer Name</Label>
              <Input
                id="payerName"
                value={paymentDetails.payerName}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, payerName: e.target.value })}
                placeholder="Full name of person making payment"
                required
              />
            </div>
          </div>
        )}

        {selectedMethod === "bank_transfer" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={paymentDetails.accountNumber}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                placeholder="Bank account number"
                required
              />
            </div>
            <div>
              <Label htmlFor="payerName">Account Holder Name</Label>
              <Input
                id="payerName"
                value={paymentDetails.payerName}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, payerName: e.target.value })}
                placeholder="Name on bank account"
                required
              />
            </div>
          </div>
        )}

        {selectedMethod === "check" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="checkNumber">Check Number</Label>
              <Input
                id="checkNumber"
                value={paymentDetails.checkNumber}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, checkNumber: e.target.value })}
                placeholder="Check number"
                required
              />
            </div>
            <div>
              <Label htmlFor="payerName">Payer Name</Label>
              <Input
                id="payerName"
                value={paymentDetails.payerName}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, payerName: e.target.value })}
                placeholder="Name on check"
                required
              />
            </div>
          </div>
        )}

        {selectedMethod === "cash" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="payerName">Payer Name</Label>
              <Input
                id="payerName"
                value={paymentDetails.payerName}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, payerName: e.target.value })}
                placeholder="Full name of person paying"
                required
              />
            </div>
            <div>
              <Label htmlFor="payerPhone">Payer Phone</Label>
              <Input
                id="payerPhone"
                value={paymentDetails.payerPhone}
                onChange={(e) => setPaymentDetails({ ...paymentDetails, payerPhone: e.target.value })}
                placeholder="Phone number for receipt"
              />
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
          <Input
            id="referenceNumber"
            value={paymentDetails.referenceNumber}
            onChange={(e) => setPaymentDetails({ ...paymentDetails, referenceNumber: e.target.value })}
            placeholder="Transaction reference or receipt number"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="outline" onClick={() => setPaymentStep("method")}>
            Back
          </Button>
          <Button type="submit" style={{ backgroundColor: schoolTheme }}>
            Process Payment
          </Button>
        </div>
      </form>
    </div>
  )

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
      <div>
        <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
        <p className="text-gray-600 mb-4">{processingStep}</p>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Amount:</span>
            <span className="font-semibold">KES {amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Method:</span>
            <span className="capitalize">{selectedMethod.replace('_', ' ')}</span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-green-600 mb-2">Payment Successful!</h3>
        <p className="text-gray-600 mb-4">Your payment has been processed successfully.</p>
        <div className="bg-green-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm font-medium">Amount:</span>
            <span className="font-semibold">KES {amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Method:</span>
            <span className="capitalize">{selectedMethod.replace('_', ' ')}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
          </div>
        </div>
      </div>
    </div>
  )

  const renderFailed = () => (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-red-600 mb-2">Payment Failed</h3>
        <p className="text-gray-600 mb-4">Your payment could not be processed. Please try again.</p>
        <div className="space-y-3">
          <Button onClick={() => setPaymentStep("method")} variant="outline">
            Try Again
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-blue-600 mr-2" />
          <Lock className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle>Secure Payment Gateway</CardTitle>
        <CardDescription>
          Pay fees for {studentName}
        </CardDescription>
        <div className="bg-gray-50 rounded-lg p-3 mt-4">
          <div className="text-2xl font-bold text-gray-900">
            KES {amount.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {paymentStep === "method" && renderMethodSelection()}
        {paymentStep === "details" && renderPaymentDetails()}
        {paymentStep === "processing" && renderProcessing()}
        {paymentStep === "success" && renderSuccess()}
        {paymentStep === "failed" && renderFailed()}
      </CardContent>
    </Card>
  )
} 