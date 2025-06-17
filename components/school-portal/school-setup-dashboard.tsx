"use client"

import { DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  School,
  Users,
  GraduationCap,
  BookOpen,
  LogOut,
  Plus,
  CheckCircle,
  Trash2,
  Edit,
  Eye,
  ArrowLeft,
} from "lucide-react"
import type { SchoolData, SchoolProfile, Teacher, Student, Subject, SchoolClass } from "@/lib/school-storage"
import {
  updateSchoolProfile,
  updateSchoolTeachers,
  updateSchoolStudents,
  updateSchoolSubjects,
  updateSchoolClasses,
  getSchool,
} from "@/lib/school-storage"

interface SchoolSetupDashboardProps {
  schoolData: SchoolData
  onLogout: () => void
}

interface SetupStep {
  id: string
  title: string
  description: string
  completed: boolean
  icon: React.ElementType
}

type ViewMode = "list" | "form" | "view"

export function SchoolSetupDashboard({ schoolData: initialSchoolData, onLogout }: SchoolSetupDashboardProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [schoolData, setSchoolData] = useState(initialSchoolData)
  const [viewMode, setViewMode] = useState<Record<string, ViewMode>>({
    staff: "list",
    students: "list",
    subjects: "list",
  })
  const [editingItem, setEditingItem] = useState<any>(null)
  const [viewingItem, setViewingItem] = useState<any>(null)
  const [profileSaved, setProfileSaved] = useState(!!initialSchoolData.profile?.address)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([
    {
      id: "profile",
      title: "School Profile",
      description: "Complete your school information and settings",
      completed: !!schoolData.profile,
      icon: School,
    },
    {
      id: "staff",
      title: "Add Staff & Teachers",
      description: "Add teachers and administrative staff",
      completed: (schoolData.teachers?.length || 0) > 0,
      icon: Users,
    },
    {
      id: "students",
      title: "Add Students",
      description: "Import or manually add student records",
      completed: (schoolData.students?.length || 0) > 0,
      icon: GraduationCap,
    },
    {
      id: "subjects",
      title: "Setup Subjects & Classes",
      description: "Configure subjects, classes, and timetables",
      completed: (schoolData.subjects?.length || 0) > 0 && (schoolData.classes?.length || 0) > 0,
      icon: BookOpen,
    },
  ])

  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(
    schoolData.profile || {
      address: "",
      phone: "",
      website: "",
      principalName: "",
      establishedYear: "",
      description: "",
      email: "",
      motto: "",
      type: "primary",
    },
  )

  const [teachers, setTeachers] = useState<Teacher[]>(schoolData.teachers || [])
  const [students, setStudents] = useState<Student[]>(schoolData.students || [])
  const [subjects, setSubjects] = useState<Subject[]>(schoolData.subjects || [])
  const [classes, setClasses] = useState<SchoolClass[]>(schoolData.classes || [])

  // Form states for new items
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({})
  const [newStudent, setNewStudent] = useState<Partial<Student>>({})
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({})
  const [newClass, setNewClass] = useState<Partial<SchoolClass>>({})

  // Refresh school data when localStorage changes
  useEffect(() => {
    const refreshedData = getSchool(schoolData.schoolCode)
    if (refreshedData) {
      setSchoolData(refreshedData)
      setTeachers(refreshedData.teachers || [])
      setStudents(refreshedData.students || [])
      setSubjects(refreshedData.subjects || [])
      setClasses(refreshedData.classes || [])
    }
  }, [schoolData.schoolCode])

  const completedSteps = setupSteps.filter((step) => step.completed).length
  const progressPercentage = (completedSteps / setupSteps.length) * 100

  const handleStepComplete = (stepId: string) => {
    setSetupSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step)))
  }

  const saveSchoolProfile = () => {
    updateSchoolProfile(schoolData.schoolCode, schoolProfile)
    handleStepComplete("profile")
    setProfileSaved(true)
    setIsEditingProfile(false)
    toast({
      title: "Success!",
      description: "School profile saved successfully!",
    })
  }

  // Teacher CRUD operations
  const createTeacher = (teacherData: Partial<Teacher>) => {
    if (!teacherData.name || !teacherData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields (Name and Email)",
        variant: "destructive",
      })
      return false
    }

    const teacher: Teacher = {
      id: crypto.randomUUID(),
      name: teacherData.name || "",
      email: teacherData.email || "",
      phone: teacherData.phone || "",
      subjects: [],
      classes: [],
      employeeId: `EMP${Date.now()}`,
      qualification: teacherData.qualification || "",
      dateJoined: teacherData.dateJoined || new Date().toISOString().split("T")[0],
      status: "active",
    }

    const updatedTeachers = [...teachers, teacher]
    setTeachers(updatedTeachers)
    updateSchoolTeachers(schoolData.schoolCode, updatedTeachers)
    setNewTeacher({})
    setViewMode((prev) => ({ ...prev, staff: "list" }))
    handleStepComplete("staff")
    toast({
      title: "Success!",
      description: "Teacher added successfully!",
    })
    return true
  }

  const updateTeacher = (updatedTeacher: Teacher) => {
    const updatedTeachers = teachers.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t))
    setTeachers(updatedTeachers)
    updateSchoolTeachers(schoolData.schoolCode, updatedTeachers)
    setEditingItem(null)
    setViewMode((prev) => ({ ...prev, staff: "list" }))
    toast({
      title: "Success!",
      description: "Teacher updated successfully!",
    })
  }

  const deleteTeacher = (id: string) => {
    const updatedTeachers = teachers.filter((t) => t.id !== id)
    setTeachers(updatedTeachers)
    updateSchoolTeachers(schoolData.schoolCode, updatedTeachers)
    toast({
      title: "Success!",
      description: "Teacher deleted successfully!",
    })
  }

  // Student CRUD operations
  const createStudent = (studentData: Partial<Student>) => {
    if (!studentData.name || !studentData.parentName || !studentData.parentPhone) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields (Student Name, Parent Name, and Parent Phone)",
        variant: "destructive",
      })
      return false
    }

    const student: Student = {
      id: crypto.randomUUID(),
      name: studentData.name || "",
      email: studentData.email || "",
      phone: studentData.phone || "",
      parentName: studentData.parentName || "",
      parentPhone: studentData.parentPhone || "",
      parentEmail: studentData.parentEmail || "",
      admissionNumber: studentData.admissionNumber || `ADM${Date.now()}`,
      class: studentData.class || "",
      dateOfBirth: studentData.dateOfBirth || "",
      gender: studentData.gender || "male",
      address: studentData.address || "",
      dateAdmitted: studentData.dateAdmitted || new Date().toISOString().split("T")[0],
      status: "active",
    }

    const updatedStudents = [...students, student]
    setStudents(updatedStudents)
    updateSchoolStudents(schoolData.schoolCode, updatedStudents)
    setNewStudent({})
    setViewMode((prev) => ({ ...prev, students: "list" }))
    handleStepComplete("students")
    toast({
      title: "Success!",
      description: "Student added successfully!",
    })
    return true
  }

  const updateStudent = (updatedStudent: Student) => {
    const updatedStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s))
    setStudents(updatedStudents)
    updateSchoolStudents(schoolData.schoolCode, updatedStudents)
    setEditingItem(null)
    setViewMode((prev) => ({ ...prev, students: "list" }))
    toast({
      title: "Success!",
      description: "Student updated successfully!",
    })
  }

  const deleteStudent = (id: string) => {
    const updatedStudents = students.filter((s) => s.id !== id)
    setStudents(updatedStudents)
    updateSchoolStudents(schoolData.schoolCode, updatedStudents)
    toast({
      title: "Success!",
      description: "Student deleted successfully!",
    })
  }

  // Subject CRUD operations
  const createSubject = () => {
    if (!newSubject.name || !newSubject.code) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields (Subject Name and Code)",
        variant: "destructive",
      })
      return
    }

    const subject: Subject = {
      id: crypto.randomUUID(),
      name: newSubject.name || "",
      code: newSubject.code || "",
      description: newSubject.description || "",
      teacherId: newSubject.teacherId || "",
      classes: [],
    }

    const updatedSubjects = [...subjects, subject]
    setSubjects(updatedSubjects)
    updateSchoolSubjects(schoolData.schoolCode, updatedSubjects)
    setNewSubject({})
    toast({
      title: "Success!",
      description: "Subject added successfully!",
    })
  }

  const updateSubject = (updatedSubject: Subject) => {
    const updatedSubjects = subjects.map((s) => (s.id === updatedSubject.id ? updatedSubject : s))
    setSubjects(updatedSubjects)
    updateSchoolSubjects(schoolData.schoolCode, updatedSubjects)
    setEditingItem(null)
    toast({
      title: "Success!",
      description: "Subject updated successfully!",
    })
  }

  const deleteSubject = (id: string) => {
    const updatedSubjects = subjects.filter((s) => s.id !== id)
    setSubjects(updatedSubjects)
    updateSchoolSubjects(schoolData.schoolCode, updatedSubjects)
    toast({
      title: "Success!",
      description: "Subject deleted successfully!",
    })
  }

  // Class CRUD operations
  const createClass = () => {
    if (!newClass.name || !newClass.level) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields (Class Name and Level)",
        variant: "destructive",
      })
      return
    }

    const schoolClass: SchoolClass = {
      id: crypto.randomUUID(),
      name: newClass.name || "",
      level: newClass.level || "",
      capacity: newClass.capacity || 30,
      currentStudents: 0,
      classTeacherId: newClass.classTeacherId || "",
      subjects: [],
    }

    const updatedClasses = [...classes, schoolClass]
    setClasses(updatedClasses)
    updateSchoolClasses(schoolData.schoolCode, updatedClasses)
    setNewClass({})
    handleStepComplete("subjects")
    toast({
      title: "Success!",
      description: "Class added successfully!",
    })
  }

  const updateClass = (updatedClass: SchoolClass) => {
    const updatedClasses = classes.map((c) => (c.id === updatedClass.id ? updatedClass : c))
    setClasses(updatedClasses)
    updateSchoolClasses(schoolData.schoolCode, updatedClasses)
    setEditingItem(null)
    toast({
      title: "Success!",
      description: "Class updated successfully!",
    })
  }

  const deleteClass = (id: string) => {
    const updatedClasses = classes.filter((c) => c.id !== id)
    setClasses(updatedClasses)
    updateSchoolClasses(schoolData.schoolCode, updatedClasses)
    toast({
      title: "Success!",
      description: "Class deleted successfully!",
    })
  }

  // Teacher Form Component
  const TeacherForm = ({
    teacher,
    onSave,
    onCancel,
  }: { teacher?: Teacher; onSave: (teacher: Teacher) => void; onCancel: () => void }) => {
    const [formData, setFormData] = useState<Partial<Teacher>>(teacher || newTeacher)

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (teacher) {
        onSave(formData as Teacher)
      } else {
        // Directly create teacher without setting state first
        const success = createTeacher(formData)
        if (success) {
          // Reset form data after successful creation
          setFormData({})
        }
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {teacher ? "Edit Teacher" : "Add New Teacher"}
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Teacher Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="teacher@school.edu"
                  required
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+254 700 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input
                  value={formData.qualification || ""}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g., Bachelor of Education"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date Joined</Label>
              <Input
                type="date"
                value={formData.dateJoined || ""}
                onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: schoolData.colorTheme }}>
                {teacher ? "Update Teacher" : "Add Teacher"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Student Form Component
  const StudentForm = ({
    student,
    onSave,
    onCancel,
  }: { student?: Student; onSave: (student: Student) => void; onCancel: () => void }) => {
    const [formData, setFormData] = useState<Partial<Student>>(student || newStudent)

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (student) {
        onSave(formData as Student)
      } else {
        // Directly create student without setting state first
        const success = createStudent(formData)
        if (success) {
          // Reset form data after successful creation
          setFormData({})
        }
      }
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {student ? "Edit Student" : "Add New Student"}
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Student Name *</Label>
                <Input
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Student Full Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Admission Number</Label>
                <Input
                  value={formData.admissionNumber || ""}
                  onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                  placeholder="ADM001"
                />
              </div>
              <div className="space-y-2">
                <Label>Class/Grade</Label>
                <Select
                  value={formData.class || ""}
                  onValueChange={(value) => setFormData({ ...formData, class: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.name}>
                        {cls.name}
                      </SelectItem>
                    ))}
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
            <div className="grid md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value: any) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Student Email</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Student Phone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Parent/Guardian Name *</Label>
                <Input
                  value={formData.parentName || ""}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Parent Full Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Phone *</Label>
                <Input
                  value={formData.parentPhone || ""}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="+254 700 000 000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Email</Label>
                <Input
                  type="email"
                  value={formData.parentEmail || ""}
                  onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                  placeholder="parent@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Home Address</Label>
              <Textarea
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Student's home address"
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" style={{ backgroundColor: schoolData.colorTheme }}>
                {student ? "Update Student" : "Add Student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="bg-white shadow-sm border-b"
        style={{ borderTopColor: schoolData.colorTheme, borderTopWidth: "4px" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {schoolData.logoUrl ? (
                <img
                  src={schoolData.logoUrl || "/placeholder.svg"}
                  alt={`${schoolData.name} logo`}
                  className="w-12 h-12 object-cover rounded-lg border-2"
                  style={{ borderColor: schoolData.colorTheme }}
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center border-2"
                  style={{
                    backgroundColor: schoolData.colorTheme + "20",
                    borderColor: schoolData.colorTheme,
                  }}
                >
                  <School className="w-6 h-6" style={{ color: schoolData.colorTheme }} />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{schoolData.name}</h1>
                <p className="text-sm text-gray-600">
                  Welcome, {schoolData.adminFirstName} {schoolData.adminLastName}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={schoolData.status === "setup" ? "secondary" : "default"}>
                {schoolData.status === "setup" ? "Setup in Progress" : "Active"}
              </Badge>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">School Profile</TabsTrigger>
            <TabsTrigger value="staff">Staff & Teachers</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="subjects">Subjects & Classes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Setup Progress</span>
                </CardTitle>
                <CardDescription>Complete these steps to fully activate your school management system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Progress</span>
                    <span className="text-sm text-gray-600">
                      {completedSteps}/{setupSteps.length} completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${progressPercentage}%`,
                        backgroundColor: schoolData.colorTheme,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Setup Steps */}
            <div className="grid md:grid-cols-2 gap-6">
              {setupSteps.map((step) => (
                <Card key={step.id} className={step.completed ? "border-green-200 bg-green-50" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            step.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {step.completed ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                        </div>
                        <span className={step.completed ? "text-green-700" : ""}>{step.title}</span>
                      </div>
                      {step.completed ? (
                        <Badge className="bg-green-100 text-green-800">Completed</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className={step.completed ? "text-green-600" : ""}>
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => setActiveTab(step.id === "profile" ? "profile" : step.id)}
                      className="w-full"
                      variant={step.completed ? "outline" : "default"}
                      style={!step.completed ? { backgroundColor: schoolData.colorTheme } : {}}
                    >
                      {step.completed ? "Review" : "Start Setup"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{teachers.length}</p>
                      <p className="text-sm text-gray-600">Teachers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <GraduationCap className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{students.length}</p>
                      <p className="text-sm text-gray-600">Students</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{subjects.length}</p>
                      <p className="text-sm text-gray-600">Subjects</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <School className="w-8 h-8 text-orange-500" />
                    <div>
                      <p className="text-2xl font-bold">{classes.length}</p>
                      <p className="text-sm text-gray-600">Classes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* School Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {profileSaved && !isEditingProfile ? (
              // Read-only view after profile is saved
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    School Profile Information
                    <Button
                      onClick={() => setIsEditingProfile(true)}
                      variant="outline"
                      style={{ borderColor: schoolData.colorTheme, color: schoolData.colorTheme }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardTitle>
                  <CardDescription>Your school's information and contact details</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Contact Information</h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">School Address</Label>
                            <p className="text-gray-900 mt-1">{schoolProfile.address || "Not provided"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Phone Number</Label>
                            <p className="text-gray-900 mt-1">{schoolProfile.phone || "Not provided"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                            <p className="text-gray-900 mt-1">{schoolProfile.email || "Not provided"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Website</Label>
                            <p className="text-gray-900 mt-1">
                              {schoolProfile.website ? (
                                <a href={schoolProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {schoolProfile.website}
                                </a>
                              ) : (
                                "Not provided"
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">School Details</h4>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Principal/Head Teacher</Label>
                            <p className="text-gray-900 mt-1">{schoolProfile.principalName || "Not provided"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">Year Established</Label>
                            <p className="text-gray-900 mt-1">{schoolProfile.establishedYear || "Not provided"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">School Type</Label>
                            <p className="text-gray-900 mt-1 capitalize">{schoolProfile.type || "Not provided"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">School Motto</Label>
                            <p className="text-gray-900 mt-1 italic">"{schoolProfile.motto || "Not provided"}"</p>
                          </div>
                        </div>
                      </div>
                      {schoolProfile.description && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                          <p className="text-gray-700 text-sm leading-relaxed">{schoolProfile.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <Badge variant="default" className="text-sm">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Profile Complete
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ) : (
              // Edit form view
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {profileSaved ? "Edit School Profile" : "School Profile Information"}
                    {profileSaved && (
                      <Button
                        onClick={() => setIsEditingProfile(false)}
                        variant="outline"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cancel Edit
                      </Button>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {profileSaved ? "Update your school's information and contact details" : "Complete your school's basic information and contact details"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">School Address *</Label>
                      <Textarea
                        id="address"
                        value={schoolProfile.address}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, address: e.target.value })}
                        placeholder="Enter school address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={schoolProfile.phone}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, phone: e.target.value })}
                        placeholder="+254 700 000 000"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">School Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={schoolProfile.email}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, email: e.target.value })}
                        placeholder="info@school.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website (Optional)</Label>
                      <Input
                        id="website"
                        value={schoolProfile.website}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, website: e.target.value })}
                        placeholder="https://www.school.edu"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="principal">Principal/Head Teacher *</Label>
                      <Input
                        id="principal"
                        value={schoolProfile.principalName}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, principalName: e.target.value })}
                        placeholder="Enter principal's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="established">Year Established *</Label>
                      <Input
                        id="established"
                        value={schoolProfile.establishedYear}
                        onChange={(e) => setSchoolProfile({ ...schoolProfile, establishedYear: e.target.value })}
                        placeholder="2000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">School Type *</Label>
                      <Select
                        value={schoolProfile.type}
                        onValueChange={(value: any) => setSchoolProfile({ ...schoolProfile, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary School</SelectItem>
                          <SelectItem value="secondary">Secondary School</SelectItem>
                          <SelectItem value="mixed">Mixed (Primary & Secondary)</SelectItem>
                          <SelectItem value="college">College</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="motto">School Motto (Optional)</Label>
                    <Input
                      id="motto"
                      value={schoolProfile.motto}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, motto: e.target.value })}
                      placeholder="Enter school motto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">School Description</Label>
                    <Textarea
                      id="description"
                      value={schoolProfile.description}
                      onChange={(e) => setSchoolProfile({ ...schoolProfile, description: e.target.value })}
                      placeholder="Brief description of the school..."
                      rows={4}
                    />
                  </div>
                  <Button onClick={saveSchoolProfile} style={{ backgroundColor: schoolData.colorTheme }}>
                    {profileSaved ? "Update School Profile" : "Save School Profile"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Staff & Teachers Tab */}
          <TabsContent value="staff" className="space-y-6">
            {viewMode.staff === "form" ? (
              <TeacherForm
                onSave={updateTeacher}
                onCancel={() => setViewMode((prev) => ({ ...prev, staff: "list" }))}
              />
            ) : editingItem ? (
              <TeacherForm
                teacher={editingItem}
                onSave={updateTeacher}
                onCancel={() => {
                  setEditingItem(null)
                  setViewMode((prev) => ({ ...prev, staff: "list" }))
                }}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Teachers ({teachers.length})
                    <Button
                      onClick={() => setViewMode((prev) => ({ ...prev, staff: "form" }))}
                      style={{ backgroundColor: schoolData.colorTheme }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Teacher
                    </Button>
                  </CardTitle>
                  <CardDescription>Manage your school's teaching staff</CardDescription>
                </CardHeader>
                <CardContent>
                  {teachers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No teachers added yet. Click "Add Teacher" to get started.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Qualification</TableHead>
                            <TableHead>Date Joined</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teachers.map((teacher) => (
                            <TableRow key={teacher.id}>
                              <TableCell className="font-medium">{teacher.name}</TableCell>
                              <TableCell>{teacher.email}</TableCell>
                              <TableCell>{teacher.phone}</TableCell>
                              <TableCell>{teacher.qualification}</TableCell>
                              <TableCell>{teacher.dateJoined}</TableCell>
                              <TableCell>
                                <Badge variant={teacher.status === "active" ? "default" : "secondary"}>
                                  {teacher.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => setViewingItem(teacher)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setEditingItem(teacher)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete {teacher.name}? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteTeacher(teacher.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
            )}

            {/* Teacher View Dialog */}
            <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Teacher Details</DialogTitle>
                  <DialogDescription>Complete information for {viewingItem?.name}</DialogDescription>
                </DialogHeader>
                {viewingItem && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                        <p className="text-sm">{viewingItem.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Employee ID</Label>
                        <p className="text-sm">{viewingItem.employeeId}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <p className="text-sm">{viewingItem.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Phone</Label>
                        <p className="text-sm">{viewingItem.phone}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Qualification</Label>
                        <p className="text-sm">{viewingItem.qualification}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date Joined</Label>
                        <p className="text-sm">{viewingItem.dateJoined}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge variant={viewingItem.status === "active" ? "default" : "secondary"}>
                        {viewingItem.status}
                      </Badge>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-6">
            {viewMode.students === "form" ? (
              <StudentForm
                onSave={updateStudent}
                onCancel={() => setViewMode((prev) => ({ ...prev, students: "list" }))}
              />
            ) : editingItem ? (
              <StudentForm
                student={editingItem}
                onSave={updateStudent}
                onCancel={() => {
                  setEditingItem(null)
                  setViewMode((prev) => ({ ...prev, students: "list" }))
                }}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Students ({students.length})
                    <Button
                      onClick={() => setViewMode((prev) => ({ ...prev, students: "form" }))}
                      style={{ backgroundColor: schoolData.colorTheme }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Student
                    </Button>
                  </CardTitle>
                  <CardDescription>Manage your school's student records</CardDescription>
                </CardHeader>
                <CardContent>
                  {students.length === 0 ? (
                    <div className="text-center py-8">
                      <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No students added yet. Click "Add Student" to get started.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Admission No.</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Parent Name</TableHead>
                            <TableHead>Parent Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.admissionNumber}</TableCell>
                              <TableCell>{student.class}</TableCell>
                              <TableCell>{student.parentName}</TableCell>
                              <TableCell>{student.parentPhone}</TableCell>
                              <TableCell>
                                <Badge variant={student.status === "active" ? "default" : "secondary"}>
                                  {student.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => setViewingItem(student)}>
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setEditingItem(student)}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete {student.name}? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => deleteStudent(student.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
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
            )}

            {/* Student View Dialog */}
            <Dialog open={!!viewingItem && activeTab === "students"} onOpenChange={() => setViewingItem(null)}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Student Details</DialogTitle>
                  <DialogDescription>Complete information for {viewingItem?.name}</DialogDescription>
                </DialogHeader>
                {viewingItem && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Full Name</Label>
                        <p className="text-sm">{viewingItem.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Admission Number</Label>
                        <p className="text-sm">{viewingItem.admissionNumber}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Class</Label>
                        <p className="text-sm">{viewingItem.class}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date of Birth</Label>
                        <p className="text-sm">{viewingItem.dateOfBirth}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Gender</Label>
                        <p className="text-sm">{viewingItem.gender}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date Admitted</Label>
                        <p className="text-sm">{viewingItem.dateAdmitted}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Student Email</Label>
                        <p className="text-sm">{viewingItem.email || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Student Phone</Label>
                        <p className="text-sm">{viewingItem.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Parent Name</Label>
                        <p className="text-sm">{viewingItem.parentName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Parent Phone</Label>
                        <p className="text-sm">{viewingItem.parentPhone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Parent Email</Label>
                        <p className="text-sm">{viewingItem.parentEmail || "Not provided"}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Home Address</Label>
                      <p className="text-sm">{viewingItem.address || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge variant={viewingItem.status === "active" ? "default" : "secondary"}>
                        {viewingItem.status}
                      </Badge>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Subjects & Classes Tab */}
          <TabsContent value="subjects" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Subjects Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Subjects ({subjects.length})
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" style={{ backgroundColor: schoolData.colorTheme }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Subject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Subject</DialogTitle>
                          <DialogDescription>Create a new subject for your school</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Subject Name *</Label>
                            <Input
                              value={newSubject.name || ""}
                              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                              placeholder="e.g., Mathematics"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Subject Code *</Label>
                            <Input
                              value={newSubject.code || ""}
                              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                              placeholder="e.g., MATH101"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Assigned Teacher</Label>
                            <Select
                              value={newSubject.teacherId || ""}
                              onValueChange={(value) => setNewSubject({ ...newSubject, teacherId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              value={newSubject.description || ""}
                              onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                              placeholder="Brief description of the subject"
                              rows={2}
                            />
                          </div>
                          <Button
                            onClick={createSubject}
                            className="w-full"
                            style={{ backgroundColor: schoolData.colorTheme }}
                          >
                            Add Subject
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                  <CardDescription>Configure subjects taught in your school</CardDescription>
                </CardHeader>
                <CardContent>
                  {subjects.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No subjects added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subjects.map((subject) => (
                        <div key={subject.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h5 className="font-medium">{subject.name}</h5>
                            <p className="text-sm text-gray-600">{subject.code}</p>
                            {subject.teacherId && (
                              <p className="text-xs text-gray-500">
                                Teacher: {teachers.find((t) => t.id === subject.teacherId)?.name}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditingItem(subject)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Subject</DialogTitle>
                                  <DialogDescription>Update subject information</DialogDescription>
                                </DialogHeader>
                                {editingItem && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Subject Name *</Label>
                                      <Input
                                        value={editingItem.name || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                        placeholder="e.g., Mathematics"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Subject Code *</Label>
                                      <Input
                                        value={editingItem.code || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                                        placeholder="e.g., MATH101"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Assigned Teacher</Label>
                                      <Select
                                        value={editingItem.teacherId || ""}
                                        onChange={(value) => setEditingItem({ ...editingItem, teacherId: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {teachers.map((teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                              {teacher.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Description</Label>
                                      <Textarea
                                        value={editingItem.description || ""}
                                        onChange={(e) =>
                                          setEditingItem({ ...editingItem, description: e.target.value })
                                        }
                                        placeholder="Brief description of the subject"
                                        rows={2}
                                      />
                                    </div>
                                    <Button
                                      onClick={() => updateSubject(editingItem)}
                                      className="w-full"
                                      style={{ backgroundColor: schoolData.colorTheme }}
                                    >
                                      Update Subject
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {subject.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteSubject(subject.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Classes Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Classes ({classes.length})
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" style={{ backgroundColor: schoolData.colorTheme }}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Class
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Class</DialogTitle>
                          <DialogDescription>Create a new class for your school</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Class Name *</Label>
                            <Input
                              value={newClass.name || ""}
                              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                              placeholder="e.g., Grade 5A"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Level *</Label>
                            <Select
                              value={newClass.level || ""}
                              onValueChange={(value) => setNewClass({ ...newClass, level: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Primary">Primary</SelectItem>
                                <SelectItem value="Secondary">Secondary</SelectItem>
                                <SelectItem value="College">College</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Capacity</Label>
                            <Input
                              type="number"
                              value={newClass.capacity || ""}
                              onChange={(e) =>
                                setNewClass({ ...newClass, capacity: Number.parseInt(e.target.value) || 0 })
                              }
                              placeholder="30"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Class Teacher</Label>
                            <Select
                              value={newClass.classTeacherId || ""}
                              onValueChange={(value) => setNewClass({ ...newClass, classTeacherId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select class teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            onClick={createClass}
                            className="w-full"
                            style={{ backgroundColor: schoolData.colorTheme }}
                          >
                            Add Class
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardTitle>
                  <CardDescription>Set up classes and their structure</CardDescription>
                </CardHeader>
                <CardContent>
                  {classes.length === 0 ? (
                    <div className="text-center py-8">
                      <School className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No classes added yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {classes.map((cls) => (
                        <div key={cls.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h5 className="font-medium">{cls.name}</h5>
                            <p className="text-sm text-gray-600">
                              {cls.level} - Capacity: {cls.capacity}
                            </p>
                            {cls.classTeacherId && (
                              <p className="text-xs text-gray-500">
                                Teacher: {teachers.find((t) => t.id === cls.classTeacherId)?.name}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditingItem(cls)}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Class</DialogTitle>
                                  <DialogDescription>Update class information</DialogDescription>
                                </DialogHeader>
                                {editingItem && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Class Name *</Label>
                                      <Input
                                        value={editingItem.name || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                        placeholder="e.g., Grade 5A"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Level *</Label>
                                      <Select
                                        value={editingItem.level || ""}
                                        onChange={(e) => setEditingItem({ ...editingItem, level: e.target.value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Primary">Primary</SelectItem>
                                          <SelectItem value="Secondary">Secondary</SelectItem>
                                          <SelectItem value="College">College</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Capacity</Label>
                                      <Input
                                        type="number"
                                        value={editingItem.capacity || ""}
                                        onChange={(e) =>
                                          setEditingItem({
                                            ...editingItem,
                                            capacity: Number.parseInt(e.target.value) || 0,
                                          })
                                        }
                                        placeholder="30"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Class Teacher</Label>
                                      <Select
                                        value={editingItem.classTeacherId || ""}
                                        onChange={(e) =>
                                          setEditingItem({ ...editingItem, classTeacherId: e.target.value })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select class teacher" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {teachers.map((teacher) => (
                                            <SelectItem key={teacher.id} value={teacher.id}>
                                              {teacher.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      onClick={() => updateClass(editingItem)}
                                      className="w-full"
                                      style={{ backgroundColor: schoolData.colorTheme }}
                                    >
                                      Update Class
                                    </Button>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Class</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {cls.name}? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteClass(cls.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
