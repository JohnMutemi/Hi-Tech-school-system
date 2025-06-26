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
    if (!teacherData.name || !teacherData.email) {
      toast({ title: "Validation Error", description: "Name and Email are required.", variant: "destructive" });
      return false;
    }

    const tempPassword = generateTempPassword();
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...teacherData, tempPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create teacher');
      }

      const newTeacher = await response.json();
      setTeachers([...teachers, newTeacher]);
      
      setNewTeacher({});
      setViewMode((prev) => ({ ...prev, staff: "list" }));
      handleStepComplete("staff");
      setLastTeacherCredentials({ email: newTeacher.email, tempPassword });
      setShowTeacherCredentials(true);
      toast({ title: "Success!", description: "Teacher added successfully!" });
      return true;
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create teacher.", variant: "destructive" });
      return false;
    }
  };

  const updateTeacher = async (updatedTeacher: Teacher) => {
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/teachers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedTeacher),
      });

      if (!response.ok) {
        throw new Error('Failed to update teacher');
      }

      const returnedTeacher = await response.json();
      setTeachers(teachers.map((t) => (t.id === returnedTeacher.id ? returnedTeacher : t)));
      
      setEditingItem(null);
      setViewMode((prev) => ({ ...prev, staff: "list" }));
      toast({ title: "Success!", description: "Teacher updated successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update teacher.", variant: "destructive" });
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/teachers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete teacher');
      }

      setTeachers(teachers.filter((t) => t.id !== id));
      toast({ title: "Success!", description: "Teacher deleted successfully!" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete teacher.", variant: "destructive" });
    }
  };

  // Student CRUD operations
  const createStudent = async (studentData: Partial<Student>) => {
    if (!studentData.name || !studentData.parentName || !studentData.parentPhone || !studentData.email || !studentData.className) {
      toast({ title: "Validation Error", description: "Student Name, Email, Class, Parent Name, and Parent Phone are required.", variant: "destructive" });
      return false;
    }

    const tempPassword = generateTempPassword();
    const admissionNumber = studentData.admissionNumber || `ADM${Date.now()}`;
    
    console.log('Creating student with data:', { ...studentData, tempPassword, admissionNumber });
    
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...studentData, tempPassword, admissionNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create student');
      }

      const newStudent = await response.json();
      console.log('API response for new student:', newStudent);
      
      setStudents([...students, newStudent]);
      console.log('Updated students state:', [...students, newStudent]);
      
      setNewStudent({});
      setViewMode((prev) => ({ ...prev, students: "list" }));
      handleStepComplete("students");
      
      // Set student credentials
      setLastStudentCredentials({ admissionNumber, email: newStudent.email, tempPassword: newStudent.tempPassword });
      setShowStudentCredentials(true);
      
      // Set parent credentials if parent was created
      if (newStudent.parent && newStudent.parent.tempPassword) {
        setLastParentCredentials({
          admissionNumber: newStudent.admissionNumber,
          parentPhone: newStudent.parentPhone,
          parentEmail: newStudent.parentEmail,
          tempPassword: newStudent.parent.tempPassword,
        });
        setShowParentCredentials(true);
      }
      
      toast({ title: "Success!", description: "Student added successfully!" });
      return true;
    } catch (error: any) {
      console.error('Error creating student:', error);
      toast({ title: "Error", description: error.message || "Failed to create student.", variant: "destructive" });
      return false;
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/students`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update student');
      }

      const returnedStudent = await response.json();
      setStudents(students.map((s) => (s.id === returnedStudent.id ? returnedStudent : s)));
      
      setEditingItem(null);
      setViewMode((prev) => ({ ...prev, students: "list" }));
      toast({ title: "Success!", description: "Student updated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update student.", variant: "destructive" });
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete student');
      }

      setStudents(students.filter((s) => s.id !== id));
      toast({ title: "Success!", description: "Student deleted successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete student.", variant: "destructive" });
    }
  };

  // Subject CRUD operations
  const createSubject = async () => {
    if (!newSubject.name || !newSubject.code) {
      toast({ title: "Validation Error", description: "Subject Name and Code are required.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSubject),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subject');
      }

      const createdSubject = await response.json();
      setSubjects([...subjects, createdSubject]);
      setNewSubject({});
      toast({ title: "Success!", description: "Subject added successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create subject.", variant: "destructive" });
    }
  };

  const updateSubject = async (updatedSubject: Subject) => {
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/subjects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSubject),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subject');
      }

      const returnedSubject = await response.json();
      setSubjects(subjects.map((s) => (s.id === returnedSubject.id ? returnedSubject : s)));
      setEditingItem(null);
      toast({ title: "Success!", description: "Subject updated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update subject.", variant: "destructive" });
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/subjects`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete subject');
      }

      setSubjects(subjects.filter((s) => s.id !== id));
      toast({ title: "Success!", description: "Subject deleted successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete subject.", variant: "destructive" });
    }
  };

  // Class CRUD operations
  const createClass = async () => {
    if (!newClass.name || !newClass.level) {
      toast({
        title: "Validation Error",
        description: "Please fill in required fields (Class Name and Level)",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/classes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClass),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create class');
      }
      const createdClass = await response.json();
      setClasses([...classes, createdClass]);
      setNewClass({});
      handleStepComplete("subjects");
      toast({
        title: "Success!",
        description: "Class added successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create class.",
        variant: "destructive",
      });
    }
  }

  const updateClass = async (updatedClass: SchoolClass) => {
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/classes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedClass),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update class');
      }
      const returnedClass = await response.json();
      setClasses(classes.map((c) => (c.id === returnedClass.id ? returnedClass : c)));
      setEditingItem(null);
      toast({
        title: "Success!",
        description: "Class updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update class.",
        variant: "destructive",
      });
    }
  }

  const deleteClass = async (id: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolData.schoolCode}/classes`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete class');
      }
      setClasses(classes.filter((c) => c.id !== id));
      toast({
        title: "Success!",
        description: "Class deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete class.",
        variant: "destructive",
      });
    }
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">School Profile</TabsTrigger>
            <TabsTrigger value="staff">Staff & Teachers</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="subjects">Subjects & Classes</TabsTrigger>
            <TabsTrigger value="fees">Fee Management</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-emerald-100 to-purple-100 animate-gradient-x" />

            {/* Progress Card with Glassmorphism */}
            <Card className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-2xl border-0 px-2 py-2 md:px-8 md:py-6">
              <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                <CardTitle className="flex items-center space-x-2 text-base md:text-xl">
                  <CheckCircle className="w-6 h-6 md:w-5 md:h-5 text-green-500 animate-bounce" />
                  <span>Setup Progress</span>
                </CardTitle>
                <CardDescription className="text-sm md:text-base">Complete these steps to fully activate your school management system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                    <span className="text-xs md:text-sm font-medium">Overall Progress</span>
                    <span className="text-xs md:text-sm text-gray-600">
                      {completedSteps}/{setupSteps.length} completed
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-3 rounded-full transition-all duration-500 animate-pulse"
                      style={{
                        width: `${progressPercentage}%`,
                        background: `linear-gradient(90deg, ${schoolData.colorTheme}, #34d399, #6366f1)`
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Setup Steps Grid with Glassy Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
              {setupSteps.map((step) => (
                <Card
                  key={step.id}
                  className={
                    `transition-all duration-300 border-0 shadow-xl bg-white/70 backdrop-blur-lg rounded-2xl active:scale-95 md:hover:scale-[1.02] md:hover:shadow-2xl ${step.completed ? "ring-2 ring-green-200 bg-green-50/80" : ""}`
                  }
                >
                  <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                    <CardTitle className="flex items-center justify-between text-base md:text-lg">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shadow ${step.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}
                        >
                          {step.completed ? <CheckCircle className="w-5 h-5 animate-pulse" /> : <step.icon className="w-5 h-5" />}
                        </div>
                        <span className={step.completed ? "text-green-700 font-semibold" : "font-medium"}>{step.title}</span>
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
                      className="w-full py-3 md:py-2 text-base md:text-sm rounded-xl md:rounded-lg"
                      variant={step.completed ? "outline" : "default"}
                      style={!step.completed ? { backgroundColor: schoolData.colorTheme } : {}}
                    >
                      {step.completed ? "Review" : "Start Setup"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Stats with Modern Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl">
                <CardContent className="p-4 md:p-6 flex items-center space-x-2">
                  <Users className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{teachers.length}</p>
                    <p className="text-xs md:text-sm text-gray-600">Teachers</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-lg border-0 rounded-2xl">
                <CardContent className="p-4 md:p-6 flex items-center space-x-2">
                  <GraduationCap className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{students.length}</p>
                    <p className="text-xs md:text-sm text-gray-600">Students</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg border-0 rounded-2xl">
                <CardContent className="p-4 md:p-6 flex items-center space-x-2">
                  <BookOpen className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{subjects.length}</p>
                    <p className="text-xs md:text-sm text-gray-600">Subjects</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg border-0 rounded-2xl">
                <CardContent className="p-4 md:p-6 flex items-center space-x-2">
                  <School className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{classes.length}</p>
                    <p className="text-xs md:text-sm text-gray-600">Classes</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg border-0 rounded-2xl">
                <CardContent className="p-4 md:p-6 flex items-center space-x-2">
                  <DollarSign className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-xl md:text-2xl font-bold">{feeStructures.length}</p>
                    <p className="text-xs md:text-sm text-gray-600">Fee Structures</p>
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
                              <TableCell>{teacher.teacherProfile?.qualification || "-"}</TableCell>
                              <TableCell>{teacher.teacherProfile?.dateJoined ? new Date(teacher.teacherProfile.dateJoined).toLocaleDateString() : "-"}</TableCell>
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
                        <p className="text-sm">{viewingItem.teacherProfile?.qualification || "-"}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Date Joined</Label>
                        <p className="text-sm">{viewingItem.teacherProfile?.dateJoined ? new Date(viewingItem.teacherProfile.dateJoined).toLocaleDateString() : "-"}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge variant={viewingItem.status === "active" ? "default" : "secondary"}>
                        {viewingItem.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 mt-6 justify-end">
                      <Button asChild variant="default">
                        <Link href={`/schools/${schoolData.schoolCode}/teachers/login?email=${encodeURIComponent(viewingItem.email)}&password=${encodeURIComponent(viewingItem.teacherProfile?.tempPassword || "")}`}>
                          Go to Teacher Dashboard
                        </Link>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          await fetch(`/api/schools/${schoolData.schoolCode}/teachers/${viewingItem.id}/send-credentials`, { method: "POST" });
                          toast({ title: "Credentials sent (simulated)", description: `Credentials sent to ${viewingItem.email}` });
                        }}
                      >
                        Simulate Send Credentials
                      </Button>
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
              <Card className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border-0 px-2 py-2 md:px-8 md:py-6">
                <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                  <CardTitle className="flex items-center justify-between text-base md:text-lg">
                    <span>Students ({students.length})</span>
                    <Button
                      onClick={() => setViewMode((prev) => ({ ...prev, students: "form" }))}
                      style={{ backgroundColor: schoolData.colorTheme }}
                      className="w-full md:w-auto py-3 md:py-2 text-base md:text-sm rounded-xl md:rounded-lg"
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
                      <Table className="hidden md:table">
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
                            <TableRow key={student.id} className="hover:bg-blue-50/30 transition-colors duration-200">
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.admissionNumber}</TableCell>
                              <TableCell>{student.className}</TableCell>
                              <TableCell>{student.parentName}</TableCell>
                              <TableCell>{student.parentPhone}</TableCell>
                              <TableCell>
                                <Badge variant={student.status === "active" ? "default" : "secondary"}>
                                  {student.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" onClick={() => setViewingItem(student)} className="hover:bg-blue-100 active:scale-95">
                                    View Details
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setEditingItem(student)} className="hover:bg-green-100 active:scale-95">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-100 active:scale-95">
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
                      {/* Mobile Card List */}
                      <div className="md:hidden space-y-4">
                        {students.map((student) => (
                          <div key={student.id} className="bg-white/90 rounded-xl shadow-md p-4 flex flex-col gap-2 border border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-lg text-gray-800">{student.name}</div>
                              <Badge variant={student.status === "active" ? "default" : "secondary"}>
                                {student.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              <span>Adm: {student.admissionNumber}</span>
                              <span>Class: {student.className}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              <span>Parent: {student.parentName}</span>
                              <span>Phone: {student.parentPhone}</span>
                            </div>
                            <div className="flex gap-2 pt-2">
                              <Button variant="outline" size="sm" onClick={() => setViewingItem(student)} className="flex-1 active:scale-95">
                                View
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setEditingItem(student)} className="flex-1 active:scale-95">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="flex-1 text-red-600 active:scale-95">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="max-w-full px-2">
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
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {/* Student View Dialog - make full width and mobile friendly */}
            <Dialog open={!!viewingItem && activeTab === "students"} onOpenChange={() => setViewingItem(null)}>
              <DialogContent className="max-w-full md:max-w-4xl px-2 py-4 rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-lg md:text-2xl">Student Details</DialogTitle>
                  <DialogDescription>Complete information for {viewingItem?.name}</DialogDescription>
                </DialogHeader>
                {viewingItem && (
                  <div className="space-y-4 text-base md:text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Full Name</Label>
                        <p className="text-gray-800">{viewingItem.name}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Admission Number</Label>
                        <p className="text-gray-800">{viewingItem.admissionNumber}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Class</Label>
                        <p className="text-gray-800">{viewingItem.className}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Date of Birth</Label>
                        <p className="text-gray-800">{viewingItem.dateOfBirth}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Gender</Label>
                        <p className="text-gray-800">{viewingItem.gender}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Date Admitted</Label>
                        <p className="text-gray-800">{viewingItem.dateAdmitted}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Student Email</Label>
                        <p className="text-gray-800">{viewingItem.email || "Not provided"}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Student Phone</Label>
                        <p className="text-gray-800">{viewingItem.phone || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Parent Name</Label>
                        <p className="text-gray-800">{viewingItem.parentName}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Parent Phone</Label>
                        <p className="text-gray-800">{viewingItem.parentPhone}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-600">Parent Email</Label>
                        <p className="text-gray-800">{viewingItem.parentEmail || "Not provided"}</p>
                      </div>
                    </div>
                    {viewingItem.parent && (
                      <div className="space-y-2 mt-4">
                        <div className="font-bold">Parent Login Credentials</div>
                        <div><strong>Email:</strong> {viewingItem.parent.email}</div>
                        <div><strong>Temporary Password:</strong> {viewingItem.parent.tempPassword || "N/A"}</div>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Home Address</Label>
                      <p className="text-gray-800">{viewingItem.address || "Not provided"}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-600">Status</Label>
                      <Badge variant={viewingItem.status === "active" ? "default" : "secondary"}>
                        {viewingItem.status}
                      </Badge>
                    </div>
                    <div className="pt-4 flex flex-col items-center">
                      <a
                        href={`/schools/${schoolData.schoolCode}/parent/login`}
                        className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-center"
                      >
                        Go to Parent Login
                      </a>
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
                            <p className="text-sm text-gray-600">
                              {subject.code}
                            </p>
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

          {/* Fee Management Tab */}
          <TabsContent value="fees" className="space-y-6">
            <FeeManagement 
              schoolCode={schoolData.schoolCode}
              colorTheme={schoolData.colorTheme}
              onGoBack={() => setActiveTab("overview")}
              onFeeStructureCreated={() => {
                // Update the fee management step as completed
                setSetupSteps(prev => prev.map(step => 
                  step.id === "fees" ? { ...step, completed: true } : step
                ));
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Add a modal/dialog to show credentials after adding a teacher */}
      <Dialog open={showTeacherCredentials} onOpenChange={setShowTeacherCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Credentials</DialogTitle>
            <DialogDescription>
              Share these credentials with the teacher. They will use them to log in for the first time.
            </DialogDescription>
          </DialogHeader>
          {lastTeacherCredentials && (
            <div className="space-y-2">
              <div><strong>Email:</strong> {lastTeacherCredentials.email}</div>
              <div><strong>Temporary Password:</strong> {lastTeacherCredentials.tempPassword}</div>
            </div>
          )}
          <Button onClick={() => setShowTeacherCredentials(false)} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>

      {/* Student Credentials Modal */}
      <Dialog open={showStudentCredentials} onOpenChange={setShowStudentCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Login Credentials</DialogTitle>
            <DialogDescription>
              Share these credentials with the student for their first login.
            </DialogDescription>
          </DialogHeader>
          {lastStudentCredentials && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <strong>Admission Number:</strong>
                  <span className="font-mono">{lastStudentCredentials.admissionNumber}</span>
                </div>
                {lastStudentCredentials.email && (
                  <div className="flex justify-between items-center">
                    <strong>Email:</strong>
                    <span className="font-mono">{lastStudentCredentials.email}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <strong>Temporary Password:</strong>
                  <span className="font-mono">{lastStudentCredentials.tempPassword}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                  <Link 
                    href={`/schools/${encodeURIComponent(schoolData.schoolCode)}/students/login?admissionNumber=${encodeURIComponent(lastStudentCredentials.admissionNumber)}&email=${encodeURIComponent(lastStudentCredentials.email || '')}&password=${encodeURIComponent(lastStudentCredentials.tempPassword)}`}
                  >
                    🚀 Quick Login (Auto-fill)
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    const credentials = `Admission Number: ${lastStudentCredentials.admissionNumber}\nEmail: ${lastStudentCredentials.email || 'N/A'}\nPassword: ${lastStudentCredentials.tempPassword}`;
                    navigator.clipboard.writeText(credentials);
                    toast({ title: "Copied!", description: "Credentials copied to clipboard", variant: "default" });
                  }}
                >
                  📋 Copy Credentials
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/schools/${schoolData.schoolCode}/students/login`}>
                    📝 Manual Login
                  </Link>
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                💡 Tip: Use "Quick Login" to automatically fill the login form with these credentials<br />
                <span className="text-orange-600">⚠️ Note: Credentials are only shown immediately after creation for security reasons</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Parent Credentials Modal */}
      {showParentCredentials && lastParentCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Parent Login Credentials</h2>
            <div className="mb-4 text-gray-700 text-sm">
              Share these credentials with the parent for their first login.<br />
              (Simulated for now. In the future, this can be sent via SMS/email.)
            </div>
            <div className="bg-gray-100 rounded p-4 text-left text-xs mb-4 space-y-2">
              <div className="flex justify-between">
                <b>Admission Number:</b>
                <span className="font-mono">{lastParentCredentials.admissionNumber}</span>
              </div>
              <div className="flex justify-between">
                <b>Parent Phone:</b>
                <span className="font-mono">{lastParentCredentials.parentPhone}</span>
              </div>
              {lastParentCredentials.parentEmail && (
                <div className="flex justify-between">
                  <b>Parent Email:</b>
                  <span className="font-mono">{lastParentCredentials.parentEmail}</span>
                </div>
              )}
              <div className="flex justify-between">
                <b>Temporary Password:</b>
                <span className="font-mono">{lastParentCredentials.tempPassword}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  console.log('Parent credentials debug:', lastParentCredentials);
                  const url = `/schools/${schoolData.schoolCode}/parent/login?phone=${encodeURIComponent(lastParentCredentials.parentPhone)}&password=${encodeURIComponent(lastParentCredentials.tempPassword)}`;
                  console.log('Generated URL:', url);
                  console.log('Phone value:', lastParentCredentials.parentPhone);
                  console.log('Password value:', lastParentCredentials.tempPassword);
                }}
              >
                🔍 Debug Parent Credentials
              </Button>
              <Button asChild className="w-full bg-green-600 hover:bg-green-700">
                <Link 
                  href={`/schools/${schoolData.schoolCode}/parent/login?phone=${encodeURIComponent(lastParentCredentials.parentPhone)}&password=${encodeURIComponent(lastParentCredentials.tempPassword)}`}
                >
                  🚀 Quick Parent Login (Auto-fill)
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  console.log('Parent credentials for copy:', lastParentCredentials);
                  const credentials = `Admission Number: ${lastParentCredentials.admissionNumber}\nParent Phone: ${lastParentCredentials.parentPhone}\nParent Email: ${lastParentCredentials.parentEmail || 'N/A'}\nPassword: ${lastParentCredentials.tempPassword}`;
                  navigator.clipboard.writeText(credentials);
                  toast({ title: "Copied!", description: "Parent credentials copied to clipboard", variant: "default" });
                }}
              >
                📋 Copy Parent Credentials
              </Button>
              <Link href={`/schools/${schoolData.schoolCode}/parent/login`} legacyBehavior>
                <a className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">📝 Manual Parent Login</a>
              </Link>
              <Link href={`/schools/${schoolData.schoolCode}/students/login`} legacyBehavior>
                <a className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition">📚 Go to Student Login</a>
              </Link>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              💡 Tip: Use "Quick Parent Login" to automatically fill the parent login form
            </div>
            <a
              href="#"
              className="text-blue-600 underline mb-4 block"
              onClick={e => { e.preventDefault(); /* future: trigger SMS/email */ }}
            >
              Parent Access (future: send via SMS/email)
            </a>
            <button
              className="mt-2 px-4 py-2 bg-gray-300 text-gray-800 rounded"
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