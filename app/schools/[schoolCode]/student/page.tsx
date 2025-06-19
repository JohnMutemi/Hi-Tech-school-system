"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { LogOut, User, BookOpen, FileText, DollarSign, Settings, Receipt, Key, Camera } from "lucide-react"
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

function getStudent(schoolCode: string, studentId: string) {
  const schools = JSON.parse(localStorage.getItem("schools-data") || "{}")
  const school = schools[schoolCode.toLowerCase()]
  if (!school || !school.students) return null
  return school.students.find((s: any) => s.id === studentId) || null
}

function updateStudentProfile(schoolCode: string, studentId: string, updates: any) {
  const schools = JSON.parse(localStorage.getItem("schools-data") || "{}")
  const school = schools[schoolCode.toLowerCase()]
  if (!school || !school.students) return
  const idx = school.students.findIndex((s: any) => s.id === studentId)
  if (idx === -1) return
  school.students[idx] = { ...school.students[idx], ...updates }
  schools[schoolCode.toLowerCase()] = school
  localStorage.setItem("schools-data", JSON.stringify(schools))
}

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

  useEffect(() => {
    const session = localStorage.getItem("student-auth")
    if (!session) {
      router.replace(`/schools/${schoolCode}/students/login`)
      return
    }
    const { studentId } = JSON.parse(session)
    const s = getStudent(schoolCode, studentId)
    if (!s) {
      router.replace(`/schools/${schoolCode}/students/login`)
      return
    }
    setStudent(s)
    setEditData({ ...s })
    // Load payment history
    const paymentHistory = PaymentService.getPaymentHistory(schoolCode, studentId)
    setPayments(paymentHistory)
  }, [schoolCode, router])

  const handleLogout = () => {
    localStorage.removeItem("student-auth")
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
    reader.onload = (ev) => {
      const avatarUrl = ev.target?.result as string
      const session = localStorage.getItem("student-auth")
      if (!session) {
        setAvatarUploading(false)
        setAvatarError("Session expired. Please log in again.")
        return
      }
      const { studentId } = JSON.parse(session)
      updateStudentProfile(schoolCode, studentId, { avatarUrl })
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
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    const session = localStorage.getItem("student-auth")
    if (!session) return
    const { studentId } = JSON.parse(session)
    updateStudentProfile(schoolCode, studentId, { ...editData })
    setStudent((prev: any) => ({ ...prev, ...editData }))
    setEditProfile(false)
    setLastParentCredentials({
      admissionNumber: student.admissionNumber,
      parentPhone: student.parentPhone,
      parentEmail: student.parentEmail,
      tempPassword,
    })
    setShowParentCredentials(true)
  }
  const handleCancelEdit = () => {
    setEditProfile(false)
    setEditData({ ...student })
  }

  // Change password logic
  const handleChangePassword = (e: React.FormEvent) => {
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
    // Update password
    const session = localStorage.getItem("student-auth")
    if (!session) return
    const { studentId } = JSON.parse(session)
    updateStudentProfile(schoolCode, studentId, { tempPassword: newPassword })
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
          <div className="text-blue-700 font-semibold text-sm">{student.class}</div>
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
                      <div className="text-blue-700 font-semibold text-sm">{student.class}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-xl py-8 w-full max-w-5xl">
                      <div>
                        <div className="font-semibold text-gray-700">Admission No:</div>
                        <div>{student.admissionNumber}</div>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-700">Class:</div>
                        <div>{student.class}</div>
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
                          name="class"
                          className="border rounded px-3 py-2"
                          value={editData.class}
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
                  <h2 className="text-4xl font-extrabold text-green-800 mb-8 text-center">Payment History</h2>
                  <div className="w-full">
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
                            <td colSpan={6} className="text-center py-4 text-gray-500">
                              No payment history found
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
                                  onClick={() => setSelectedReceipt(payment) || setShowReceiptView(true)}
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
                      Class: <span className="text-blue-700">{student.class}</span>
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
          studentClass={student.class}
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