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
  DollarSign,
  Menu,
} from "lucide-react"
import type { SchoolData, SchoolProfile, Teacher, Student, Subject, SchoolClass } from "@/lib/types"
import {
  updateSchoolClasses,
  getSchool,
} from "@/lib/school-storage"
import Link from "next/link"
import { generateTempPassword } from "@/lib/utils/school-generator"
import { FeeManagement } from "./fee-management"

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
    {
      id: "fees",
      title: "Fee Management",
      description: "Configure fee structures and payment settings",
      completed: false, // Will be updated based on fee structures
      icon: DollarSign,
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

  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>(schoolData.students || [])
  const [subjects, setSubjects] = useState<Subject[]>(schoolData.subjects || [])
  const [classes, setClasses] = useState<SchoolClass[]>(schoolData.classes || [])
  const [feeStructures, setFeeStructures] = useState<any[]>([])

  // Form states for new items
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({})
  const [newStudent, setNewStudent] = useState<Partial<Student>>({})
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({})
  const [newClass, setNewClass] = useState<Partial<SchoolClass>>({})

  // Add state for showing credentials
  const [showTeacherCredentials, setShowTeacherCredentials] = useState(false)
  const [lastTeacherCredentials, setLastTeacherCredentials] = useState<{ email: string; tempPassword: string } | null>(null)
  const [showStudentCredentials, setShowStudentCredentials] = useState(false)
  const [lastStudentCredentials, setLastStudentCredentials] = useState<{ admissionNumber: string; email: string; tempPassword: string } | null>(null)
  const [lastParentCredentials, setLastParentCredentials] = useState<any>(null)
  const [showParentCredentials, setShowParentCredentials] = useState(false)

  // Fetch teachers from API on component mount
  useEffect(() => {
    async function fetchTeachers() {
      try {
        const res = await fetch(`/api/schools/${schoolData.schoolCode}/teachers`);
        if (res.ok) {
          const data = await res.json();
          setTeachers(data);
        }
      } catch (error) {
        console.error("Failed to fetch teachers", error);
        toast({ title: "Error", description: "Could not load teacher data.", variant: "destructive" });
      }
    }
    fetchTeachers();
  }, [schoolData.schoolCode, toast]);

  // Fetch students from API on component mount
  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch(`/api/schools/${schoolData.schoolCode}/students`);
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
        }
      } catch (error) {
        console.error("Failed to fetch students", error);
        toast({ title: "Error", description: "Could not load student data.", variant: "destructive" });
      }
    }
    if (schoolData.schoolCode) {
        fetchStudents();
    }
  }, [schoolData.schoolCode, toast]);

  // Fetch subjects from API on component mount
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch(`/api/schools/${schoolData.schoolCode}/subjects`);
        if (res.ok) {
          const data = await res.json();
          setSubjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch subjects", error);
        toast({ title: "Error", description: "Could not load subject data.", variant: "destructive" });
      }
    }
    if (schoolData.schoolCode) {
        fetchSubjects();
    }
  }, [schoolData.schoolCode, toast]);

  // Fetch fee structures from API on component mount
  useEffect(() => {
    async function fetchFeeStructures() {
      try {
        const res = await fetch(`/api/schools/${schoolData.schoolCode}/fee-structure`);
        if (res.ok) {
          const data = await res.json();
          setFeeStructures(data);
          // Update fee management step completion status
          setSetupSteps(prev => prev.map(step => 
            step.id === "fees" ? { ...step, completed: data.length > 0 } : step
          ));
        }
      } catch (error) {
        console.error("Failed to fetch fee structures", error);
        // Don't show error toast for fee structures as it might not be set up yet
      }
    }
    if (schoolData.schoolCode) {
        fetchFeeStructures();
    }
  }, [schoolData.schoolCode]);

  // Refresh school data when localStorage changes
  useEffect(() => {
    async function fetchSchool() {
      const refreshedData = await getSchool(schoolData.schoolCode)
      if (refreshedData) {
        setSchoolData(refreshedData)
        setTeachers(refreshedData.teachers || [])
        setStudents(refreshedData.students || [])
        setSubjects(refreshedData.subjects || [])
        setClasses(refreshedData.classes || [])
      }
    }
    fetchSchool()
  }, [schoolData.schoolCode])

  const completedSteps = setupSteps.filter((step) => step.completed).length
  const progressPercentage = (completedSteps / setupSteps.length) * 100

  const handleStepComplete = (stepId: string) => {
    setSetupSteps((prev) => prev.map((step) => (step.id === stepId ? { ...step, completed: true } : step)))
  }

  const saveSchoolProfile = async () => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: schoolData.name,
          address: schoolProfile.address,
          phone: schoolProfile.phone,
          email: schoolProfile.email,
          adminEmail: schoolData.adminEmail,
          adminFirstName: schoolData.adminFirstName,
          adminLastName: schoolData.adminLastName,
          description: schoolProfile.description,
          colorTheme: schoolData.colorTheme,
          status: schoolData.status,
          profile: schoolProfile,
        }),
      })
      if (!res.ok) throw new Error("Failed to update school profile")
      handleStepComplete("profile")
      setProfileSaved(true)
      setIsEditingProfile(false)
      toast({
        title: "Success!",
        description: "School profile saved successfully!",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save school profile.",
        variant: "destructive",
      })
    }
  }

  // Teacher CRUD operations
  const createTeacher = async (teacherData: Partial<Teacher>) => {
    const tempPassword = generateTempPassword();
    const newTeacherData = { ...teacherData, tempPassword };

    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTeacherData),
      });

      if (res.ok) {
        const createdTeacher = await res.json();
        setTeachers([...teachers, createdTeacher]);
        setLastTeacherCredentials({ email: createdTeacher.email, tempPassword });
        setShowTeacherCredentials(true);
        setViewMode({ ...viewMode, staff: "list" });
        setNewTeacher({});
        handleStepComplete("staff");
        toast({ title: "Success", description: "Teacher created successfully" });
      } else {
        const errorData = await res.json();
        toast({ title: "Error", description: errorData.error || "Failed to create teacher", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating teacher:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const updateTeacher = async (updatedTeacher: Teacher) => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/teachers/${updatedTeacher.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTeacher),
      });

      if (res.ok) {
        const newTeachers = teachers.map((t) => (t.id === updatedTeacher.id ? updatedTeacher : t));
        setTeachers(newTeachers);
        setViewMode({ ...viewMode, staff: "list" });
        setEditingItem(null);
        toast({ title: "Success", description: "Teacher updated successfully" });
      } else {
        toast({ title: "Error", description: "Failed to update teacher", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/teachers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTeachers(teachers.filter((t) => t.id !== id));
        toast({ title: "Success", description: "Teacher deleted successfully" });
      } else {
        toast({ title: "Error", description: "Failed to delete teacher", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  // Student CRUD operations
  const createStudent = async (studentData: Partial<Student>) => {
    const tempPassword = generateTempPassword();
    const newStudentData = { ...studentData, tempPassword };

    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStudentData),
      });

      if (res.ok) {
        const createdStudent = await res.json();
        setStudents([...students, createdStudent]);
        setLastStudentCredentials({
          admissionNumber: createdStudent.admissionNumber,
          email: createdStudent.email,
          tempPassword,
        });
        setShowStudentCredentials(true);

        if (createdStudent.parent) {
          setLastParentCredentials({
            email: createdStudent.parent.email,
            tempPassword: createdStudent.parent.tempPassword,
          });
          setShowParentCredentials(true);
        }

        setViewMode({ ...viewMode, students: "list" });
        setNewStudent({});
        handleStepComplete("students");
        toast({ title: "Success", description: "Student created successfully" });
      } else {
        const errorData = await res.json();
        toast({ title: "Error", description: errorData.error || "Failed to create student", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating student:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/students/${updatedStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStudent),
      });

      if (res.ok) {
        const newStudents = students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s));
        setStudents(newStudents);
        setViewMode({ ...viewMode, students: "list" });
        setEditingItem(null);
        toast({ title: "Success", description: "Student updated successfully" });
      } else {
        toast({ title: "Error", description: "Failed to update student", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error updating student:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/students/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStudents(students.filter((s) => s.id !== id));
        toast({ title: "Success", description: "Student deleted successfully" });
      } else {
        toast({ title: "Error", description: "Failed to delete student", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  // Subject CRUD operations
  const createSubject = async () => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubject),
      });

      if (res.ok) {
        const createdSubject = await res.json();
        setSubjects([...subjects, createdSubject]);
        setViewMode({ ...viewMode, subjects: "list" });
        setNewSubject({});
        handleStepComplete("subjects");
        toast({ title: "Success", description: "Subject created successfully" });
      } else {
        const errorData = await res.json();
        toast({ title: "Error", description: errorData.error || "Failed to create subject", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating subject:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const updateSubject = async (updatedSubject: Subject) => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/subjects/${updatedSubject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedSubject),
      });

      if (res.ok) {
        const newSubjects = subjects.map((s) => (s.id === updatedSubject.id ? updatedSubject : s));
        setSubjects(newSubjects);
        setViewMode({ ...viewMode, subjects: "list" });
        setEditingItem(null);
        toast({ title: "Success", description: "Subject updated successfully" });
      } else {
        toast({ title: "Error", description: "Failed to update subject", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/subjects/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSubjects(subjects.filter((s) => s.id !== id));
        toast({ title: "Success", description: "Subject deleted successfully" });
      } else {
        toast({ title: "Error", description: "Failed to delete subject", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  // Class CRUD operations
  const createClass = async () => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClass),
      });

      if (res.ok) {
        const createdClass = await res.json();
        const updatedClasses = [...classes, createdClass];
        setClasses(updatedClasses);
        await updateSchoolClasses(schoolData.schoolCode, updatedClasses);
        setViewMode({ ...viewMode, classes: "list" });
        setNewClass({});
        handleStepComplete("subjects");
        toast({ title: "Success", description: "Class created successfully" });
      } else {
        const errorData = await res.json();
        toast({ title: "Error", description: errorData.error || "Failed to create class", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating class:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const updateClass = async (updatedClass: SchoolClass) => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/classes/${updatedClass.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedClass),
      });

      if (res.ok) {
        const newClasses = classes.map((c) => (c.id === updatedClass.id ? updatedClass : c));
        setClasses(newClasses);
        await updateSchoolClasses(schoolData.schoolCode, newClasses);
        setViewMode({ ...viewMode, classes: "list" });
        setEditingItem(null);
        toast({ title: "Success", description: "Class updated successfully" });
      } else {
        toast({ title: "Error", description: "Failed to update class", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error updating class:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/classes/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        const updatedClasses = classes.filter((c) => c.id !== id);
        setClasses(updatedClasses);
        await updateSchoolClasses(schoolData.schoolCode, updatedClasses);
        toast({ title: "Success", description: "Class deleted successfully" });
      } else {
        toast({ title: "Error", description: "Failed to delete class", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting class:", error);
      toast({ title: "Error", description: "An unexpected error occurred", variant: "destructive" });
    }
  };

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

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      
      // Additional validation for required fields
      if (!formData.name || !formData.email || !formData.className || !formData.parentName || !formData.parentPhone) {
        toast({ 
          title: "Validation Error", 
          description: "Please fill in all required fields: Student Name, Email, Class, Parent Name, and Parent Phone.", 
          variant: "destructive" 
        });
        return;
      }
      
      if (student) {
        onSave(formData as Student)
      } else {
        // Directly create student without setting state first
        const success = await createStudent(formData)
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
                <Label>Class/Grade *</Label>
                <Select
                  value={formData.className || ""}
                  onValueChange={(value) => setFormData({ ...formData, className: value })}
                  required
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
                <Label>Student Email *</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@email.com"
                  required
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
    <div className="flex min-h-screen bg-gray-50/50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: schoolData.colorTheme + "20" }}>
              <School className="w-5 h-5" style={{ color: schoolData.colorTheme }} />
            </div>
            <h2 className="text-lg font-bold truncate">{schoolData.name}</h2>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        <nav className="p-4 space-y-2">
          {Object.keys(setupSteps).map(key => {
            const step = setupSteps[key as any];
            return (
              <Button
                key={step.id}
                variant={activeTab === step.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => {
                  setActiveTab(step.id);
                  setIsSidebarOpen(false);
                }}
              >
                <step.icon className={`w-5 h-5 mr-3 ${activeTab === step.id ? 'text-primary' : ''}`} />
                {step.title}
              </Button>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 w-full p-4 border-t">
          <Button variant="outline" className="w-full" onClick={onLogout}>
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold">{setupSteps.find(s => s.id === activeTab)?.title || 'Dashboard'}</h1>
              </div>
              <div className="flex items-center space-x-4">
                {/* Any header actions can go here */}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {/* ... (Rest of the component's JSX for each tab) */}
          {/* This part will be structured with responsive grids and flexbox */}
        </main>
      </div>
    </div>
  );
}