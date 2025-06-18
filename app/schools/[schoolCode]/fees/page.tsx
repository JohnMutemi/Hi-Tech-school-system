"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Plus, 
  CreditCard, 
  FileText, 
  DollarSign, 
  Users, 
  TrendingUp,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  AlertCircle
} from "lucide-react"
import { getSchool } from "@/lib/school-storage"
import { 
  getFeeStructures, 
  saveFeeStructure, 
  deleteFeeStructure,
  getStudentFees,
  getPayments,
  getReceipts,
  calculateStudentFeesSummary
} from "@/lib/fees-storage"
import { useToast } from "@/hooks/use-toast"
import type { FeeStructure } from "@/lib/types/fees"

interface FeesPageProps {
  params: {
    schoolCode: string
  }
}

export default function FeesPage({ params }: FeesPageProps) {
  const { schoolCode } = params
  const { toast } = useToast()
  const [schoolData, setSchoolData] = useState<any>(null)
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [studentFees, setStudentFees] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddFeeDialog, setShowAddFeeDialog] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    amount: "",
    frequency: "monthly",
    dueDate: ""
  })

  useEffect(() => {
    loadData()
  }, [schoolCode])

  const loadData = () => {
    try {
      const school = getSchool(schoolCode)
      if (!school) {
        toast({
          title: "Error",
          description: "School not found",
          variant: "destructive"
        })
        return
      }
      setSchoolData(school)

      const fees = getFeeStructures(schoolCode)
      const feesData = getStudentFees(schoolCode)
      const paymentsData = getPayments(schoolCode)
      const receiptsData = getReceipts(schoolCode)

      setFeeStructures(fees)
      setStudentFees(feesData)
      setPayments(paymentsData)
      setReceipts(receiptsData)

    } catch (error) {
      console.error("Error loading fees data:", error)
      toast({
        title: "Error",
        description: "Failed to load fees data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddFee = () => {
    setEditingFee(null)
    setFormData({
      name: "",
      description: "",
      amount: "",
      frequency: "monthly",
      dueDate: ""
    })
    setShowAddFeeDialog(true)
  }

  const handleEditFee = (fee: FeeStructure) => {
    setEditingFee(fee)
    setFormData({
      name: fee.name,
      description: fee.description,
      amount: fee.amount.toString(),
      frequency: fee.frequency,
      dueDate: fee.dueDate
    })
    setShowAddFeeDialog(true)
  }

  const handleDeleteFee = (feeId: string) => {
    if (confirm("Are you sure you want to delete this fee structure?")) {
      try {
        deleteFeeStructure(schoolCode, feeId)
        loadData()
        toast({
          title: "Success",
          description: "Fee structure deleted successfully"
        })
      } catch (error) {
        console.error("Error deleting fee structure:", error)
        toast({
          title: "Error",
          description: "Failed to delete fee structure",
          variant: "destructive"
        })
      }
    }
  }

  const handleSaveFee = () => {
    try {
      const feeData: FeeStructure = {
        id: editingFee?.id || `fee_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency as any,
        dueDate: formData.dueDate,
        isActive: true,
        createdAt: editingFee?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      saveFeeStructure(schoolCode, feeData)
      loadData()
      setShowAddFeeDialog(false)
      
      toast({
        title: "Success",
        description: editingFee ? "Fee structure updated successfully" : "Fee structure added successfully"
      })
    } catch (error) {
      console.error("Error saving fee structure:", error)
      toast({
        title: "Error",
        description: "Failed to save fee structure",
        variant: "destructive"
      })
    }
  }

  const calculateSummary = () => {
    const totalFees = studentFees.reduce((sum, fee) => sum + fee.amount, 0)
    const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0)
    const totalBalance = totalFees - totalPaid
    const overdueFees = studentFees.filter(fee => 
      fee.status === 'overdue' && new Date(fee.dueDate) < new Date()
    )
    const overdueAmount = overdueFees.reduce((sum, fee) => sum + fee.balance, 0)

    return {
      totalFees,
      totalPaid,
      totalBalance,
      overdueAmount,
      totalStudents: schoolData?.students?.length || 0,
      totalPayments: payments.length,
      totalReceipts: receipts.length
    }
  }

  const summary = calculateSummary()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fees management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {schoolData?.logoUrl ? (
                <img
                  src={schoolData.logoUrl}
                  alt={`${schoolData.name} logo`}
                  className="w-12 h-12 object-cover rounded-lg border-2"
                  style={{ borderColor: schoolData.colorTheme }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center border-2"
                  style={{
                    backgroundColor: schoolData?.colorTheme + "20",
                    borderColor: schoolData?.colorTheme,
                  }}
                >
                  <DollarSign className="w-6 h-6" style={{ color: schoolData?.colorTheme }} />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Fees Management</h1>
                <p className="text-gray-600">{schoolData?.name}</p>
              </div>
            </div>
            <Button onClick={handleAddFee}>
              <Plus className="w-4 h-4 mr-2" />
              Add Fee Structure
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Fees</p>
                  <p className="text-lg font-semibold">
                    KES {summary.totalFees.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-lg font-semibold text-green-600">
                    KES {summary.totalPaid.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="w-8 h-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-lg font-semibold text-red-600">
                    KES {summary.overdueAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Students</p>
                  <p className="text-lg font-semibold">{summary.totalStudents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="structures" className="space-y-6">
          <TabsList>
            <TabsTrigger value="structures">Fee Structures</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Fee Structures Tab */}
          <TabsContent value="structures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fee Structures</CardTitle>
                <CardDescription>Manage fee structures for different classes and terms</CardDescription>
              </CardHeader>
              <CardContent>
                {feeStructures.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No fee structures created yet.</p>
                    <Button onClick={handleAddFee} className="mt-4">
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Fee Structure
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feeStructures.map((fee) => (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.name}</TableCell>
                          <TableCell>{fee.description}</TableCell>
                          <TableCell>KES {fee.amount.toLocaleString()}</TableCell>
                          <TableCell className="capitalize">{fee.frequency}</TableCell>
                          <TableCell>
                            {new Date(fee.dueDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={fee.isActive ? "default" : "secondary"}>
                              {fee.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditFee(fee)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteFee(fee.id)}
                              >
                                <Trash2 className="w-4 h-4" />
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

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>All payment transactions across the school</CardDescription>
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
                        <TableHead>Student</TableHead>
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
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {schoolData?.students?.find(s => s.id === payment.studentId)?.name || 'Unknown'}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            KES {payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell className="capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </TableCell>
                          <TableCell>{payment.referenceNumber || '-'}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Receipts</CardTitle>
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
                        <TableHead>Student</TableHead>
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
                            {schoolData?.students?.find(s => s.id === receipt.studentId)?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {new Date(receipt.paymentDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-semibold">
                            KES {receipt.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            KES {receipt.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>Generate and download financial reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Monthly Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Generate a comprehensive monthly financial report
                      </p>
                      <Button>
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Term Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Generate term-wise financial summary
                      </p>
                      <Button>
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Fee Dialog */}
      <Dialog open={showAddFeeDialog} onOpenChange={setShowAddFeeDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingFee ? "Edit Fee Structure" : "Add Fee Structure"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Fee Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Tuition Fee"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the fee"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                  <SelectItem value="one_time">One Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAddFeeDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveFee}>
                {editingFee ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 