"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { LogOut, User, BookOpen, FileText, DollarSign, Settings, Receipt, Key, Camera, Eye, Menu } from "lucide-react"
import { ReceiptGenerator } from "@/components/ui/receipt-generator"
import { ReceiptView } from "@/components/ui/receipt-view"
// Commented out unused import - payment functionality handled elsewhere
// import { paymentService } from "@/lib/services/payment-service"
import { Payment } from "@/lib/types/fees"
import { Badge } from "@/components/ui/badge"

const sidebarNav = [
  { label: "My Class", icon: BookOpen, section: "class" },
  { label: "My Grades", icon: FileText, section: "grades" },
  { label: "Finances", icon: DollarSign, section: "finance" },
  { label: "Settings", icon: Settings, section: "settings" },
]

// Simple fade/slide animation utility
function SectionBlock({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.classList.add("animate-section-launch")
    }
  }, [])
  return (
    <div ref={ref} className="transition-all duration-200 opacity-90 -translate-y-2 animate-section-launch-block">
      {children}
    </div>
  )
}

// Marquee effect for section headers
function Marquee({ text }: { text: string }) {
  return (
    <div className="overflow-hidden w-full mb-6">
      <div className="whitespace-nowrap animate-marquee text-blue-700 font-semibold text-lg">
        {text}
      </div>
    </div>
  )
}

// Welcome message component
function WelcomeMessage({ name }: { name: string }) {
  return (
    <div className="mb-2 text-gray-500 text-xs font-medium tracking-wide">
      Welcome back, {name}!
    </div>
  )
}

export default function StudentDashboardPage({ params }: { params: { schoolCode: string } }) {
  const { schoolCode } = params
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [activeSection, setActiveSection] = useState("class")
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false)
  const [showReceiptView, setShowReceiptView] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [editProfile, setEditProfile] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  // Change password states
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMsg, setPasswordMsg] = useState("")
  const [lastParentCredentials, setLastParentCredentials] = useState<any>(null)
  const [showParentCredentials, setShowParentCredentials] = useState(false)
  const [feeStructure, setFeeStructure] = useState<any>(null)
  const [loadingFees, setLoadingFees] = useState(true)
  const [selectedTerm, setSelectedTerm] = useState<string>("")
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  useEffect(() => {
    async function fetchStudent() {
      try {
        // Check session via API
        const sessionRes = await fetch(`/api/schools/${schoolCode}/students/session`)
        if (!sessionRes.ok) {
          router.replace(`/schools/${schoolCode}/students/login`)
          return
        }
        const session = await sessionRes.json()
        const studentId = session.studentId
        if (!studentId) {
          router.replace(`/schools/${schoolCode}/students/login`)
          return
        }
        // Fetch student data by ID
        const res = await fetch(`/api/schools/${schoolCode}/students/${studentId}`)
        if (!res.ok) {
          router.replace(`/schools/${schoolCode}/students/login`)
          return
        }
        const s = await res.json()
        setStudent(s)
        setEditData({ ...s })
        
        // Fetch fee structure for the student's class
        await fetchFeeStructure(s.className || s.classLevel)
        
        // TODO: Fetch payment history from API
      } catch (err) {
        router.replace(`/schools/${schoolCode}/students/login`)
      }
    }
    fetchStudent()
  }, [schoolCode, router])

  // Listen for fee structure updates from admin panel
  useEffect(() => {
    const handleFeeStructureUpdate = (event: CustomEvent) => {
      if (event.detail.schoolCode === schoolCode && student) {
        console.log('Fee structure updated, refreshing student data...')
        fetchFeeStructure(student.className || student.classLevel)
      }
    }

    window.addEventListener('feeStructureUpdated', handleFeeStructureUpdate as EventListener)
    
    return () => {
      window.removeEventListener('feeStructureUpdated', handleFeeStructureUpdate as EventListener)
    }
  }, [schoolCode, student])

  // Fetch fee structure for student's class
  const fetchFeeStructure = async (studentClass: string, selectedTerm?: string) => {
    try {
      setLoadingFees(true)
      
      // Get current term if no specific term is selected
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth()
      
      let currentTerm = "Term 1"
      if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2"
      else if (currentMonth >= 8) currentTerm = "Term 3"

      // Use selected term or default to current term
      const termToFetch = selectedTerm || currentTerm

      console.log(`Fetching fee structure for: ${studentClass}, Term: ${termToFetch}, Year: ${currentYear}`)

      // Fetch fee structure for the student's class and specific term
      const response = await fetch(
        `/api/schools/${schoolCode}/fee-structure?term=${termToFetch}&year=${currentYear}&classLevel=${encodeURIComponent(studentClass)}`
      )
      
      if (response.ok) {
        const feeStructures = await response.json()
        console.log('Fee structures received:', feeStructures)
        
        const activeFeeStructure = feeStructures.find((fee: any) => fee.isActive)
        console.log('Active fee structure:', activeFeeStructure)
        
        setFeeStructure(activeFeeStructure || null)
      } else {
        console.error('Failed to fetch fee structure:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('Error details:', errorData)
        setFeeStructure(null)
      }
    } catch (error) {
      console.error("Failed to fetch fee structure:", error)
      setFeeStructure(null)
    } finally {
      setLoadingFees(false)
    }
  }

  const handleLogout = async () => {
    // Optionally, call a logout API to clear the cookie
    await fetch(`/api/schools/${schoolCode}/students/logout`, { method: "POST" })
    router.replace(`/schools/${schoolCode}/students/login`)
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
      const session = localStorage.getItem("student-auth")
      if (!session) {
        setAvatarUploading(false)
        setAvatarError("Session expired. Please log in again.")
        return
      }
      const { studentId } = JSON.parse(session)
      await fetch(`/api/schools/${schoolCode}/students`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, avatarUrl }),
      })
      setStudent((prev: any) => ({ ...prev, avatarUrl }))
      setEditData((prev: any) => ({ ...prev, avatarUrl }))
      setAvatarUploading(false)
    }
    reader.onerror = () => {
      setAvatarUploading(false)
      setAvatarError("Failed to read image file. Please try again.")
    }
    reader.readAsDataURL(file)
  }

  // Edit profile logic
  const handleEditProfile = () => {
    setEditData({ ...student })
    setEditProfile(true)
    setActiveSection("profile")
  }
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditData((prev: any) => ({ ...prev, [name]: value }))
  }
  const handleEditAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    reader.onload = (ev) => {
      const avatarUrl = ev.target?.result as string
      setEditData((prev: any) => ({ ...prev, avatarUrl }))
      setAvatarUploading(false)
    }
    reader.onerror = () => {
      setAvatarUploading(false)
      setAvatarError("Failed to read image file. Please try again.")
    }
    reader.readAsDataURL(file)
  }
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    const session = localStorage.getItem("student-auth")
    if (!session) return
    const { studentId } = JSON.parse(session)
    await fetch(`/api/schools/${schoolCode}/students`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, ...editData }),
    })
    const updatedStudent = await fetch(`/api/schools/${schoolCode}/students/${studentId}`)
    if (!updatedStudent.ok) {
      console.error("Failed to update student profile")
      return
    }
    const studentData = await updatedStudent.json()
    setStudent(studentData)
    setEditProfile(false)
    setLastParentCredentials({
      admissionNumber: studentData.admissionNumber,
      parentPhone: studentData.parentPhone,
      parentEmail: studentData.parentEmail,
      tempPassword: studentData.tempPassword,
    })
    setShowParentCredentials(true)
  }
  const handleCancelEdit = () => {
    setEditProfile(false)
    setEditData({ ...student })
    setActiveSection("class")
  }

  // Change password logic
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMsg("")
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match.")
      return
    }
    try {
      // API call to change password
      const res = await fetch(`/api/schools/${schoolCode}/students/password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("student-token")}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to change password")
      }
      setPasswordMsg("Password changed successfully!")
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      setPasswordMsg(err.message)
    }
  }

  // Handle term selection
  const handleTermChange = (term: string) => {
    setSelectedTerm(term)
    if (student) {
      fetchFeeStructure(student.className || student.classLevel, term)
    }
  }

  // Generate parent credentials
  const generateParentCredentials = async () => {
    const res = await fetch(
      `/api/schools/${schoolCode}/parents/credentials`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: student.id }),
      }
    )
    if (res.ok) {
      const creds = await res.json()
      setLastParentCredentials(creds)
    }
  }

  const handlePayment = async () => {
    setShowReceiptGenerator(true)
  }

  const handleReceiptGenerated = async (paymentDetails: Omit<Payment, "id" | "receiptNumber" | "student" | "createdAt" | "receivedBy">) => {
    // A mock payment object, since we don't have a backend implementation for this part yet
    const mockPayment: Payment = {
      ...paymentDetails,
      id: `PAY-${Date.now()}`,
      student: student,
      receiptNumber: `RCPT-${Math.floor(Math.random() * 10000)}`,
      paymentDate: new Date().toISOString(), // Use ISO string
      status: 'completed', // Assuming a status field exists
      paymentMethod: 'mpesa', // Valid enum value
      receivedBy: 'System',
      createdAt: new Date().toISOString()
    };
  
    // Add the new payment to the list
    setPayments(prev => [mockPayment, ...prev]);
    setSelectedReceipt(mockPayment);
    setShowReceiptGenerator(false);
    setShowReceiptView(true);
  
    // In a real app, you would send this to the backend
    try {
      console.log('Mock payment recorded:', { schoolCode, studentId: student.id, payment: mockPayment });
      // Maybe show a success toast
    } catch (error) {
      // Handle error, maybe show an error toast
    }
  }

  if (!student) return null

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-blue-800 to-blue-500 text-white shadow-xl flex flex-col items-center py-10 px-4 border-r transition-transform md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col items-center mb-10 w-full">
          <Avatar className="w-24 h-24 mb-4 ring-4 ring-white shadow-lg">
            <img src={student?.avatarUrl || '/placeholder-user.jpg'} alt={student?.name} />
          </Avatar>
          <div className="font-bold text-xl truncate w-full text-center">{student?.name}</div>
          <div className="text-xs text-blue-100 mb-2">{student?.admissionNumber}</div>
        </div>
        <nav className="flex flex-col gap-3 w-full">
          {sidebarNav.map(item => (
            <button
              key={item.section}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-base text-left shadow-sm border border-transparent ${activeSection === item.section ? 'bg-white text-blue-700 shadow-md' : 'hover:bg-blue-600/80 hover:text-white text-blue-100'}`}
              onClick={() => { setActiveSection(item.section); setIsSidebarOpen(false); }}
            >
              <item.icon className="w-5 h-5" /> {item.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto w-full pt-10">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowLogoutModal(true)}
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="bg-gradient-to-r from-blue-700 to-blue-500 text-white border-b p-4 flex justify-between items-center sticky top-0 z-20 md:hidden shadow-md">
          <Button variant="ghost" size="icon" className="text-white" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-base truncate max-w-[120px]">{student?.name}</span>
            <Avatar className="w-8 h-8">
              <img src={student?.avatarUrl || '/placeholder-user.jpg'} alt={student?.name} />
            </Avatar>
          </div>
        </header>

        <main className="flex-grow p-4 md:p-8 bg-gradient-to-br from-white via-blue-50 to-purple-50">
          {activeSection === "profile" && student && !editProfile && (
            <SectionBlock>
              <div className="w-full min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
                <Card className="w-full max-w-2xl rounded-3xl shadow-2xl bg-white/95 p-8 md:p-12 flex flex-col items-center border-2 border-blue-200">
                  <h2 className="text-3xl font-extrabold text-blue-800 mb-8 text-center drop-shadow-lg tracking-tight">
                    Profile Information
                  </h2>
                  <div className="flex flex-col items-center mb-8">
                    <Avatar className="w-28 h-28 mb-3 ring-4 ring-blue-200 shadow-lg relative group">
                      <img
                        src={student.avatarUrl || "/placeholder-user.jpg"}
                        alt={student.name || "Student Avatar"}
                        className="rounded-full object-cover w-full h-full"
                      />
                    </Avatar>
                    <div className="text-xl font-bold text-gray-900">{student.name}</div>
                    <div className="text-blue-700 font-semibold text-sm">{student.className || student.classLevel}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base py-4 w-full max-w-3xl">
                    <div>
                      <div className="font-semibold text-gray-700">Admission No:</div>
                      <div>{student.admissionNumber}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Class:</div>
                      <div>{student.className || student.classLevel}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Phone:</div>
                      <div>{student.phone || "-"}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Parent Name:</div>
                      <div>{student.parentName}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Parent Phone:</div>
                      <div>{student.parentPhone}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Date of Birth:</div>
                      <div>{student.dateOfBirth}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Gender:</div>
                      <div>{student.gender}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Address:</div>
                      <div>{student.address}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Date Admitted:</div>
                      <div>{student.dateAdmitted}</div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-700">Status:</div>
                      <div>{student.status}</div>
                    </div>
                  </div>
                  <Button
                    onClick={handleEditProfile}
                    className="mt-8 w-full md:w-auto bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl text-lg shadow"
                  >
                    Edit Profile
                  </Button>
                </Card>
              </div>
            </SectionBlock>
          )}
          {activeSection === "profile" && student && editProfile && (
            <SectionBlock>
              <div className="w-full min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
                <Card className="w-full max-w-2xl rounded-3xl shadow-2xl bg-white/95 p-8 md:p-12 flex flex-col items-center border-2 border-blue-200">
                  <h2 className="text-3xl font-extrabold text-blue-800 mb-8 text-center drop-shadow-lg tracking-tight">
                    Edit Profile
                  </h2>
                  <form onSubmit={handleSaveProfile} className="w-full space-y-6">
                    <div className="flex flex-col items-center mb-8">
                      <Avatar className="w-28 h-28 mb-3 ring-4 ring-blue-200 shadow-lg relative group">
                        <img
                          src={editData.avatarUrl || "/placeholder-user.jpg"}
                          alt={editData.name || "Student Avatar"}
                          className="rounded-full object-cover w-full h-full"
                        />
                      </Avatar>
                      <div className="text-xl font-bold text-gray-900">{editData.name}</div>
                      <div className="text-blue-700 font-semibold text-sm">{editData.email}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-base w-full max-w-3xl mx-auto">
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Name</label>
                        <input
                          type="text"
                          name="name"
                          className="border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                          value={editData.name}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Phone</label>
                        <input
                          type="text"
                          name="phone"
                          className="border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                          value={editData.phone}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Parent Name</label>
                        <input
                          type="text"
                          name="parentName"
                          className="border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                          value={editData.parentName}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Parent Phone</label>
                        <input
                          type="text"
                          name="parentPhone"
                          className="border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                          value={editData.parentPhone}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Class</label>
                        <input
                          type="text"
                          name="className"
                          className="border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                          value={editData.className || editData.classLevel || ""}
                          onChange={handleEditChange}
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          className="border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                          value={editData.dateOfBirth}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Gender</label>
                        <input
                          type="text"
                          name="gender"
                          className="border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                          value={editData.gender}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Address</label>
                        <input
                          type="text"
                          name="address"
                          className="border rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-blue-300"
                          value={editData.address}
                          onChange={handleEditChange}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row justify-end mt-8 gap-4">
                      <Button
                        type="submit"
                        className="bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl text-lg shadow"
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="font-bold py-3 px-8 rounded-xl text-lg shadow"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Card>
              </div>
            </SectionBlock>
          )}
          {activeSection === "finance" && (
            <SectionBlock>
              <div className="w-full min-h-[75vh] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 py-12">
                <Card className="w-full max-w-3xl rounded-3xl shadow-2xl bg-white/95 p-6 md:p-10 flex flex-col items-center border-2 border-green-200">
                  <h2 className="text-4xl font-extrabold text-green-700 mb-8 text-center drop-shadow-lg tracking-tight">
                    Fee Status
                  </h2>
                  <div className="w-full flex flex-col gap-8">
                    {/* Fee Structure Summary */}
                    {loadingFees ? (
                      <div className="flex justify-center items-center py-8">
                        <span className="text-lg text-gray-500">Loading fee structure...</span>
                      </div>
                    ) : feeStructure ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <span className="font-semibold text-gray-700">Term:</span>{" "}
                            <span className="text-green-700 font-bold">{feeStructure.term}</span>
                            <span className="mx-2 text-gray-400">|</span>
                            <span className="font-semibold text-gray-700">Year:</span>{" "}
                            <span className="text-green-700 font-bold">{feeStructure.year}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Class:</span>{" "}
                            <span className="text-green-700 font-bold">{feeStructure.classLevel}</span>
                          </div>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div className="text-2xl font-bold text-green-800">
                            Total Fees: <span className="text-green-600">KES {feeStructure.totalAmount.toLocaleString()}</span>
                          </div>
                          <Button
                            onClick={handlePayment}
                            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl text-lg shadow"
                          >
                            Make Payment
                          </Button>
                        </div>
                        {/* Fee Breakdown */}
                        <div className="mt-4">
                          <h3 className="font-semibold text-gray-700 mb-2">Breakdown</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.entries(feeStructure.breakdown).map(([key, value]) => (
                              <div
                                key={key}
                                className="flex justify-between items-center bg-green-50 rounded-lg px-4 py-2 shadow-sm"
                              >
                                <span className="text-gray-700">{key}</span>
                                <span className="font-bold text-green-700">KES {(value as number).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-center items-center py-8">
                        <span className="text-lg text-gray-500">No active fee structure for the selected term.</span>
                      </div>
                    )}

                    {/* Payment History */}
                    <div className="mt-8">
                      <h3 className="font-semibold text-gray-700 mb-2">Payment History</h3>
                      <Card className="w-full max-w-3xl rounded-3xl shadow-2xl bg-white/95 p-8 md:p-12 border-2 border-green-200 mx-auto mt-10">
                        <CardHeader>
                          <CardTitle className="text-3xl font-extrabold text-green-800 mb-2 text-center drop-shadow-lg tracking-tight">
                            Payments History
                          </CardTitle>
                          <CardDescription className="text-center text-gray-500 mb-6">
                            A log of all payments made for your children.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto rounded-xl shadow bg-gray-50">
                            <table className="min-w-full text-sm rounded-xl overflow-hidden">
                              <thead>
                                <tr className="bg-green-100 text-green-800">
                                  <th className="px-4 py-2 border">Student</th>
                                  <th className="px-4 py-2 border">Amount (KES)</th>
                                  <th className="px-4 py-2 border">Date</th>
                                  <th className="px-4 py-2 border">Receipt No.</th>
                                  <th className="px-4 py-2 border">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {payments.length > 0 ? (
                                  payments.map((receipt) => (
                                    <tr key={receipt.id} className="even:bg-green-50">
                                      <td className="px-4 py-2 border font-medium">
                                        {student.name}
                                      </td>
                                      <td className="px-4 py-2 border font-bold text-green-700">
                                        {receipt.amount.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-2 border">
                                        {new Date(receipt.paymentDate).toLocaleDateString()}
                                      </td>
                                      <td className="px-4 py-2 border">{receipt.receiptNumber}</td>
                                      <td className="px-4 py-2 border">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setSelectedReceipt(receipt)}
                                          className="text-green-700 border-green-200 hover:bg-green-100"
                                        >
                                          View Receipt
                                        </Button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="text-center py-8 text-gray-500">
                                      No payment history found.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
          {activeSection === "class" && (
            <SectionBlock>
              <div className="w-full min-h-[75vh] flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-50 py-12">
                <Card className="w-full max-w-3xl rounded-3xl shadow-2xl bg-white/95 p-10 flex flex-col items-center border-2 border-blue-100">
                  <h2 className="text-4xl font-extrabold text-blue-700 mb-8 text-center drop-shadow-lg tracking-tight">
                    Class Information
                  </h2>
                  <div className="w-full flex flex-col items-center">
                    <div className="mb-6 text-2xl font-semibold">
                      Class: <span className="text-blue-700">{student.className || student.classLevel}</span>
                    </div>
                    <div className="font-semibold mb-4 text-lg">Subjects Taking</div>
                    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-2xl">
                      {/* Placeholder for future scalability, replace with real data if available */}
                      <li className="bg-blue-100 text-blue-700 rounded-full px-4 py-2 font-medium text-center shadow">Mathematics</li>
                      <li className="bg-blue-100 text-blue-700 rounded-full px-4 py-2 font-medium text-center shadow">English</li>
                      <li className="bg-blue-100 text-blue-700 rounded-full px-4 py-2 font-medium text-center shadow">Science</li>
                      <li className="bg-blue-100 text-blue-700 rounded-full px-4 py-2 font-medium text-center shadow">Social Studies</li>
                      <li className="bg-blue-100 text-blue-700 rounded-full px-4 py-2 font-medium text-center shadow">Computer Studies</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
          {activeSection === "grades" && (
            <SectionBlock>
              <div className="w-full min-h-[75vh] flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
                <Card className="w-full max-w-3xl rounded-3xl shadow-2xl bg-white/95 p-10 flex flex-col items-center border-2 border-purple-100">
                  <h2 className="text-4xl font-extrabold text-purple-800 mb-8 text-center drop-shadow-lg tracking-tight">
                    Academic Performance
                  </h2>
                  <div className="w-full">
                    <div className="mb-4 text-gray-700 text-lg">
                      Below are your term-based grades. Download your performance report for each term.
                    </div>
                    <div className="overflow-x-auto rounded-xl shadow">
                      <table className="min-w-full text-sm border mb-6 rounded-xl overflow-hidden">
                        <thead>
                          <tr className="bg-purple-100 text-purple-800">
                            <th className="px-4 py-2 border">Term</th>
                            <th className="px-4 py-2 border">Average Grade</th>
                            <th className="px-4 py-2 border">Download Report</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Placeholder data, replace with real grades if available */}
                          <tr className="even:bg-purple-50">
                            <td className="px-4 py-2 border font-medium">Term 1</td>
                            <td className="px-4 py-2 border font-bold text-blue-700 text-lg">B+</td>
                            <td className="px-4 py-2 border">
                              <a href="#" className="text-blue-600 underline font-semibold hover:text-blue-800 transition">
                                Download Performance Report
                              </a>
                            </td>
                          </tr>
                          <tr className="even:bg-purple-50">
                            <td className="px-4 py-2 border font-medium">Term 2</td>
                            <td className="px-4 py-2 border font-bold text-blue-700 text-lg">A-</td>
                            <td className="px-4 py-2 border">
                              <a href="#" className="text-blue-600 underline font-semibold hover:text-blue-800 transition">
                                Download Performance Report
                              </a>
                            </td>
                          </tr>
                          <tr className="even:bg-purple-50">
                            <td className="px-4 py-2 border font-medium">Term 3</td>
                            <td className="px-4 py-2 border font-bold text-blue-700 text-lg">A</td>
                            <td className="px-4 py-2 border">
                              <a href="#" className="text-blue-600 underline font-semibold hover:text-blue-800 transition">
                                Download Performance Report
                              </a>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
          {activeSection === "settings" && (
            <SectionBlock>
              <div className="w-full min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12">
                <Card className="w-full max-w-2xl rounded-3xl shadow-2xl bg-white/95 p-8 md:p-12 flex flex-col items-center border-2 border-blue-200">
                  <h2 className="text-3xl font-extrabold text-blue-800 mb-8 text-center drop-shadow-lg tracking-tight">
                    Account Settings
                  </h2>
                  <div className="w-full">
                    <form
                      onSubmit={handleChangePassword}
                      className="space-y-6 max-w-md mx-auto bg-blue-50 p-6 rounded-2xl shadow"
                    >
                      <div className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Key className="w-5 h-5" /> Change Password
                      </div>
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
                            passwordMsg.includes("success") ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {passwordMsg}
                        </div>
                      )}
                      <Button
                        type="submit"
                        className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-8 rounded-xl text-lg shadow"
                      >
                        Update Password
                      </Button>
                    </form>
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
        </main>
      </div>

      {showReceiptGenerator && (
        <ReceiptGenerator
          student={student}
          feeStructure={feeStructure}
          onClose={() => setShowReceiptGenerator(false)}
          onReceiptGenerated={handleReceiptGenerated}
        />
      )}
      {showReceiptView && selectedReceipt && (
        <ReceiptView
          receipt={selectedReceipt}
          onClose={() => setShowReceiptView(false)}
          onDownload={() => { /* Placeholder */ }}
        />
      )}
      {showParentCredentials && lastParentCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Parent Login Credentials</h2>
            <div className="mb-4 text-gray-700 text-sm">
              Share these credentials with the parent for their first login.<br />
              (Simulated for now. In the future, this can be sent via SMS/email.)
            </div>
            <div className="bg-gray-100 rounded p-4 text-left text-xs mb-4">
              <div><b>Admission Number:</b> {lastParentCredentials.admissionNumber}</div>
              <div><b>Parent Phone:</b> {lastParentCredentials.parentPhone}</div>
              {lastParentCredentials.parentEmail && (
                <div><b>Parent Email:</b> {lastParentCredentials.parentEmail}</div>
              )}
              <div><b>Temporary Password:</b> {lastParentCredentials.tempPassword}</div>
            </div>
            <a
              href="#"
              className="text-blue-600 underline mb-4 block"
              onClick={e => { e.preventDefault(); /* future: trigger SMS/email */ }}
            >
              Parent Access (future: send via SMS/email)
            </a>
            <button
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowParentCredentials(false)}
            >
              Close
            </button>
          </div>
        </div>
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