"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle, 
  Info,
  Eye,
  EyeOff,
  Copy,
  Phone,
  DollarSign,
  Loader2
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface PaymentMethodConfig {
  id: string
  methodType: string
  displayName: string
  configuration: any
  instructions?: string
  isDefault: boolean
  isActive: boolean
}

interface SchoolPaymentMethodsProps {
  schoolCode: string
  studentId: string
  amount: number
  onPaymentMethodSelect: (method: PaymentMethodConfig, paymentData: any) => void
  selectedMethod?: string
}

export default function SchoolPaymentMethods({ 
  schoolCode, 
  studentId, 
  amount, 
  onPaymentMethodSelect,
  selectedMethod 
}: SchoolPaymentMethodsProps) {
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMethodId, setSelectedMethodId] = useState<string>(selectedMethod || "")
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedMethodForDetails, setSelectedMethodForDetails] = useState<PaymentMethodConfig | null>(null)
  const [paymentData, setPaymentData] = useState<any>({})
  const [showSensitiveData, setShowSensitiveData] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchPaymentMethods()
  }, [schoolCode])

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/schools/${schoolCode}/payment-methods`)
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data)
        
        // Auto-select default method if available
        const defaultMethod = data.find((m: PaymentMethodConfig) => m.isDefault)
        if (defaultMethod && !selectedMethod) {
          setSelectedMethodId(defaultMethod.id)
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch payment methods",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      toast({
        title: "Error",
        description: "Failed to fetch payment methods",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case 'mpesa_paybill':
      case 'mpesa_till':
        return Smartphone
      case 'equity_bank':
      case 'kcb_bank':
      case 'cooperative_bank':
        return Building2
      default:
        return CreditCard
    }
  }

  const getMethodColor = (methodType: string) => {
    switch (methodType) {
      case 'mpesa_paybill':
      case 'mpesa_till':
        return 'from-green-500 to-green-600'
      case 'equity_bank':
        return 'from-red-500 to-red-600'
      case 'kcb_bank':
        return 'from-blue-500 to-blue-600'
      case 'cooperative_bank':
        return 'from-orange-500 to-orange-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const handleMethodSelect = (method: PaymentMethodConfig) => {
    setSelectedMethodId(method.id)
    setSelectedMethodForDetails(method)
    setShowDetailsDialog(true)
  }

  const handleProceedWithPayment = () => {
    if (selectedMethodForDetails) {
      onPaymentMethodSelect(selectedMethodForDetails, paymentData)
      setShowDetailsDialog(false)
    }
  }

  const toggleSensitiveDataVisibility = (key: string) => {
    setShowSensitiveData(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    })
  }

  const renderPaymentMethodCard = (method: PaymentMethodConfig) => {
    const Icon = getMethodIcon(method.methodType)
    const colorGradient = getMethodColor(method.methodType)
    const isSelected = selectedMethodId === method.id

    return (
      <Card 
        key={method.id} 
        className={`relative cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
          isSelected ? 'ring-2 ring-blue-500 shadow-lg' : ''
        }`}
        onClick={() => handleMethodSelect(method)}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${colorGradient}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{method.displayName}</h3>
                <p className="text-sm text-gray-600 capitalize">
                  {method.methodType.replace('_', ' ')}
                </p>
              </div>
            </div>
            {method.isDefault && (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Default
              </Badge>
            )}
          </div>

          {/* Quick Preview */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-sm text-gray-600 mb-2">Payment Details:</div>
            {method.methodType === 'mpesa_paybill' && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Business No:</span>
                  <span className="font-mono">{method.configuration.businessShortCode}</span>
                </div>
                {method.configuration.accountNumber && (
                  <div className="flex justify-between">
                    <span>Account:</span>
                    <span className="font-mono">{method.configuration.accountNumber}</span>
                  </div>
                )}
              </div>
            )}
            {method.methodType === 'mpesa_till' && (
              <div className="flex justify-between">
                <span>Till Number:</span>
                <span className="font-mono">{method.configuration.tillNumber}</span>
              </div>
            )}
            {(method.methodType.includes('bank')) && (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Account:</span>
                  <span className="font-mono">{method.configuration.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Branch:</span>
                  <span>{method.configuration.branchName}</span>
                </div>
              </div>
            )}
          </div>

          <Button 
            className="w-full"
            variant={isSelected ? "default" : "outline"}
          >
            {isSelected ? 'Selected' : 'Select This Method'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const renderPaymentDetails = () => {
    if (!selectedMethodForDetails) return null

    const method = selectedMethodForDetails

    return (
      <div className="space-y-6">
        {/* Payment Summary */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Payment Summary</h3>
              <div className="text-3xl font-bold text-blue-800">
                KES {amount.toLocaleString()}
              </div>
              <p className="text-blue-700 mt-1">Amount to Pay</p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              Payment Details for {method.displayName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Method-specific details */}
            {method.methodType === 'mpesa_paybill' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Business Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={method.configuration.businessShortCode} 
                        readOnly 
                        className="font-mono"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(method.configuration.businessShortCode)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {method.configuration.accountNumber && (
                    <div>
                      <Label>Account Number</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input 
                          value={method.configuration.accountNumber} 
                          readOnly 
                          className="font-mono"
                        />
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(method.configuration.accountNumber)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Phone number input for M-PESA */}
                <div>
                  <Label htmlFor="phoneNumber">Your M-PESA Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="e.g., 0712345678"
                    value={paymentData.phoneNumber || ''}
                    onChange={(e) => setPaymentData({...paymentData, phoneNumber: e.target.value})}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter the phone number registered with M-PESA
                  </p>
                </div>
              </div>
            )}

            {method.methodType === 'mpesa_till' && (
              <div className="space-y-4">
                <div>
                  <Label>Till Number</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      value={method.configuration.tillNumber} 
                      readOnly 
                      className="font-mono text-lg font-bold"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(method.configuration.tillNumber)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Store Name</Label>
                  <Input value={method.configuration.storeName} readOnly className="mt-1" />
                </div>
              </div>
            )}

            {method.methodType.includes('bank') && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Account Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={method.configuration.accountNumber} 
                        readOnly 
                        className="font-mono"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(method.configuration.accountNumber)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Account Name</Label>
                    <Input value={method.configuration.accountName} readOnly className="mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Branch Code</Label>
                    <Input value={method.configuration.branchCode} readOnly className="mt-1" />
                  </div>
                  <div>
                    <Label>Branch Name</Label>
                    <Input value={method.configuration.branchName} readOnly className="mt-1" />
                  </div>
                </div>
                {method.configuration.paybill && (
                  <div>
                    <Label>Paybill Number</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={method.configuration.paybill} 
                        readOnly 
                        className="font-mono"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(method.configuration.paybill)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            {method.instructions && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <Label className="text-blue-900 font-semibold">Payment Instructions</Label>
                <div className="text-blue-800 text-sm mt-2 whitespace-pre-wrap">
                  {method.instructions}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mr-3" />
          <span>Loading payment methods...</span>
        </CardContent>
      </Card>
    )
  }

  if (paymentMethods.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Methods Available</h3>
          <p className="text-gray-600">
            The school has not configured any payment methods yet. Please contact the school administration.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Select Payment Method
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map(renderPaymentMethodCard)}
          </div>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Your Payment</DialogTitle>
            <DialogDescription>
              Review the payment details and proceed with your payment.
            </DialogDescription>
          </DialogHeader>
          
          {renderPaymentDetails()}
          
          <div className="flex gap-3 pt-6">
            <Button 
              onClick={handleProceedWithPayment}
              className="flex-1"
              disabled={
                selectedMethodForDetails?.methodType.includes('mpesa') && 
                !paymentData.phoneNumber
              }
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Proceed with Payment
            </Button>
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


