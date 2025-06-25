"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Camera, Users, DollarSign, Receipt, BarChart2, Key, LogOut, Calendar, AlertCircle, CheckCircle, Edit, Trash2, RefreshCw, Download, Eye } from "lucide-react"
import { ReceiptView } from "@/components/ui/receipt-view"
import { Badge } from "@/components/ui/badge"
import { Table, TableHeader, TableBody, TableCell, TableRow, TableHead } from "@/components/ui/table"
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PaymentModal } from "@/components/payment/payment-modal"

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
}

export default function ParentDashboardPage({ params }: { params: { schoolCode: string; parentId: string } }) {
  const { schoolCode, parentId } = params
  const [parent, setParent] = useState<any>(null)
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("children")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [receipts, setReceipts] = useState<any[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const router = useRouter()
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMsg, setPasswordMsg] = useState("")
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([])
  const [loadingFees, setLoadingFees] = useState(true)
  const [pendingParentCredentials, setPendingParentCredentials] = useState<{ phone: string; tempPassword: string } | null>(null)
  
  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [selectedFeeStructure, setSelectedFeeStructure] = useState<FeeStructure | null>(null)

  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    async function fetchSession() {
      try {
        console.log('ParentDashboard: Starting fetchSession', { schoolCode, parentId })
        
        // If parentId is provided, fetch specific parent data
        if (parentId) {
          console.log('ParentDashboard: Fetching parent by ID:', parentId)
          const res = await fetch(`/api/schools/${schoolCode}/parents/${parentId}`)
          console.log('ParentDashboard: Parent by ID response status:', res.status)
          
          if (!res.ok) {
            console.log('ParentDashboard: Parent by ID failed, redirecting to login')
            router.replace(`/schools/${schoolCode}/parent/login`)
            return
          }
          const data = await res.json()
          console.log('ParentDashboard: Parent data received:', { parent: data.parent, studentsCount: data.students?.length })
          setParent(data.parent)
          setStudents(data.students)
        } else {
          console.log('ParentDashboard: Using session-based authentication')
          // Fallback to session-based authentication
          const res = await fetch(`/api/schools/${schoolCode}/parents/session`)
          console.log('ParentDashboard: Session response status:', res.status)
          
          if (!res.ok) {
            console.log('ParentDashboard: Session failed, redirecting to login')
            router.replace(`/schools/${schoolCode}/parent/login`)
            return
          }
          const data = await res.json()
          console.log('ParentDashboard: Session data received:', { parent: data.parent, studentsCount: data.students?.length })
          setParent(data.parent)
          setStudents(data.students)
        }
        
        // Fetch fee structures for all students
        await fetchFeeStructures(students)
      } catch (error) {
        console.error("ParentDashboard: Failed to fetch session:", error)
        router.replace(`/schools/${schoolCode}/parent/login`)
      } finally {
        setIsLoading(false)
      }
    }
    fetchSession()
  }, [schoolCode, parentId])

  // Listen for fee structure updates from admin panel
  useEffect(() => {
    const handleFeeStructureUpdate = (event: CustomEvent) => {
      if (event.detail.schoolCode === schoolCode && students.length > 0) {
        console.log('Fee structure updated, refreshing parent data...', event.detail)
        fetchFeeStructures(students)
        toast({ 
          title: "Fee Structure Updated", 
          description: "New fee structure has been added and is now available for payment.",
          variant: "default" 
        })
      }
    }

    window.addEventListener('feeStructureUpdated', handleFeeStructureUpdate as EventListener)
    
    return () => {
      window.removeEventListener('feeStructureUpdated', handleFeeStructureUpdate as EventListener)
    }
  }, [schoolCode, students])

  // Manual refresh function
  const handleRefreshFees = async () => {
    if (students.length > 0) {
      console.log('Manually refreshing fee structures...')
      await fetchFeeStructures(students)
      toast({ 
        title: "Fee Structures Refreshed", 
        description: "Latest fee structures have been loaded.",
        variant: "default" 
      })
    }
  }

  // Fetch fee structures for students
  const fetchFeeStructures = async (studentList: any[]) => {
    try {
      setLoadingFees(true)
      const classLevels = [...new Set(studentList.map(student => student.className || student.classLevel))]
      
      console.log('Fetching fee structures for class levels:', classLevels)
      
      // Get current term
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth()
      
      let currentTerm = "Term 1"
      if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2"
      else if (currentMonth >= 8) currentTerm = "Term 3"

      console.log(`Current term: ${currentTerm}, Year: ${currentYear}`)

      // Fetch fee structures for each class level using the same logic as student dashboard
      const feePromises = classLevels.map(async (classLevel) => {
        const response = await fetch(
          `/api/schools/${schoolCode}/fee-structure?term=${currentTerm}&year=${currentYear}&classLevel=${encodeURIComponent(classLevel)}`
        )
        if (response.ok) {
          const data = await response.json()
          console.log(`Fee structures for ${classLevel}:`, data)
          
          // Find active fee structure (same logic as student dashboard)
          const activeFeeStructure = data.find((fee: any) => fee.isActive)
          console.log(`Active fee structure for ${classLevel}:`, activeFeeStructure)
          
          return activeFeeStructure || null
        } else {
          console.error(`Failed to fetch fee structures for ${classLevel}:`, response.status, response.statusText)
          return null
        }
      })

      const feeResults = await Promise.all(feePromises)
      const allFees = feeResults.filter(fee => fee !== null)
      console.log('All active fee structures:', allFees)
      setFeeStructures(allFees)
    } catch (error) {
      console.error("Failed to fetch fee structures:", error)
    } finally {
      setLoadingFees(false)
    }
  }

  // Get fee structure for a specific student (updated to match student dashboard logic)
  const getStudentFeeStructure = (studentClass: string) => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth()
    
    let currentTerm = "Term 1"
    if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2"
    else if (currentMonth >= 8) currentTerm = "Term 3"

    return feeStructures.find(fee => 
      fee.classLevel === studentClass && 
      fee.term === currentTerm && 
      fee.year === currentYear &&
      fee.isActive
    )
  }

  // Handle payment modal opening
  const handleOpenPaymentModal = (student: any) => {
    const feeStructure = getStudentFeeStructure(student.className || student.classLevel)
    if (!feeStructure) {
      toast({ 
        title: "Error", 
        description: "No fee structure available for this student", 
        variant: "destructive" 
      })
      return
    }

    setSelectedStudent(student)
    setSelectedFeeStructure(feeStructure)
    setPaymentModalOpen(true)
  }

  // Handle payment success
  const handlePaymentSuccess = (payment: any) => {
    toast({ 
      title: "Payment Successful", 
      description: `Payment of KES ${payment.amount?.toLocaleString() || selectedFeeStructure?.totalAmount.toLocaleString()} has been processed successfully.`,
      variant: "default" 
    })
    
    // Close modal
    setPaymentModalOpen(false)
    setSelectedStudent(null)
    setSelectedFeeStructure(null)
  }

  // Handle payment error
  const handlePaymentError = (error: string) => {
    toast({ 
      title: "Payment Failed", 
      description: error || "An error occurred while processing payment",
      variant: "destructive" 
    })
  }

  // Fetch receipts for all students
  const fetchReceipts = async () => {
    try {
      const receiptPromises = students.map(async (student) => {
        const response = await fetch(`/api/schools/${schoolCode}/students/${student.id}/payments`)
        if (response.ok) {
          const data = await response.json()
          return data.map((receipt: any) => ({ ...receipt, studentName: student.name }))
        }
        return []
      })

      const allReceipts = await Promise.all(receiptPromises)
      const flattenedReceipts = allReceipts.flat()
      setReceipts(flattenedReceipts)
    } catch (error) {
      console.error("Failed to fetch receipts:", error)
    }
  }

  // Profile picture upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError("")
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select a valid image file.")
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be less than 5MB.")
      return
    }
    
    setAvatarUploading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const avatarUrl = ev.target?.result as string
      const session = localStorage.getItem("parent-auth")
      if (!session) {
        setAvatarUploading(false)
        setAvatarError("Session expired. Please log in again.")
        return
      }
      const { parentId } = JSON.parse(session)
      await fetch(`/api/schools/${schoolCode}/parents`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, avatarUrl }),
      })
      setParent((prev: any) => ({ ...prev, avatarUrl }))
      setAvatarUploading(false)
    }
    reader.onerror = () => {
      setAvatarUploading(false)
      setAvatarError("Failed to read image file. Please try again.")
    }
    reader.readAsDataURL(file)
  }

  const handleLogout = async () => {
    // Optionally, call a logout API to clear the cookie
    await fetch(`/api/schools/${schoolCode}/parents/logout`, { method: "POST" })
    router.replace(`/schools/${schoolCode}/parent/login`)
  }

  // Change password logic
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg("")
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordMsg("All fields are required.")
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.")
      return
    }
    if (oldPassword !== parent?.tempPassword) {
      setPasswordMsg("Old password is incorrect.")
      return
    }
    const session = localStorage.getItem("parent-auth")
    if (!session) return
    const { parentId } = JSON.parse(session)
    await fetch(`/api/schools/${schoolCode}/parents`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ parentId, tempPassword: newPassword }),
    })
    setParent((prev: any) => ({ ...prev, tempPassword: newPassword }))
    setPasswordMsg("Password changed successfully!")
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  // Handle receipt generation
  const handleReceiptGenerated = (receipt: any) => {
    toast({ 
      title: "Receipt Generated", 
      description: "Receipt has been generated successfully.",
      variant: "default" 
    })
    // Refresh receipts list
    fetchReceipts()
  }

  // Handle receipt download
  const handleDownloadReceipt = (receipt: any) => {
    // In a real implementation, this would download the receipt as PDF
    toast({ 
      title: "Download Started", 
      description: "Receipt download has been initiated.",
      variant: "default" 
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parent dashboard...</p>
        </div>
      </div>
    )
  }

  if (!parent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Parent not found. Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-12 h-12">
                <img
                  src={parent.avatarUrl || "/placeholder-user.jpg"}
                  alt={parent.name}
                  className="rounded-full object-cover w-full h-full"
                />
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
                  <Camera className="w-4 h-4" />
                </label>
              </Avatar>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{parent.name}</h1>
                <p className="text-sm text-gray-500">Parent Dashboard</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="children" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              My Children
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Finances
            </TabsTrigger>
            <TabsTrigger value="receipts" className="flex items-center gap-2">
              <Receipt className="w-4 h-4" />
              Receipts
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* My Children Tab */}
          <TabsContent value="children" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Children</h2>
              <Button onClick={handleRefreshFees} variant="outline" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh Fees
              </Button>
            </div>
            
            {students.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No children found</h3>
                  <p className="text-gray-500">No children are currently registered under this parent account.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {students.map((student) => {
                  const feeStructure = getStudentFeeStructure(student.className || student.classLevel)
                  return (
                    <Card key={student.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{student.name}</CardTitle>
                          <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                            {student.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          Class: {student.className || student.classLevel} | Admission: {student.admissionNumber}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Fee Structure:</span>
                          <span className="font-medium">
                            {feeStructure ? `${feeStructure.term} ${feeStructure.year}` : 'Not Available'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Total Fees:</span>
                          <span className="font-medium">
                            {feeStructure ? `KES ${feeStructure.totalAmount?.toLocaleString()}` : 'Not Set'}
                          </span>
                        </div>
                        <Button 
                          onClick={() => handleOpenPaymentModal(student)}
                          disabled={!feeStructure}
                          className="w-full"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Pay Fees
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          {/* Finance Tab */}
          <TabsContent value="finance" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
            
            {loadingFees ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading fee structures...</p>
                </CardContent>
              </Card>
            ) : feeStructures.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No fee structures available</h3>
                  <p className="text-gray-500">Fee structures for your children's classes have not been set up yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {feeStructures.map((feeStructure) => (
                  <Card key={feeStructure.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{feeStructure.classLevel}</CardTitle>
                      <CardDescription>
                        {feeStructure.term} {feeStructure.year}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Amount:</span>
                          <span className="font-semibold text-lg">
                            KES {feeStructure.totalAmount?.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Breakdown:
                        </div>
                        {Object.entries(feeStructure.breakdown || {}).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-xs">
                            <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                            <span>KES {value?.toLocaleString()}</span>
                          </div>
                        ))}
                        <div className="flex items-center justify-between text-xs">
                          <span>Status:</span>
                          <Badge variant={feeStructure.isActive ? 'default' : 'secondary'}>
                            {feeStructure.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Payment Receipts</h2>
              <Button onClick={fetchReceipts} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {receipts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
                  <p className="text-gray-500">Payment receipts will appear here once payments are made.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <Card key={receipt.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{receipt.studentName}</h4>
                          <p className="text-sm text-gray-500">
                            Receipt #{receipt.receiptNumber} • {new Date(receipt.paymentDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">KES {receipt.amount?.toFixed(2)}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedReceipt(receipt)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadReceipt(receipt)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
            
            <Card className="w-full max-w-2xl rounded-3xl shadow-2xl bg-white/95 p-8 md:p-12 border-2 border-blue-200 mx-auto mt-10">
              <CardHeader>
                <CardTitle className="text-3xl font-extrabold text-blue-800 mb-2 text-center drop-shadow-lg tracking-tight">
                  Profile & Security
                </CardTitle>
                <CardDescription className="text-center text-gray-500 mb-6">
                  Manage your contact information and password.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleChangePassword} className="space-y-8 max-w-md mx-auto bg-blue-50 p-6 rounded-2xl shadow">
                  <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                    <Key className="w-5 h-5" /> Change Password
                  </h3>
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Old Password</label>
                      <input
                        type="password"
                        className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                        placeholder="Enter old password"
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">New Password</label>
                      <input
                        type="password"
                        className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                        placeholder="Enter new password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {passwordMsg && (
                    <div
                      className={`text-sm ${
                        passwordMsg.includes('success') ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {passwordMsg}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl text-lg shadow mt-4"
                  >
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Modal */}
      {paymentModalOpen && selectedStudent && selectedFeeStructure && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false)
            setSelectedStudent(null)
            setSelectedFeeStructure(null)
          }}
          studentId={selectedStudent.id}
          schoolCode={schoolCode}
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}

      {/* Receipt View Modal */}
      {selectedReceipt && (
        <ReceiptView
          receipt={selectedReceipt}
          studentName={selectedReceipt.studentName}
          studentClass={selectedReceipt.studentClass}
          admissionNumber={selectedReceipt.admissionNumber}
          onClose={() => setSelectedReceipt(null)}
        />
      )}

      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Confirm Logout</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to log out?</p>
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 