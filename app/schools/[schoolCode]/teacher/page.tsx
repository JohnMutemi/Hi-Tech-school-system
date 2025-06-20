"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { LogOut, User, BookOpen, Users, Settings, Key } from "lucide-react"

const sidebarNav = [
  { label: "My Classes", icon: BookOpen, section: "classes" },
  { label: "My Students", icon: Users, section: "students" },
  { label: "Settings", icon: Settings, section: "settings" },
  { label: "Profile", icon: User, section: "profile" },
]

export default function TeacherDashboardPage({ params }: { params: { schoolCode: string } }) {
  const { schoolCode } = params
  const router = useRouter()
  const [teacher, setTeacher] = useState<any>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMsg, setPasswordMsg] = useState("")
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState("")
  const [editProfile, setEditProfile] = useState(false)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => {
    async function fetchTeacher() {
      try {
        const sessionRes = await fetch(`/api/schools/${schoolCode}/teachers/session`)
        if (!sessionRes.ok) {
          router.replace(`/schools/${schoolCode}/teachers/login`)
          return
        }
        const session = await sessionRes.json()
        const teacherId = session.teacherId
        if (!teacherId) {
          router.replace(`/schools/${schoolCode}/teachers/login`)
          return
        }
        const res = await fetch(`/api/schools/${schoolCode}/teachers/${teacherId}`)
        if (!res.ok) {
          router.replace(`/schools/${schoolCode}/teachers/login`)
          return
        }
        const teacherData = await res.json()
        setTeacher(teacherData)
      } catch (err) {
        router.replace(`/schools/${schoolCode}/teachers/login`)
      }
    }
    fetchTeacher()
  }, [schoolCode, router])

  const handleLogout = async () => {
    await fetch(`/api/schools/${schoolCode}/teachers/logout`, { method: "POST" })
    router.replace(`/schools/${schoolCode}/teachers/login`)
  }

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
      await fetch(`/api/schools/${schoolCode}/teachers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId: teacher.id, avatarUrl }),
      })
      setTeacher((prev: any) => ({ ...prev, avatarUrl }))
      setAvatarUploading(false)
    }
    reader.onerror = () => {
      setAvatarUploading(false)
      setAvatarError("Failed to read image file. Please try again.")
    }
    reader.readAsDataURL(file)
  }

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
    if (oldPassword !== teacher?.tempPassword) {
      setPasswordMsg("Old password is incorrect.")
      return
    }
    if (!teacher?.id) return
    const teacherId = teacher.id
    await fetch(`/api/schools/${schoolCode}/teachers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teacherId, tempPassword: newPassword }),
    })
    setTeacher((prev: any) => ({ ...prev, tempPassword: newPassword }))
    setPasswordMsg("Password changed successfully!")
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleEditProfile = () => {
    setEditData({
      name: teacher.name,
      phone: teacher.phone,
      qualification: teacher.qualification,
      avatarUrl: teacher.avatarUrl,
    })
    setEditProfile(true)
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
    if (!teacher?.id) return
    const teacherId = teacher.id
    await fetch(`/api/schools/${schoolCode}/teachers`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teacherId: teacherId, ...editData }),
    })
    setTeacher((prev: any) => ({ ...prev, ...editData }))
    setEditProfile(false)
  }

  const handleCancelEdit = () => {
    setEditProfile(false)
    setEditData({})
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white/90 shadow-xl flex flex-col items-center py-10 px-6 border-r rounded-r-3xl min-h-screen sticky top-0 z-10">
        <Avatar className="w-28 h-28 mb-5 ring-4 ring-blue-200 shadow-lg relative group">
          <img
            src={teacher?.avatarUrl || "/placeholder-user.jpg"}
            alt={teacher?.name || "Teacher Avatar"}
            className="rounded-full object-cover w-full h-full"
          />
          <label className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition" title="Change profile picture">
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h6m2 2a2 2 0 11-4 0 2 2 0 014 0zm-6 2a2 2 0 11-4 0 2 2 0 014 0zm2-10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </label>
          {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full"><span className="text-blue-600 font-bold">Uploading...</span></div>}
          {avatarError && <div className="absolute left-0 right-0 -bottom-8 text-xs text-red-600 text-center">{avatarError}</div>}
        </Avatar>
        <div className="text-2xl font-bold mb-1 text-gray-900">{teacher?.name}</div>
        <div className="text-gray-500 text-sm mb-8">{teacher?.email}</div>
        <nav className="flex flex-col w-full gap-2 mb-10">
          {sidebarNav.map((item) => (
            <button
              key={item.section}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent ${activeSection === item.section ? "bg-blue-600 text-white shadow-md" : "hover:bg-blue-50 hover:border-blue-200 text-gray-700"}`}
              onClick={() => setActiveSection(item.section)}
            >
              <item.icon className="w-6 h-6" /> {item.label}
            </button>
          ))}
          <button
            className={`flex items-center gap-3 px-5 py-3 rounded-xl transition font-semibold text-lg text-left shadow-sm border border-transparent hover:bg-blue-50 hover:border-blue-200 text-gray-700 mt-2`}
            onClick={() => { setActiveSection("settings"); setShowChangePassword(true); }}
          >
            <Key className="w-6 h-6" /> Change Password
          </button>
        </nav>
        <Button onClick={handleLogout} variant="outline" className="w-full flex items-center gap-2 mt-auto border-blue-200">
          <LogOut className="w-5 h-5" /> Logout
        </Button>
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start py-16 px-8">
        {/* Welcome message at the top */}
        <div className="w-full max-w-4xl mx-auto mb-8">
          <h1 className="text-3xl font-extrabold text-blue-700">Welcome, {teacher?.name?.split(" ")[0] || "Teacher"}!</h1>
        </div>
        {!activeSection && (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <h1 className="text-4xl font-extrabold text-blue-700 mb-4">Welcome, {teacher?.name?.split(" ")[0] || "Teacher"}!</h1>
            <p className="text-lg text-gray-600 mb-8">Select an option from the sidebar to get started.</p>
            <img src="/placeholder-user.jpg" alt="Welcome" className="w-40 h-40 opacity-30" />
          </div>
        )}
        {activeSection === "profile" && teacher && !editProfile && (
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95">
            <CardHeader className="flex flex-col items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-2xl pb-6">
              <Avatar className="w-32 h-32 mb-4 ring-4 ring-blue-300 shadow-xl relative group">
                <img
                  src={teacher.avatarUrl || "/placeholder-user.jpg"}
                  alt={teacher.name || "Teacher Avatar"}
                  className="rounded-full object-cover w-full h-full"
                />
                <label className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition" title="Change profile picture">
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h6m2 2a2 2 0 11-4 0 2 2 0 014 0zm-6 2a2 2 0 11-4 0 2 2 0 014 0zm2-10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </label>
                {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full"><span className="text-blue-600 font-bold">Uploading...</span></div>}
                {avatarError && <div className="absolute left-0 right-0 -bottom-8 text-xs text-red-600 text-center">{avatarError}</div>}
              </Avatar>
              <CardTitle className="text-3xl font-bold text-gray-900">{teacher.name}</CardTitle>
              <div className="text-blue-700 font-semibold mt-1">{teacher.email}</div>
            </CardHeader>
            <CardContent className="pt-8 pb-10 px-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
                <div>
                  <span className="font-semibold text-gray-700">Employee ID:</span> <span className="text-gray-600">{teacher.employeeId}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Phone:</span> <span className="text-gray-600">{teacher.phone}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Qualification:</span> <span className="text-gray-600">{teacher.qualification}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Date Joined:</span> <span className="text-gray-600">{teacher.dateJoined}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Status:</span> <span className="text-gray-600 capitalize">{teacher.status}</span>
                </div>
              </div>
              <div className="flex flex-col md:flex-row justify-end mt-8 gap-4">
                <Button onClick={handleEditProfile} variant="outline">Edit Profile</Button>
                <Button onClick={() => router.push(`/schools/${schoolCode}/teacher/dashboard`)} variant="default">Go to Teacher Dashboard</Button>
                <Button onClick={async () => {
                  if (!teacher?.id) return;
                  await fetch(`/api/schools/${schoolCode}/teachers/${teacher.id}/send-credentials`, { method: "POST" });
                  alert("Credentials sent (simulated)");
                }} variant="secondary">Simulate Send Credentials</Button>
              </div>
            </CardContent>
          </Card>
        )}
        {activeSection === "profile" && teacher && editProfile && (
          <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/95">
            <CardHeader className="flex flex-col items-center bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-2xl pb-6">
              <Avatar className="w-32 h-32 mb-4 ring-4 ring-blue-300 shadow-xl relative group">
                <img
                  src={editData.avatarUrl || "/placeholder-user.jpg"}
                  alt={editData.name || "Teacher Avatar"}
                  className="rounded-full object-cover w-full h-full"
                />
                <label className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-1 cursor-pointer shadow-md group-hover:scale-110 transition" title="Change profile picture">
                  <input type="file" accept="image/*" className="hidden" onChange={handleEditAvatar} disabled={avatarUploading} />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h6m2 2a2 2 0 11-4 0 2 2 0 014 0zm-6 2a2 2 0 11-4 0 2 2 0 014 0zm2-10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </label>
                {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full"><span className="text-blue-600 font-bold">Uploading...</span></div>}
                {avatarError && <div className="absolute left-0 right-0 -bottom-8 text-xs text-red-600 text-center">{avatarError}</div>}
              </Avatar>
              <CardTitle className="text-3xl font-bold text-gray-900">Edit Profile</CardTitle>
              <div className="text-blue-700 font-semibold mt-1">{teacher.email}</div>
            </CardHeader>
            <CardContent className="pt-8 pb-10 px-10">
              <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
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
                  <label className="font-semibold text-gray-700">Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    className="border rounded px-3 py-2"
                    value={editData.qualification}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="flex flex-col gap-2 col-span-2 mt-4 flex-row-reverse">
                  <Button type="submit" className="mr-2">Save</Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        {activeSection === "classes" && (
          <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/95">
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500">(Classes assigned to you will appear here.)</div>
            </CardContent>
          </Card>
        )}
        {activeSection === "students" && (
          <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/95">
            <CardHeader>
              <CardTitle>My Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500">(Students in your classes will appear here.)</div>
            </CardContent>
          </Card>
        )}
        {activeSection === "settings" && (
          <Card className="w-full max-w-2xl shadow-xl border-0 bg-white/95">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-gray-500 mb-6">(Settings and preferences will appear here.)</div>
              {showChangePassword && (
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
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
} 