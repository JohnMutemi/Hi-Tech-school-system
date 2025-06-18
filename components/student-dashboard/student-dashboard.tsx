"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ReceiptGenerator } from "@/components/fees/receipt-generator"
import { DollarSign, CheckCircle, AlertCircle, Clock, FileText, CreditCard, Eye } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ProfileAvatar } from "@/components/profile-avatar"
import { Button } from "@/components/ui/button"

// Import the JSON data directly
import edusmsData from "@/data/edusms.json"

export function StudentDashboard({ schoolCode, studentId }: { schoolCode: string; studentId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [schoolData, setSchoolData] = useState<any>(null)
  const [student, setStudent] = useState<any>(null)
  const [feesSummary, setFeesSummary] = useState<any>(null)
  const [studentFees, setStudentFees] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [showReceipt, setShowReceipt] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: ""
  })

  useEffect(() => {
    const loadData = () => {
      // Find school by code
      const school = edusmsData.schools.find((s: any) => s.code === schoolCode)
      setSchoolData(school)

      // Find student by ID
      const s = edusmsData.students.find((stu: any) => stu.id === studentId)
      if (s) {
        // Find the corresponding user to get the name
        const user = edusmsData.users.find((u: any) => u.id === s.userId)
        const studentWithName = {
          ...s,
          name: user?.name || `Student ${s.admissionNumber}`,
          email: user?.email || '',
          phone: user?.phone || '',
          className: s.classId ? edusmsData.classes.find((c: any) => c.id === s.classId)?.name || 'Unknown' : 'Unknown',
          isActive: s.isActive
        }
        setStudent(studentWithName)

        // Get fees for this student
        const fees = edusmsData.studentFees
          .filter((fee: any) => fee.studentId === studentId)
          .map((fee: any) => ({
            ...fee,
            name: `Fee ${fee.id}`,
            status: fee.status || "pending",
          }))
        setStudentFees(fees)

        // Get payments for this student
        const pays = edusmsData.payments
          .filter((p: any) => p.studentId === studentId)
          .map((p: any) => ({ ...p, status: "completed" }))
        setPayments(pays)

        // Get receipts for this student
        const recs = edusmsData.receipts
          .filter((r: any) => r.studentId === studentId)
          .map((r: any) => ({ ...r, generatedAt: r.createdAt }))
        setReceipts(recs)

        // Calculate summary
        setFeesSummary({
          totalFees: fees.reduce((sum: number, f: any) => sum + f.amount, 0),
          totalPaid: fees.reduce((sum: number, f: any) => sum + (f.amount - f.balance), 0),
          totalBalance: fees.reduce((sum: number, f: any) => sum + f.balance, 0),
          pendingFees: fees.filter((f: any) => f.status === "pending").length,
          overdueFees: fees.filter((f: any) => f.status === "overdue").length,
          paidFees: fees.filter((f: any) => f.status === "paid").length,
        })
      }
    }
    loadData()
  }, [schoolCode, studentId])

  useEffect(() => {
    if (student) {
      setProfileForm({
        name: student.name || "",
        email: student.email || "",
        phone: student.phone || ""
      })
    }
  }, [student])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge variant="default">Paid</Badge>
      case "overdue": return <Badge variant="destructive">Overdue</Badge>
      case "pending": return <Badge variant="secondary">Pending</Badge>
      case "partial": return <Badge variant="outline">Partial</Badge>
      default: return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleViewReceipt = (receipt: any) => {
    const payment = payments.find(p => p.id === receipt.paymentId)
    setSelectedReceipt(receipt)
    setSelectedPayment(payment)
    setShowReceipt(true)
  }

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('studentSession')
      sessionStorage.removeItem('studentSession')
    }
    router.push(`/schools/${schoolCode}/student/login`)
  }

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value })
  }

  const handleProfileSave = () => {
    setStudent((prev: any) => ({ ...prev, ...profileForm }))
    toast({ title: "Profile updated!", description: "Your changes have been saved locally." })
  }

  const handleAvatarChange = (avatarUrl: string) => {
    setStudent((prev: any) => ({ ...prev, avatar: avatarUrl }))
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Student not found</p>
        </div>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Fees</p>
                      <p className="text-2xl font-bold">${feesSummary?.totalFees?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Paid</p>
                      <p className="text-2xl font-bold text-green-600">${feesSummary?.totalPaid?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Balance</p>
                      <p className="text-2xl font-bold text-red-600">${feesSummary?.totalBalance?.toFixed(2) || '0.00'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Info */}
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{student.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Admission Number</p>
                    <p className="font-semibold">{student.admissionNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Class</p>
                    <p className="font-semibold">{student.className}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge variant={student.isActive ? "default" : "secondary"}>
                      {student.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )

      case 'fees':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Fee Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>{fee.name}</TableCell>
                      <TableCell>${fee.amount.toFixed(2)}</TableCell>
                      <TableCell>${fee.balance.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(fee.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )

      case 'payments':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                      <TableCell>${p.amount.toFixed(2)}</TableCell>
                      <TableCell className="capitalize">{p.paymentMethod}</TableCell>
                      <TableCell>{getStatusBadge(p.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )

      case 'receipts':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Receipts</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">{r.receiptNumber}</TableCell>
                      <TableCell>{new Date(r.generatedAt).toLocaleDateString()}</TableCell>
                      <TableCell>${r.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewReceipt(r)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View/Download
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )

      case 'profile':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Avatar */}
              <ProfileAvatar
                currentAvatar={student.avatar}
                userName={student.name}
                onAvatarChange={handleAvatarChange}
                size="lg"
              />

              {/* Profile Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleProfileSave(); }}>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        name="name"
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        name="email"
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                        value={profileForm.email}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
                        value={profileForm.phone}
                        onChange={handleProfileChange}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Admission Number</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        value={student.admissionNumber}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Class</label>
                      <input
                        type="text"
                        className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                        value={student.className}
                        disabled
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return <div>Content not found</div>
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar
        userType="student"
        user={{
          name: student.name || `Student ${studentId}`,
          email: student.email,
          avatar: student.avatar,
          admissionNumber: student.admissionNumber
        }}
        schoolName={schoolData?.name || 'School'}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'fees' && 'Fee Structure'}
              {activeTab === 'payments' && 'Payment History'}
              {activeTab === 'receipts' && 'Receipts'}
              {activeTab === 'profile' && 'Profile Settings'}
            </h1>
            <p className="text-gray-600 mt-1">
              {activeTab === 'overview' && 'Welcome back! Here\'s your fee summary and student information.'}
              {activeTab === 'fees' && 'View and manage your fee structure and outstanding balances.'}
              {activeTab === 'payments' && 'Track all your payment transactions and history.'}
              {activeTab === 'receipts' && 'Access and download your payment receipts.'}
              {activeTab === 'profile' && 'Update your profile information and profile picture.'}
            </p>
          </div>

          {renderContent()}
        </div>
      </div>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {selectedReceipt && (
            <ReceiptGenerator
              receipt={{
                id: selectedReceipt.id,
                receiptNumber: selectedReceipt.receiptNumber,
                amount: selectedReceipt.amount,
                paymentDate: selectedPayment?.paymentDate || new Date().toISOString(),
                paymentMethod: selectedPayment?.paymentMethod || 'unknown',
                referenceNumber: selectedPayment?.referenceNumber || '',
                studentName: student.name || 'Unknown',
                studentId: student.admissionNumber || 'Unknown',
                schoolName: schoolData?.name || 'Unknown',
                schoolCode: schoolData?.code || 'Unknown',
                generatedAt: selectedReceipt.generatedAt || new Date().toISOString()
              }}
              onClose={() => setShowReceipt(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 