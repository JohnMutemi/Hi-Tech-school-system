"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Mail, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  Loader2,
  Shield
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

interface EmailConfig {
  id?: string
  isEnabled: boolean
  emailProvider: string
  configuration: any
  fromEmail: string
  fromName: string
  paymentConfirmationEnabled: boolean
  receiptAttachmentEnabled: boolean
}

interface EmailNotificationSettingsProps {
  schoolCode: string
  colorTheme?: string
}

const EMAIL_PROVIDERS = [
  {
    value: 'sendgrid',
    label: 'SendGrid',
    description: 'Reliable email delivery service',
    configFields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'SG.xxxxxxxxx' }
    ]
  },
  {
    value: 'aws_ses',
    label: 'Amazon SES',
    description: 'AWS Simple Email Service',
    configFields: [
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
      { key: 'region', label: 'AWS Region', type: 'text', required: true, placeholder: 'us-east-1' }
    ]
  },
  {
    value: 'gmail',
    label: 'Gmail SMTP',
    description: 'Gmail SMTP (Free - 2,000 emails/day)',
    setupInstructions: [
      '1. Go to your Google Account settings',
      '2. Enable 2-Step Verification if not already enabled',
      '3. Go to Security > 2-Step Verification > App passwords',
      '4. Generate an app password for "Mail"',
      '5. Use the generated 16-character password below'
    ],
    configFields: [
      { key: 'username', label: 'Gmail Address', type: 'email', required: true, placeholder: 'your-school@gmail.com' },
      { key: 'password', label: 'App Password', type: 'password', required: true, placeholder: 'xxxx xxxx xxxx xxxx' }
    ]
  },
  {
    value: 'smtp',
    label: 'Custom SMTP',
    description: 'Custom SMTP configuration',
    configFields: [
      { key: 'host', label: 'SMTP Host', type: 'text', required: true, placeholder: 'smtp.example.com' },
      { key: 'port', label: 'Port', type: 'number', required: true, placeholder: '587' },
      { key: 'username', label: 'Username', type: 'text', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true },
      { key: 'secure', label: 'Use SSL/TLS', type: 'boolean', required: false }
    ]
  }
]

export default function EmailNotificationSettings({ schoolCode, colorTheme }: EmailNotificationSettingsProps) {
  const { toast } = useToast()
  const [config, setConfig] = useState<EmailConfig>({
    isEnabled: false,
    emailProvider: '',
    configuration: {},
    fromEmail: '',
    fromName: '',
    paymentConfirmationEnabled: true,
    receiptAttachmentEnabled: true
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [testEmail, setTestEmail] = useState('')

  useEffect(() => {
    fetchEmailConfig()
  }, [schoolCode])

  const fetchEmailConfig = async () => {
    try {
      setLoading(true)
      const url = `/api/schools/${schoolCode}/email-config`
      console.log('🔍 Fetching email config from:', url)
      console.log('📍 School code:', schoolCode)
      
      const response = await fetch(url)
      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Email config data received:', data)
        if (data) {
          setConfig(data)
          console.log('✅ Config state updated:', data)
        }
      } else {
        const errorData = await response.text()
        console.error('❌ Failed to fetch email config:', response.status, errorData)
      }
    } catch (error) {
      console.error('❌ Error fetching email config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Validate required fields
      if (config.isEnabled) {
        if (!config.emailProvider || !config.fromEmail || !config.fromName) {
          toast({
            title: "Validation Error",
            description: "Please fill in all required fields",
            variant: "destructive"
          })
          return
        }

        const provider = EMAIL_PROVIDERS.find(p => p.value === config.emailProvider)
        if (provider) {
          for (const field of provider.configFields) {
            if (field.required && !config.configuration[field.key]) {
              toast({
                title: "Validation Error",
                description: `${field.label} is required`,
                variant: "destructive"
              })
              return
            }
          }
        }
      }

      const method = (config.id && config.id !== null) ? 'PUT' : 'POST'
      const url = `/api/schools/${schoolCode}/email-config` // Always use base URL without ID
      
      console.log('🚨 FORCED URL CHECK:', {
        originalUrl: url,
        method: method,
        willNotAppendId: 'This URL should NEVER have an ID appended',
        configId: config.id
      })

      console.log('🌐 Request details:', {
        method,
        url,
        hasConfigId: !!config.id,
        configId: config.id,
        configIdType: typeof config.id,
        configIdIsNull: config.id === null,
        schoolCode
      })
      console.log('📋 Config being sent:', config)

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        body: JSON.stringify(config),
      })

      console.log('📡 Save response status:', response.status)
      console.log('📡 Save response ok:', response.ok)

      if (response.ok) {
        const savedConfig = await response.json()
        console.log('✅ Config saved successfully:', savedConfig)
        setConfig(savedConfig)
        toast({
          title: "Success",
          description: "Email notification settings saved successfully",
        })
      } else {
        const errorText = await response.text()
        console.error('❌ Save failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
        
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        
        toast({
          title: "Error",
          description: errorData.error || `HTTP ${response.status}: Failed to save email configuration`,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving email config:', error)
      toast({
        title: "Error",
        description: "Failed to save email settings",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Error",
        description: "Please enter a test email address",
        variant: "destructive"
      })
      return
    }

    try {
      setTesting(true)
      const response = await fetch(`/api/schools/${schoolCode}/email-config/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          testEmail,
          config 
        }),
      })

      if (response.ok) {
        toast({
          title: "Test Email Sent",
          description: "Please check your inbox for the test email",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Test Failed",
          description: error.error || "Failed to send test email",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error sending test email:', error)
      toast({
        title: "Test Failed",
        description: "Failed to send test email",
        variant: "destructive"
      })
    } finally {
      setTesting(false)
    }
  }

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const renderProviderConfig = () => {
    const provider = EMAIL_PROVIDERS.find(p => p.value === config.emailProvider)
    if (!provider) return null

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">Provider Configuration</h4>
        {provider.configFields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key} className="text-sm font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            
            {field.type === 'boolean' ? (
              <div className="flex items-center space-x-2">
                <Switch
                  id={field.key}
                  checked={config.configuration[field.key] || false}
                  onCheckedChange={(checked) => setConfig({
                    ...config,
                    configuration: {
                      ...config.configuration,
                      [field.key]: checked
                    }
                  })}
                />
                <Label htmlFor={field.key}>{field.label}</Label>
              </div>
            ) : field.type === 'password' ? (
              <div className="relative">
                <Input
                  id={field.key}
                  type={showPasswords[field.key] ? 'text' : 'password'}
                  value={config.configuration[field.key] || ''}
                  onChange={(e) => setConfig({
                    ...config,
                    configuration: {
                      ...config.configuration,
                      [field.key]: e.target.value
                    }
                  })}
                  placeholder={field.placeholder}
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
                value={config.configuration[field.key] || ''}
                onChange={(e) => setConfig({
                  ...config,
                  configuration: {
                    ...config.configuration,
                    [field.key]: field.type === 'number' ? parseInt(e.target.value) : e.target.value
                  }
                })}
                placeholder={field.placeholder}
                required={field.required}
              />
            )}
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
          <h2 className="text-3xl font-bold text-gray-900">Email Notifications</h2>
          <p className="text-gray-600 mt-2">Configure automated email notifications for payment confirmations</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={config.isEnabled ? "default" : "secondary"}>
            {config.isEnabled ? "Enabled" : "Disabled"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="test">Test & Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          {/* Enable/Disable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Enable or disable automated email notifications for payment confirmations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isEnabled">Enable Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send automatic emails when payments are received</p>
                </div>
                <Switch
                  id="isEnabled"
                  checked={config.isEnabled}
                  onCheckedChange={(checked) => setConfig({ ...config, isEnabled: checked })}
                />
              </div>
            </CardContent>
          </Card>

          {config.isEnabled && (
            <>
              {/* Email Provider */}
              <Card>
                <CardHeader>
                  <CardTitle>Email Provider</CardTitle>
                  <CardDescription>Choose your email service provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="provider">Email Provider *</Label>
                    <Select
                      value={config.emailProvider}
                      onValueChange={(value) => setConfig({
                        ...config,
                        emailProvider: value,
                        configuration: {} // Reset configuration when changing provider
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select email provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {EMAIL_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            <div>
                              <div className="font-medium">{provider.label}</div>
                              <div className="text-xs text-gray-500">{provider.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {config.emailProvider && renderProviderConfig()}
                </CardContent>
              </Card>

              {/* Sender Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Sender Information</CardTitle>
                  <CardDescription>Configure the sender name and email address</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fromName">From Name *</Label>
                      <Input
                        id="fromName"
                        value={config.fromName}
                        onChange={(e) => setConfig({ ...config, fromName: e.target.value })}
                        placeholder="School Name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fromEmail">From Email *</Label>
                      <Input
                        id="fromEmail"
                        type="email"
                        value={config.fromEmail}
                        onChange={(e) => setConfig({ ...config, fromEmail: e.target.value })}
                        placeholder="noreply@school.com"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Notification Types</CardTitle>
                  <CardDescription>Choose which notifications to send</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="paymentConfirmation">Payment Confirmations</Label>
                      <p className="text-sm text-gray-500">Send confirmation emails when payments are received</p>
                    </div>
                    <Switch
                      id="paymentConfirmation"
                      checked={config.paymentConfirmationEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, paymentConfirmationEnabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="receiptAttachment">Include Receipt</Label>
                      <p className="text-sm text-gray-500">Attach receipt as PDF to confirmation emails</p>
                    </div>
                    <Switch
                      id="receiptAttachment"
                      checked={config.receiptAttachmentEnabled}
                      onCheckedChange={(checked) => setConfig({ ...config, receiptAttachmentEnabled: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Save Button */}
          <div className="flex gap-3">
            <Button 
              onClick={handleSave}
              disabled={saving}
              style={{ backgroundColor: colorTheme }}
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          {/* Test Email */}
          <Card>
            <CardHeader>
              <CardTitle>Test Email Configuration</CardTitle>
              <CardDescription>
                Send a test email to verify your configuration is working correctly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {config.isEnabled ? (
                <>
                  <div>
                    <Label htmlFor="testEmail">Test Email Address</Label>
                    <Input
                      id="testEmail"
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                    />
                  </div>
                  <Button 
                    onClick={handleTestEmail}
                    disabled={testing || !testEmail}
                    variant="outline"
                  >
                    {testing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending Test...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Test Email
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Enable email notifications first to test the configuration</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Email Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
              <CardDescription>Preview of the payment confirmation email</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-6 border">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">✅</div>
                    <h2 className="text-2xl font-bold text-green-600">Payment Confirmed!</h2>
                    <p className="text-gray-600">Your payment has been successfully processed</p>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-green-600">KES 15,000</div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Student Name:</span>
                      <span className="font-medium">John Doe</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Receipt Number:</span>
                      <span className="font-medium">REC-2025-001</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="font-medium">M-PESA Paybill</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Date:</span>
                      <span className="font-medium">{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="text-center mt-6 text-sm text-gray-500">
                    <p><strong>{config.fromName || 'School Name'}</strong></p>
                    <p>This is an automated notification. Please do not reply to this email.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Security & Privacy</h4>
              <p className="text-blue-800 text-sm">
                All email configuration data is encrypted and stored securely. Sensitive information like API keys 
                and passwords are never displayed in plain text after saving. Emails are sent directly from your 
                configured provider to ensure reliability and deliverability.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


