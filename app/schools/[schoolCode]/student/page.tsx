"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { LogOut, User, BookOpen, FileText, DollarSign, Settings, Receipt, Key, Camera, Eye } from "lucide-react"
import { ReceiptGenerator } from "@/components/ui/receipt-generator"
import { ReceiptView } from "@/components/ui/receipt-view"
import { PaymentService } from "@/lib/services/payment-service"
import { Payment } from "@/lib/types/fees"

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
    setStudent((prev: any) => ({ ...prev, ...editData }))
    setEditProfile(false)
    setLastParentCredentials({
      admissionNumber: student.admissionNumber,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      tempPassword: student.tempPassword,
    })
    setShowParentCredentials(true)
  }
  const handleCancelEdit = () => {
    setEditProfile(false)
    setEditData({ ...student })
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
    if (oldPassword !== student?.tempPassword) {
      setPasswordMsg("Old password is incorrect.")
      return
    }
    const session = localStorage.getItem("student-auth")
    if (!session) return
    const { studentId } = JSON.parse(session)
    await fetch(`/api/schools/${schoolCode}/students`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, tempPassword: newPassword }),
    })
    setStudent((prev: any) => ({ ...prev, tempPassword: newPassword }))
    setPasswordMsg("Password changed successfully!")
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  if (!student) return null

  return (
    <div className="min-h-screen bg-gray-50/90 flex">
      {/* Sidebar */}
      <aside className="w-80 bg-white/90 shadow-xl flex flex-col items-center py-10 px-6 border-r rounded-r-3xl min-h-screen sticky top-0 z-10">
        {/* Profile at top */}
        <div className="flex flex-col items-center mb-8">
          <Avatar className="w-28 h-28 mb-3 ring-4 ring-blue-200 shadow-lg relative group">
            <img
              src={student.avatarUrl || "/placeholder-user.jpg"}
              alt={student.name || "Student Avatar"}
              className="rounded-full object-cover w-full h-full"
            />
            <label className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition" title="Change profile picture">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
              <Camera className="w-5 h-5" />
            </label>
            {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full"><span className="text-blue-600 font-bold">Uploading...</span></div>}
            {avatarError && <div className="absolute left-0 right-0 -bottom-8 text-xs text-red-600 text-center">{avatarError}</div>}
          </Avatar>
          <div className="text-xl font-bold text-gray-900">{student.name}</div>
          <div className="text-blue-700 font-semibold text-sm">{student.className || student.classLevel}</div>
        </div>
        {/* Navigation */}
        <nav className="flex flex-col w-full gap-2 mb-10">
          {sidebarNav.map((item) => (
            <button
              key={item.section}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeSection === item.section ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
              onClick={() => { setActiveSection(item.section); setEditProfile(false); }}
            >
              <item.icon className="w-6 h-6" /> {item.label}
            </button>
          ))}
        </nav>
        {/* Bottom: Profile edit and logout */}
        <div className="mt-auto w-full flex flex-col gap-2">
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent hover:bg-blue-50 hover:border-blue-200 text-gray-700`}
            onClick={handleEditProfile}
          >
            <User className="w-6 h-6" /> Edit Profile
          </button>
          <Button onClick={handleLogout} variant="outline" className="w-full flex items-center gap-2 border-blue-200">
            <LogOut className="w-5 h-5" /> Logout
          </Button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-0 px-0">
        <div className="w-full flex flex-col items-center">
          {/* Profile Section */}
          {activeSection === "profile" && student && !editProfile && (
            <SectionBlock>
              <div className="w-full min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
                <Card className="w-full max-w-3xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center">
                  <h2 className="text-3xl font-extrabold text-blue-800 mb-6 text-center">Profile Information</h2>
                  <div className="w-full">
                    <div className="flex flex-col items-center mb-8">
                      <Avatar className="w-28 h-28 mb-3 ring-4 ring-blue-200 shadow-lg relative group">
                        <img
                          src={student.avatarUrl || "/placeholder-user.jpg"}
                          alt={student.name || "Student Avatar"}
                          className="rounded-full object-cover w-full h-full"
                        />
                        <label className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition" title="Change profile picture">
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
                          <Camera className="w-5 h-5" />
                        </label>
                        {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full"><span className="text-blue-600 font-bold">Uploading...</span></div>}
                        {avatarError && <div className="absolute left-0 right-0 -bottom-8 text-xs text-red-600 text-center">{avatarError}</div>}
                      </Avatar>
                      <div className="text-xl font-bold text-gray-900">{student.name}</div>
                      <div className="text-blue-700 font-semibold text-sm">{student.className || student.classLevel}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-xl py-8 w-full max-w-5xl">
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
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
          {/* Edit Profile Section */}
          {activeSection === "profile" && student && editProfile && (
            <SectionBlock>
              <div className="w-full min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
                <Card className="w-full max-w-3xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center">
                  <h2 className="text-3xl font-extrabold text-blue-800 mb-6 text-center">Edit Profile</h2>
                  <div className="w-full">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-xl py-8 w-full max-w-5xl">
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Name</label>
                        <input
                          type="text"
                          name="name"
                          className="border rounded px-3 py-2"
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
                          className="border rounded px-3 py-2"
                          value={editData.phone}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Parent Name</label>
                        <input
                          type="text"
                          name="parentName"
                          className="border rounded px-3 py-2"
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
                          className="border rounded px-3 py-2"
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
                          className="border rounded px-3 py-2"
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
                          className="border rounded px-3 py-2"
                          value={editData.dateOfBirth}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Gender</label>
                        <input
                          type="text"
                          name="gender"
                          className="border rounded px-3 py-2"
                          value={editData.gender}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-semibold text-gray-700">Address</label>
                        <input
                          type="text"
                          name="address"
                          className="border rounded px-3 py-2"
                          value={editData.address}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="flex flex-col gap-2 col-span-2 mt-4 flex-row-reverse">
                        <Button type="submit" className="mr-2">Save</Button>
                        <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
          {/* Finance Section */}
          {activeSection === "finance" && (
            <SectionBlock>
              <div className="w-full min-h-[75vh] flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 py-12">
                <Card className="w-[90vw] max-w-5xl min-h-[60vh] rounded-2xl shadow-2xl bg-white/95 p-12 flex flex-col items-center justify-center">
                  <h2 className="text-4xl font-extrabold text-green-800 mb-8 text-center">Finance & Fees</h2>
                  
                  {/* Term Fee Structures */}
                  <div className="w-full mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-gray-800">Term Fee Structures</h3>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // Download all terms as PDF
                          alert('Download all terms feature will be implemented soon!');
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        Download All Terms
                      </Button>
                    </div>
                    
                    {/* Term Selection Tabs */}
                    <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                      {['Term 1', 'Term 2', 'Term 3'].map((term) => {
                        const currentDate = new Date();
                        const currentYear = currentDate.getFullYear();
                        const currentMonth = currentDate.getMonth();
                        
                        let currentTerm = "Term 1";
                        if (currentMonth >= 4 && currentMonth <= 7) currentTerm = "Term 2";
                        else if (currentMonth >= 8) currentTerm = "Term 3";
                        
                        const isCurrentTerm = term === currentTerm;
                        const isSelected = term === (feeStructure?.term || currentTerm);
                        
                        return (
                          <button
                            key={term}
                            onClick={() => fetchFeeStructure(student?.className || student?.classLevel, term)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                              isSelected 
                                ? 'bg-white text-green-700 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            } ${isCurrentTerm ? 'ring-2 ring-green-200' : ''}`}
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <span>{term}</span>
                              {isCurrentTerm && (
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    {loadingFees ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading fee structure...</p>
                      </div>
                    ) : feeStructure ? (
                      <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <div className="text-center mb-4">
                              <div className="text-3xl font-bold text-green-600">
                                KES {feeStructure.totalAmount?.toLocaleString() || '0'}
                              </div>
                              <div className="text-sm text-gray-600">Total Term Fees</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {feeStructure.term} {feeStructure.year} - {feeStructure.classLevel}
                              </div>
                            </div>
                            
                            <div className="bg-white rounded-lg p-4 space-y-2">
                              <div className="font-semibold text-gray-700 mb-3">Fee Breakdown:</div>
                              {Object.entries(feeStructure.breakdown || {}).map(([key, value]) => (
                                <div key={key} className="flex justify-between text-sm">
                                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                  <span className="font-medium">KES {value?.toLocaleString() || '0'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex flex-col justify-center">
                            <div className="text-center">
                              <div className="text-sm text-gray-600 mb-2">Released on</div>
                              <div className="font-medium">{new Date(feeStructure.createdAt).toLocaleDateString()}</div>
                            </div>
                            
                            <div className="mt-6 text-center">
                              <div className="text-sm text-gray-600 mb-2">Status</div>
                              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                Active
                              </div>
                            </div>
                            
                            <div className="mt-6 text-center space-y-2">
                              <Button 
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  // Download fee structure as PDF
                                  const feeStructureData = {
                                    term: feeStructure.term,
                                    year: feeStructure.year,
                                    classLevel: feeStructure.classLevel,
                                    totalAmount: feeStructure.totalAmount,
                                    breakdown: feeStructure.breakdown,
                                    studentName: student.name,
                                    admissionNumber: student.admissionNumber
                                  };
                                  // For now, just show an alert. In production, this would generate and download a PDF
                                  alert(`Downloading ${feeStructure.term} ${feeStructure.year} fee structure as PDF...`);
                                }}
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Download PDF
                              </Button>
                              <Button 
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                  // View detailed fee structure
                                  alert(`Viewing detailed ${feeStructure.term} ${feeStructure.year} fee structure...`);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        </div>
                        <p className="text-orange-600 font-medium">No fee structure available</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Fee structure for this term has not been released yet.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Payment History */}
                  <div className="w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-gray-800">Payment History</h3>
                      {payments.length > 0 && (
                        <Button 
                          onClick={() => setShowReceiptGenerator(true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Receipt className="w-4 h-4 mr-2" />
                          Generate Receipt
                        </Button>
                      )}
                    </div>
                    <table className="min-w-full text-sm border">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 border">Receipt No</th>
                          <th className="px-4 py-2 border">Date</th>
                          <th className="px-4 py-2 border">Amount</th>
                          <th className="px-4 py-2 border">Method</th>
                          <th className="px-4 py-2 border">Description</th>
                          <th className="px-4 py-2 border">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-gray-500">
                              <div className="flex flex-col items-center">
                                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                  <Receipt className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-sm">No payment history found</p>
                                <p className="text-xs text-gray-400 mt-1">Receipts will appear here once payments are made</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          payments.map((payment) => (
                            <tr key={payment.id}>
                              <td className="px-4 py-2 border">{payment.receiptNumber}</td>
                              <td className="px-4 py-2 border">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                              <td className="px-4 py-2 border">{payment.amount.toFixed(2)}</td>
                              <td className="px-4 py-2 border">{payment.paymentMethod.replace('_', ' ').toUpperCase()}</td>
                              <td className="px-4 py-2 border">{payment.description}</td>
                              <td className="px-4 py-2 border">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedReceipt(payment);
                                    setShowReceiptView(true);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Receipt className="w-4 h-4" /> View
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
          {/* My Class Section */}
          {activeSection === "class" && (
            <SectionBlock>
              <div className="w-full min-h-[75vh] flex items-center justify-center bg-gradient-to-br from-yellow-50 via-white to-blue-50 py-12">
                <Card className="w-[90vw] max-w-5xl min-h-[60vh] rounded-2xl shadow-2xl bg-white/95 p-12 flex flex-col items-center justify-center">
                  <h2 className="text-4xl font-extrabold text-yellow-700 mb-8 text-center">Class Information</h2>
                  <div className="w-full flex flex-col items-center">
                    <div className="mb-6 text-2xl font-semibold">
                      Class: <span className="text-blue-700">{student.className || student.classLevel}</span>
                    </div>
                    <div className="font-semibold mb-4 text-lg">Subjects Taking</div>
                    <ul className="list-disc ml-8 text-gray-700 text-lg grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 w-full max-w-2xl">
                      {/* Placeholder for future scalability, replace with real data if available */}
                      <li>Mathematics</li>
                      <li>English</li>
                      <li>Science</li>
                      <li>Social Studies</li>
                      <li>Computer Studies</li>
                    </ul>
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
          {/* My Grades Section */}
          {activeSection === "grades" && (
            <SectionBlock>
              <div className="w-full min-h-[75vh] flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 py-12">
                <Card className="w-[90vw] max-w-5xl min-h-[60vh] rounded-2xl shadow-2xl bg-white/95 p-12 flex flex-col items-center justify-center">
                  <h2 className="text-4xl font-extrabold text-purple-800 mb-8 text-center">Academic Performance</h2>
                  <div className="w-full">
                    <div className="mb-4 text-gray-700 text-lg">Below are your term-based grades. Download your performance report for each term.</div>
                    <table className="min-w-full text-sm border mb-6">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-2 border">Term</th>
                          <th className="px-4 py-2 border">Average Grade</th>
                          <th className="px-4 py-2 border">Download Report</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Placeholder data, replace with real grades if available */}
                        <tr>
                          <td className="px-4 py-2 border">Term 1</td>
                          <td className="px-4 py-2 border">B+</td>
                          <td className="px-4 py-2 border">
                            <a href="#" className="text-blue-600 underline">Download Performance Report</a>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border">Term 2</td>
                          <td className="px-4 py-2 border">A-</td>
                          <td className="px-4 py-2 border">
                            <a href="#" className="text-blue-600 underline">Download Performance Report</a>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 border">Term 3</td>
                          <td className="px-4 py-2 border">A</td>
                          <td className="px-4 py-2 border">
                            <a href="#" className="text-blue-600 underline">Download Performance Report</a>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
          {/* Settings Section */}
          {activeSection === "settings" && (
            <SectionBlock>
              <div className="w-full min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12">
                <Card className="w-full max-w-3xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center">
                  <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">Account Settings</h2>
                  <div className="w-full">
                    <div className="text-gray-500 mb-6">(Settings and preferences will appear here.)</div>
                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-md mx-auto bg-blue-50 p-6 rounded-xl shadow">
                      <div className="text-lg font-semibold mb-2 flex items-center gap-2"><Key className="w-5 h-5" /> Change Password</div>
                      <input
                        type="password"
                        className="w-full border rounded px-3 py-2"
                        placeholder="Old Password"
                        value={oldPassword}
                        onChange={e => setOldPassword(e.target.value)}
                      />
                      <input
                        type="password"
                        className="w-full border rounded px-3 py-2"
                        placeholder="New Password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                      <input
                        type="password"
                        className="w-full border rounded px-3 py-2"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                      {passwordMsg && <div className={`text-sm ${passwordMsg.includes("success") ? "text-green-600" : "text-red-600"}`}>{passwordMsg}</div>}
                      <Button type="submit" className="w-full">Change Password</Button>
                    </form>
                  </div>
                </Card>
              </div>
            </SectionBlock>
          )}
        </div>
      </main>
      {/* Receipt Generator Modal */}
      {showReceiptGenerator && (
        <ReceiptGenerator
          onClose={() => setShowReceiptGenerator(false)}
          onGenerate={(receiptData) => {
            const session = localStorage.getItem("student-auth")
            if (!session) return
            const { studentId } = JSON.parse(session)
            const payment = PaymentService.createPayment(schoolCode, studentId, receiptData)
            setPayments(prev => [payment, ...prev])
            setShowReceiptGenerator(false)
          }}
        />
      )}
      {/* Receipt View Modal */}
      {showReceiptView && selectedReceipt && (
        <ReceiptView
          receipt={selectedReceipt}
          studentName={student.name}
          studentClass={student.className || student.classLevel}
          admissionNumber={student.admissionNumber}
          onClose={() => setShowReceiptView(false)}
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
    </div>
  )
} 