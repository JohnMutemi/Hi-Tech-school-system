"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  X,
  Building2,
  Smartphone,
  DollarSign,
  Settings,
  Eye,
  EyeOff,
  Shield
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
  createdAt: string
  updatedAt: string
}

interface PaymentMethodsSectionProps {
  schoolCode: string
  colorTheme?: string
}

const PAYMENT_METHOD_TYPES = [
  {
    value: 'mpesa_stk_push',
    label: 'M-PESA STK Push (Recommended)',
    icon: Smartphone,
    description: 'Lipa Na M-PESA Online with automatic verification and instant receipts',
    configFields: [
      { key: 'businessShortCode', label: 'Business Short Code (Paybill)', type: 'text', required: true, placeholder: 'e.g., 123456' },
      { key: 'passkey', label: 'Lipa Na M-PESA Passkey', type: 'password', required: true },
      { key: 'accountReference', label: 'Account Reference Prefix', type: 'text', required: false, placeholder: 'e.g., SCHOOL_FEES (optional)' }
    ],
    apiDocumentation: {
      title: 'M-PESA STK Push Setup',
      steps: [
        'Get a paybill number from Safaricom',
        'Register for Lipa Na M-PESA Online service',
        'Get your Business Short Code and Passkey from Safaricom',
        'Enter the details above to enable automatic payment verification'
      ],
      links: [
        { label: 'Safaricom Business Portal', url: 'https://www.safaricom.co.ke/business' },
        { label: 'Lipa Na M-PESA Guide', url: 'https://developer.safaricom.co.ke/lipa-na-m-pesa-online' }
      ]
    }
  },
  {
    value: 'mpesa_paybill_manual',
    label: 'M-PESA Paybill (Manual)',
    icon: Smartphone,
    description: 'Traditional paybill payments - requires manual verification by school',
    configFields: [
      { key: 'businessShortCode', label: 'Business Short Code (Paybill)', type: 'text', required: true, placeholder: 'e.g., 123456' },
      { key: 'accountNumber', label: 'Account Number (Optional)', type: 'text', required: false, placeholder: 'Leave blank to use student admission number' }
    ]
  },
  {
    value: 'mpesa_till_manual',
    label: 'M-PESA Till Number (Manual)',
    icon: Smartphone,
    description: 'Buy Goods and Services payments - requires manual verification by school',
    configFields: [
      { key: 'tillNumber', label: 'Till Number', type: 'text', required: true, placeholder: 'e.g., 123456' },
      { key: 'businessName', label: 'Business Name', type: 'text', required: true, placeholder: 'e.g., School Name' }
    ]
  }
]

export default function PaymentMethodsSection({ schoolCode, colorTheme }: PaymentMethodsSectionProps) {
  const { toast } = useToast()
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  // Form state
  const [formData, setFormData] = useState({
    methodType: '',
    displayName: '',
    configuration: {} as Record<string, string>,
    instructions: '',
    isDefault: false,
    isActive: true
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const method = editingMethod ? 'PUT' : 'POST'
      const url = editingMethod 
        ? `/api/schools/${schoolCode}/payment-methods/${editingMethod.id}`
        : `/api/schools/${schoolCode}/payment-methods`

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Payment method ${editingMethod ? 'updated' : 'created'} successfully`,
        })
        setIsDialogOpen(false)
        resetForm()
        fetchPaymentMethods()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to save payment method",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving payment method:', error)
      toast({
        title: "Error",
        description: "Failed to save payment method",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return
    }

    try {
      const response = await fetch(`/api/schools/${schoolCode}/payment-methods/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Payment method deleted successfully",
        })
        fetchPaymentMethods()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete payment method",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting payment method:', error)
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      methodType: '',
      displayName: '',
      configuration: {} as Record<string, string>,
      instructions: '',
      isDefault: false,
      isActive: true
    })
    setEditingMethod(null)
  }

  const openEditDialog = (method: PaymentMethodConfig) => {
    setEditingMethod(method)
    setFormData({
      methodType: method.methodType,
      displayName: method.displayName,
      configuration: method.configuration,
      instructions: method.instructions || '',
      isDefault: method.isDefault,
      isActive: method.isActive
    })
    setIsDialogOpen(true)
  }

  const openAddDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const getMethodTypeInfo = (type: string) => {
    return PAYMENT_METHOD_TYPES.find(t => t.value === type)
  }

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const getMethodIcon = (type: string) => {
    const methodInfo = getMethodTypeInfo(type)
    return methodInfo?.icon || CreditCard
  }

  const renderConfigurationForm = () => {
    const methodInfo = getMethodTypeInfo(formData.methodType)
    if (!methodInfo) return null

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Configuration Details</h4>
        {methodInfo.configFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="relative">
              {field.type === 'password' ? (
                <div className="relative">
                  <Input
                    id={field.key}
                    type={showPasswords[field.key] ? 'text' : 'password'}
                    value={formData.configuration[field.key] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      configuration: {
                        ...formData.configuration,
                        [field.key]: e.target.value
                      }
                    })}
                    required={field.required}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => togglePasswordVisibility(field.key)}
                  >
                    {showPasswords[field.key] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                <Input
                  id={field.key}
                  type={field.type}
                  value={formData.configuration[field.key] || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    configuration: {
                      ...formData.configuration,
                      [field.key]: e.target.value
                    }
                  })}
                  required={field.required}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">M-PESA Payment Setup</h2>
          <p className="text-gray-600 mt-2">Configure M-PESA payment methods for your school fees collection</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} style={{ backgroundColor: colorTheme }}>
              <Plus className="w-4 h-4 mr-2" />
              Add M-PESA Method
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? 'Edit M-PESA Method' : 'Add M-PESA Payment Method'}
              </DialogTitle>
              <DialogDescription>
                Configure an M-PESA payment method for your school fee collection system.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Method Type Selection */}
                              <div className="space-y-2">
                  <Label htmlFor="methodType">M-PESA Payment Type *</Label>
                  <Select
                    value={formData.methodType}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      methodType: value,
                      configuration: {} // Reset configuration when changing type
                    })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select M-PESA payment type" />
                    </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHOD_TYPES.map((type) => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-gray-500">{type.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                                  <Input
                    id="displayName"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g., School M-PESA Payments"
                    required
                  />
              </div>

              {/* Configuration Fields */}
              {formData.methodType && renderConfigurationForm()}

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor="instructions">Payment Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Instructions for parents on how to make M-PESA payments..."
                  rows={3}
                />
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isDefault">Set as Default</Label>
                    <p className="text-sm text-gray-500">This will be the primary payment method shown to parents</p>
                  </div>
                  <Switch
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="isActive">Active</Label>
                    <p className="text-sm text-gray-500">Parents can use this payment method</p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button type="submit" style={{ backgroundColor: colorTheme }}>
                  {editingMethod ? 'Update Method' : 'Add Method'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Payment Methods Grid */}
      {paymentMethods.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Smartphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No M-PESA Methods Configured</h3>
            <p className="text-gray-600 mb-4">Set up M-PESA payment methods to start collecting school fees online</p>
            <Button onClick={openAddDialog} style={{ backgroundColor: colorTheme }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First M-PESA Method
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paymentMethods.map((method) => {
            const Icon = getMethodIcon(method.methodType)
            const methodInfo = getMethodTypeInfo(method.methodType)
            
            return (
              <Card key={method.id} className={`relative ${method.isDefault ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100">
                        <Icon className="w-5 h-5" style={{ color: colorTheme }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{method.displayName}</CardTitle>
                        <CardDescription>{methodInfo?.label}</CardDescription>
                      </div>
                    </div>
                    {method.isDefault && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Default
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Configuration Preview */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {Object.entries(method.configuration).map(([key, value]) => {
                      const field = methodInfo?.configFields.find(f => f.key === key)
                      if (!field) return null
                      
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{field.label}:</span>
                          <span className="font-medium">
                            {field.type === 'password' ? '••••••••' : value as string}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Instructions Preview */}
                  {method.instructions && (
                    <div className="text-sm text-gray-600">
                      <p className="font-medium mb-1">Instructions:</p>
                      <p className="line-clamp-2">{method.instructions}</p>
                    </div>
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <Badge variant={method.isActive ? "default" : "secondary"}>
                      {method.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(method)}
                      className="flex-1"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(method.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">SaaS M-PESA Integration</h4>
              <div className="text-blue-800 text-sm space-y-2">
                <p>
                  <strong>🏫 Multi-School Platform:</strong> Each school configures their own M-PESA credentials. 
                  We provide the payment infrastructure while schools maintain their own merchant accounts.
                </p>
                <p>
                  <strong>🔐 Secure:</strong> All API credentials are encrypted and stored securely. 
                  Each school's payments are processed through their own M-PESA account.
                </p>
                <p>
                  <strong>📱 Professional Service:</strong> Schools get enterprise-grade payment processing 
                  with automatic verification, receipts, and reporting.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


