"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Search, 
  User, 
  CreditCard, 
  FileText, 
  ArrowLeft,
  Eye,
  Download
} from "lucide-react"
import { getSchool } from "@/lib/school-storage"
import { PaymentPortal } from "@/components/fees/payment-portal"
import { PaymentForm } from "@/components/fees/payment-form"
import { StudentFeeStatement } from "@/components/fees/student-fee-statement"
import { PaymentGateway } from "@/components/fees/payment-gateway"
import { ReceiptGenerator } from "@/components/fees/receipt-generator"
import { useToast } from "@/hooks/use-toast"
import type { Student } from "@/lib/school-storage"
import type { Receipt, Payment } from "@/lib/types/fees"

interface PaymentPortalPageProps {
  params: {
    schoolCode: string
  }
}

export default function PaymentPortalPage({ params }: PaymentPortalPageProps) {
  const { schoolCode } = params
  const { toast } = useToast()
  const [schoolData, setSchoolData] = useState<any>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showPaymentGateway, setShowPaymentGateway] = useState(false)
  const [showReceiptDialog, setShowReceiptDialog] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [paymentAmount, setPaymentAmount] = useState(0)

  useEffect(() => {
    loadSchoolData()
  }, [schoolCode])

  const loadSchoolData = () => {
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
      setStudents(school.students || [])
    } catch (error) {
      console.error("Error loading school data:", error)
      toast({
        title: "Error",
        description: "Failed to load school data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.parentName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student)
  }

  const handlePaymentSubmitted = (payment: Payment) => {
    toast({
      title: "Payment Recorded",
      description: "Payment has been successfully recorded",
    })
    setShowPaymentForm(false)
    setShowPaymentGateway(false)
  }

  const handlePaymentSuccess = (paymentDetails: any) => {
    toast({
      title: "Payment Successful",
      description: `Payment of KES ${paymentDetails.amount.toLocaleString()} processed successfully`,
    })
    setShowPaymentGateway(false)
  }

  const handlePaymentFailed = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive"
    })
  }

  const handleViewReceipt = (receipt: Receipt) => {
    setSelectedReceipt(receipt)
    setShowReceiptDialog(true)
  }

  const handleMakePayment = (amount?: number) => {
    if (amount) {
      setPaymentAmount(amount)
      setShowPaymentGateway(true)
    } else {
      setShowPaymentForm(true)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment portal...</p>
        </div>
      </div>
    )
  }

  if (!schoolData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">School Not Found</h2>
            <p className="text-gray-600">
              The school with code "{schoolCode.toUpperCase()}" could not be found.
            </p>
            <Button className="mt-4" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
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
                  <CreditCard className="w-6 h-6" style={{ color: schoolData?.colorTheme }} />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payment Portal</h1>
                <p className="text-gray-600">{schoolData?.name}</p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Fees
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!selectedStudent ? (
          // Student Selection View
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Student</CardTitle>
                <CardDescription>
                  Search and select a student to view their fee statement and make payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search by student name, admission number, or parent name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No students found in this school.</p>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No students found matching your search.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredStudents.map((student) => (
                        <Card 
                          key={student.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleStudentSelect(student)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {student.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {student.admissionNumber}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Class: {student.class}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Student Fee Statement View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedStudent(null)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Students
                </Button>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedStudent.name}</h2>
                  <p className="text-gray-600">
                    {selectedStudent.admissionNumber} • {selectedStudent.class}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => handleMakePayment()}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Record Payment
                </Button>
                <Button 
                  onClick={() => handleMakePayment(1000)}
                  style={{ backgroundColor: schoolData?.colorTheme }}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Quick Pay
                </Button>
              </div>
            </div>

            <StudentFeeStatement
              schoolCode={schoolCode}
              student={selectedStudent}
              onMakePayment={handleMakePayment}
              onViewReceipt={handleViewReceipt}
            />
          </div>
        )}
      </div>

      {/* Payment Form Dialog */}
      <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <PaymentForm
              studentId={selectedStudent.id}
              studentName={selectedStudent.name}
              currentBalance={1000} // This should come from actual fee calculation
              onPaymentSubmitted={handlePaymentSubmitted}
              onCancel={() => setShowPaymentForm(false)}
              schoolTheme={schoolData?.colorTheme}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Gateway Dialog */}
      <Dialog open={showPaymentGateway} onOpenChange={setShowPaymentGateway}>
        <DialogContent className="max-w-md">
          {selectedStudent && (
            <PaymentGateway
              amount={paymentAmount}
              studentName={selectedStudent.name}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentFailed={handlePaymentFailed}
              onCancel={() => setShowPaymentGateway(false)}
              schoolTheme={schoolData?.colorTheme}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      {selectedReceipt && selectedStudent && (
        <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Payment Receipt</DialogTitle>
            </DialogHeader>
            <ReceiptGenerator
              receipt={selectedReceipt}
              payment={{
                id: selectedReceipt.paymentId,
                studentId: selectedStudent.id,
                amount: selectedReceipt.amount,
                paymentDate: selectedReceipt.paymentDate,
                paymentMethod: "mobile_money",
                receiptNumber: selectedReceipt.receiptNumber,
                description: "Fee payment",
                receivedBy: "System",
                createdAt: selectedReceipt.createdAt
              }}
              student={selectedStudent}
              schoolData={schoolData}
              onDownload={(format) => {
                toast({
                  title: "Download",
                  description: `Receipt downloaded in ${format} format`
                })
              }}
              onPrint={(format) => {
                toast({
                  title: "Print",
                  description: `Receipt printed in ${format} format`
                })
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 