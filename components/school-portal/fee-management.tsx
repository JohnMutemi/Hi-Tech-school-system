"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { 
  Plus, 
  Edit, 
  Eye, 
  Trash2, 
  DollarSign, 
  Calendar, 
  Users, 
  FileText,
  History,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Shield,
  Clock
} from "lucide-react"

interface FeeStructure {
  id: string
  term: string
  year: number
  classLevel: string
  totalAmount: number
  breakdown: Record<string, number>
  isActive: boolean
  createdAt: string
  creator: {
    id: string
    name: string
    email: string
  }
  logs: Array<{
    id: string
    action: string
    timestamp: string
    user: {
      name: string
      email: string
    }
    details: any
  }>
}

interface FeeManagementProps {
  schoolCode: string
  colorTheme: string
  onGoBack?: () => void
  onFeeStructureCreated?: () => void
}

export function FeeManagement({ schoolCode, colorTheme, onGoBack, onFeeStructureCreated }: FeeManagementProps) {
  const { toast } = useToast()
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingFee, setEditingFee] = useState<FeeStructure | null>(null)
  const [viewingFee, setViewingFee] = useState<FeeStructure | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    term: "",
    year: new Date().getFullYear().toString(),
    classLevel: "",
    totalAmount: "",
    breakdown: {
      tuition: "",
      books: "",
      lunch: "",
      uniform: "",
      transport: "",
      other: ""
    }
  })

  const [breakdownItems, setBreakdownItems] = useState([
    { key: "tuition", label: "Tuition Fee", icon: "🎓" },
    { key: "books", label: "Books & Materials", icon: "📚" },
    { key: "lunch", label: "Lunch Program", icon: "🍽️" },
    { key: "uniform", label: "School Uniform", icon: "👔" },
    { key: "transport", label: "Transportation", icon: "🚌" },
    { key: "other", label: "Other Fees", icon: "📋" }
  ])

  // Get current term and year
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()
  
  let currentTerm = "Term 1"
  if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2"
  else if (currentMonth >= 8) currentTerm = "Term 3"

  // Fetch fee structures
  const fetchFeeStructures = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/schools/${schoolCode}/fee-structure`)
      if (response.ok) {
        const data = await response.json()
        setFeeStructures(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch fee structures",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch fee structures",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeeStructures()
  }, [schoolCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calculate total from breakdown
    const total = Object.values(formData.breakdown).reduce((sum, value) => sum + (parseFloat(value) || 0), 0)
    
    const feeData = {
      ...formData,
      totalAmount: total,
      breakdown: Object.fromEntries(
        Object.entries(formData.breakdown).map(([key, value]) => [key, parseFloat(value) || 0])
      )
    }

    try {
      const response = await fetch(`/api/schools/${schoolCode}/fee-structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeData),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Fee structure saved:', result)
        
        toast({
          title: "Success!",
          description: editingFee ? "Fee structure updated successfully!" : "Fee structure created successfully!",
        })
        setShowForm(false)
        setEditingFee(null)
        setFormData({
          term: "",
          year: new Date().getFullYear().toString(),
          classLevel: "",
          totalAmount: "",
          breakdown: {
            tuition: "",
            books: "",
            lunch: "",
            uniform: "",
            transport: "",
            other: ""
          }
        })
        
        // Refresh the fee structures list
        await fetchFeeStructures()
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('feeStructureUpdated', {
          detail: { schoolCode, feeStructure: result.feeStructure }
        }))

        if (onFeeStructureCreated) {
          onFeeStructureCreated()
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to save fee structure:', errorData)
        throw new Error(errorData.error || 'Failed to save fee structure')
      }
    } catch (error) {
      console.error('Error saving fee structure:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save fee structure",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (fee: FeeStructure) => {
    setEditingFee(fee)
    setFormData({
      term: fee.term,
      year: fee.year.toString(),
      classLevel: fee.classLevel,
      totalAmount: fee.totalAmount.toString(),
      breakdown: {
        tuition: fee.breakdown.tuition?.toString() || "",
        books: fee.breakdown.books?.toString() || "",
        lunch: fee.breakdown.lunch?.toString() || "",
        uniform: fee.breakdown.uniform?.toString() || "",
        transport: fee.breakdown.transport?.toString() || "",
        other: fee.breakdown.other?.toString() || ""
      }
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingFee(null)
    setFormData({
      term: "",
      year: new Date().getFullYear().toString(),
      classLevel: "",
      totalAmount: "",
      breakdown: {
        tuition: "",
        books: "",
        lunch: "",
        uniform: "",
        transport: "",
        other: ""
      }
    })
  }

  const calculateTotal = () => {
    return Object.values(formData.breakdown).reduce((sum, value) => sum + (parseFloat(value) || 0), 0)
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header with Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {onGoBack && (
                <Button
                  onClick={onGoBack}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back to Dashboard
                </Button>
              )}
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-yellow-300" />
                  Fee Management
                </h2>
                <p className="text-blue-100 text-lg">Manage termly fee structures for your school</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Fee Structure
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-emerald-100">
          <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500 rounded-2xl shadow-lg">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-700">{feeStructures.length}</p>
                <p className="text-sm text-green-600 font-medium">Total Fee Structures</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500 rounded-2xl shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-blue-700">
                  {feeStructures.filter(f => f.isActive).length}
                </p>
                <p className="text-sm text-blue-600 font-medium">Active Structures</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-violet-100">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-violet-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500 rounded-2xl shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-700">
                  {feeStructures.filter(f => f.term === currentTerm && f.year === currentYear).length}
                </p>
                <p className="text-sm text-purple-600 font-medium">Current Term</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative overflow-hidden rounded-2xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-amber-100">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-500 rounded-2xl shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-3xl font-bold text-orange-700">
                  {new Set(feeStructures.map(f => f.classLevel)).size}
                </p>
                <p className="text-sm text-orange-600 font-medium">Class Levels</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Fee Structures Table */}
      <Card className="rounded-3xl border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            Fee Structures Overview
          </CardTitle>
          <CardDescription className="text-gray-600">
            Manage and monitor all fee structures for your school
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading fee structures...</span>
            </div>
          ) : feeStructures.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No fee structures yet</h3>
              <p className="text-gray-500 mb-6">Create your first fee structure to get started</p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create First Fee Structure
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 hover:bg-gray-100">
                    <TableHead className="font-semibold text-gray-700">Term & Year</TableHead>
                    <TableHead className="font-semibold text-gray-700">Class Level</TableHead>
                    <TableHead className="font-semibold text-gray-700">Total Amount</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700">Created By</TableHead>
                    <TableHead className="font-semibold text-gray-700">Created</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStructures.map((fee) => (
                    <TableRow key={fee.id} className="hover:bg-gray-50/50 transition-colors duration-200">
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{fee.term}</p>
                            <p className="text-sm text-gray-500">{fee.year}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 font-medium">
                          {fee.classLevel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-bold text-green-700">
                            {fee.totalAmount.toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={fee.isActive ? "default" : "secondary"}
                          className={`${fee.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"} font-medium`}
                        >
                          <div className="flex items-center space-x-1">
                            {fee.isActive ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>{fee.isActive ? "Active" : "Inactive"}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{fee.creator.name}</p>
                          <p className="text-sm text-gray-500">{fee.creator.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {new Date(fee.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setViewingFee(fee)}
                            className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors duration-200"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEdit(fee)}
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors duration-200"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors duration-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
          <DialogHeader className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCloseForm}
              className="absolute right-0 top-0 h-8 w-8 rounded-full hover:bg-gray-100 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              {editingFee ? "Edit Fee Structure" : "Create New Fee Structure"}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingFee ? "Update the fee structure details below" : "Set up a new fee structure for your school"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Term *</Label>
                <Select
                  value={formData.term}
                  onValueChange={(value) => setFormData({ ...formData, term: value })}
                >
                  <SelectTrigger className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Term 1">Term 1</SelectItem>
                    <SelectItem value="Term 2">Term 2</SelectItem>
                    <SelectItem value="Term 3">Term 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Year *</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="2024"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Class Level *</Label>
                <Select
                  value={formData.classLevel}
                  onValueChange={(value) => setFormData({ ...formData, classLevel: value })}
                >
                  <SelectTrigger className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select class level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grade 1">Grade 1</SelectItem>
                    <SelectItem value="Grade 2">Grade 2</SelectItem>
                    <SelectItem value="Grade 3">Grade 3</SelectItem>
                    <SelectItem value="Grade 4">Grade 4</SelectItem>
                    <SelectItem value="Grade 5">Grade 5</SelectItem>
                    <SelectItem value="Grade 6">Grade 6</SelectItem>
                    <SelectItem value="Grade 7">Grade 7</SelectItem>
                    <SelectItem value="Grade 8">Grade 8</SelectItem>
                    <SelectItem value="Form 1">Form 1</SelectItem>
                    <SelectItem value="Form 2">Form 2</SelectItem>
                    <SelectItem value="Form 3">Form 3</SelectItem>
                    <SelectItem value="Form 4">Form 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold text-gray-800">Fee Breakdown</Label>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="text-2xl font-bold text-green-600">
                    KES {calculateTotal().toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {breakdownItems.map((item) => (
                  <div key={item.key} className="group relative">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Label>
                    <Input
                      type="number"
                      value={formData.breakdown[item.key as keyof typeof formData.breakdown]}
                      onChange={(e) => setFormData({
                        ...formData,
                        breakdown: {
                          ...formData.breakdown,
                          [item.key]: e.target.value
                        }
                      })}
                      className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 group-hover:border-blue-300 transition-colors duration-200"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseForm}
                className="rounded-xl px-6 py-3 font-semibold hover:bg-gray-50 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {editingFee ? "Update Fee Structure" : "Create Fee Structure"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Enhanced View Fee Structure Dialog */}
      <Dialog open={!!viewingFee} onOpenChange={() => setViewingFee(null)}>
        <DialogContent className="max-w-lg rounded-2xl border-0 shadow-2xl bg-white">
          <DialogHeader className="relative border-b pb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewingFee(null)}
              className="absolute right-2 top-2 h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-blue-600" />
              Fee Structure Details
            </DialogTitle>
          </DialogHeader>
          
          {viewingFee && (
            <div className="space-y-4 pt-4">
              {/* Header Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-blue-600" />
                          <div>
                              <p className="text-xs text-gray-500">Term / Year</p>
                              <p className="font-semibold text-sm text-gray-800">{viewingFee.term} / {viewingFee.year}</p>
                          </div>
                      </div>
                      <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-purple-600" />
                          <div>
                              <p className="text-xs text-gray-500">Class Level</p>
                              <p className="font-semibold text-sm text-gray-800">{viewingFee.classLevel}</p>
                          </div>
                      </div>
                      <div className="flex items-center space-x-2 col-span-2 border-t pt-2 mt-2">
                          <DollarSign className="w-5 h-5 text-green-600" />
                          <div>
                              <p className="text-xs text-gray-500">Total Amount</p>
                              <p className="font-bold text-base text-green-700">KES {viewingFee.totalAmount.toLocaleString()}</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Fee Breakdown */}
              <div className="space-y-2">
                <Label className="text-base font-semibold text-gray-800">Fee Breakdown</Label>
                <div className="rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
                  <Table>
                    <TableBody>
                      {Object.entries(viewingFee.breakdown).map(([key, value]) => (
                         value > 0 && (
                          <TableRow key={key}>
                            <TableCell className="font-medium capitalize py-2 text-sm flex items-center gap-2">
                              <span>{breakdownItems.find(i => i.key === key)?.icon}</span>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </TableCell>
                            <TableCell className="text-right font-semibold py-2 text-sm">
                              KES {value?.toLocaleString() || '0'}
                            </TableCell>
                          </TableRow>
                         )
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Tabs for History and Details */}
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-100 p-1">
                  <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm h-8">
                    <History className="w-4 h-4 mr-2" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="details" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm h-8">
                    <Shield className="w-4 h-4 mr-2" />
                    Details
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="history" className="space-y-2 mt-2 max-h-48 overflow-y-auto">
                  <div className="space-y-2">
                    {viewingFee.logs.length > 0 ? viewingFee.logs.map((log) => (
                      <div key={log.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                        <div className="p-1 bg-blue-100 rounded-md">
                          <History className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-xs text-gray-900">
                            {log.action.charAt(0).toUpperCase() + log.action.slice(1)} by {log.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )) : <p className="text-sm text-center text-gray-500 py-4">No history yet.</p>}
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-2 mt-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs text-blue-600 font-medium">Created By</div>
                      <div className="font-semibold text-xs text-blue-800">{viewingFee.creator.name}</div>
                      <div className="text-sm text-blue-600">{viewingFee.creator.email}</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-xs text-green-600 font-medium">Created On</div>
                      <div className="font-semibold text-xs text-green-800">
                        {new Date(viewingFee.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 col-span-2">
                      <div className="text-xs text-purple-600 font-medium">Status</div>
                      <Badge 
                        variant={viewingFee.isActive ? "default" : "secondary"}
                        className={`${viewingFee.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"} font-medium text-xs`}
                      >
                        <div className="flex items-center space-x-1">
                          {viewingFee.isActive ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          <span>{viewingFee.isActive ? "Active" : "Inactive"}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 