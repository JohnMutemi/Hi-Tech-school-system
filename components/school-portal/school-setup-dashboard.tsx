"use client";

import { DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import * as XLSX from "xlsx";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog";
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
  ArrowRight,
  Upload,
} from "lucide-react";
import type {
  SchoolData,
  SchoolProfile,
  Teacher,
  Student,
  Subject,
  SchoolClass,
  Grade,
} from "@/lib/school-storage";
import { updateSchoolClasses, getSchool } from "@/lib/school-storage";
import Link from "next/link";
import { generateTempPassword } from "@/lib/utils/school-generator";
import { FeeManagement } from "./fee-management";
import { AcademicCalendarCrud } from "./AcademicCalendarCrud";
import AdmissionNumberSettings from "./AdmissionNumberSettings";
import { Sidebar } from "./Sidebar";

interface SchoolSetupDashboardProps {
  schoolData: SchoolData;
  onLogout: () => void;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  icon: React.ElementType;
}

type ViewMode = "list" | "form" | "view";

// Add this utility at the top (or import if shared)
function getNextAdmissionNumber(lastAdmissionNumber: string): string {
  if (!lastAdmissionNumber) return '';
  const match = lastAdmissionNumber.match(/(\d+)(?!.*\d)/);
  if (match) {
    const number = match[1];
    const next = (parseInt(number, 10) + 1).toString().padStart(number.length, '0');
    return lastAdmissionNumber.replace(/(\d+)(?!.*\d)/, next);
  }
  return lastAdmissionNumber + '1';
}

export function SchoolSetupDashboard({
  schoolData: initialSchoolData,
  onLogout,
}: SchoolSetupDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [schoolData, setSchoolData] = useState(initialSchoolData);
  const [viewMode, setViewMode] = useState<Record<string, ViewMode>>({
    staff: "list",
    students: "list",
    subjects: "list",
  });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [profileSaved, setProfileSaved] = useState(
    !!initialSchoolData.profile?.address
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);

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
      completed:
        (schoolData.subjects?.length || 0) > 0 &&
        (schoolData.classes?.length || 0) > 0,
      icon: BookOpen,
    },
    {
      id: "fees",
      title: "Fee Management",
      description: "Configure fee structures and payment settings",
      completed: false, // Will be updated based on fee structures
      icon: DollarSign,
    },
  ]);

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
    }
  );

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [bursars, setBursars] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>(
    schoolData.students || []
  );
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>(
    schoolData.subjects || []
  );
  const [classes, setClasses] = useState<SchoolClass[]>(
    schoolData.classes || []
  );
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);

  // Fetch grades from API on component mount
  useEffect(() => {
    async function fetchGrades() {
      const res = await fetch(`/api/grades`);
      if (!res.ok) throw new Error("Failed to fetch grades");
      setGrades(await res.json());
    }
    fetchGrades();
  }, []);

  // Fetch classes from API on component mount
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch(
          `/api/schools/${schoolData.schoolCode}/classes`
        );
        if (res.ok) {
          const data = await res.json();
          // Map the API data to frontend format
          const mappedClasses = data.map((cls: any) => ({
            ...cls,
            classTeacherId: cls.teacherId, // Map teacherId to classTeacherId
            level: cls.level || "Primary", // Default level if not provided
            capacity: cls.capacity || 30, // Default capacity if not provided
            currentStudents: cls.currentStudents || 0, // Default currentStudents if not provided
          }));
          setClasses(mappedClasses);
        }
      } catch (error) {
        console.error("Failed to fetch classes", error);
        toast({
          title: "Error",
          description: "Could not load classes.",
          variant: "destructive",
        });
      }
    }
    if (schoolData.schoolCode) {
      fetchClasses();
    }
  }, [schoolData.schoolCode, toast]);

  // Form states for new items
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({});
  const [newBursar, setNewBursar] = useState<Partial<any>>({});
  const [newStudent, setNewStudent] = useState<Partial<Student>>({});
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({});
  const [newClass, setNewClass] = useState<Partial<SchoolClass>>({});

  // Add state for showing credentials
  const [showTeacherCredentials, setShowTeacherCredentials] = useState(false);
  const [lastTeacherCredentials, setLastTeacherCredentials] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  const [showBursarCredentials, setShowBursarCredentials] = useState(false);
  const [lastBursarCredentials, setLastBursarCredentials] = useState<{
    email: string;
    tempPassword: string;
  } | null>(null);
  const [showStudentCredentials, setShowStudentCredentials] = useState(false);
  const [lastStudentCredentials, setLastStudentCredentials] = useState<{
    admissionNumber: string;
    email: string;
    tempPassword: string;
  } | null>(null);
  const [lastParentCredentials, setLastParentCredentials] = useState<any>(null);
  const [showParentCredentials, setShowParentCredentials] = useState(false);

  // Bulk import states
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);
  const [importResults, setImportResults] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<
    "upload" | "preview" | "results"
  >("upload");

  // Add state for search and class filter
  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("All");

  // Compute unique class options from students
  const classOptions = [
    "All",
    ...Array.from(
      new Set(students.map((s) => s.className).filter(Boolean))
    ).sort(),
  ];

  // Filter students based on search and class
  const filteredStudents = students.filter((student) => {
    const search = studentSearch.toLowerCase();
    const matchesSearch =
      student.name?.toLowerCase().includes(search) ||
      student.admissionNumber?.toLowerCase().includes(search) ||
      student.parentName?.toLowerCase().includes(search) ||
      student.parentPhone?.toLowerCase().includes(search);
    const matchesClass =
      studentClassFilter === "All" || student.className === studentClassFilter;
    return matchesSearch && matchesClass;
  });

  // Fetch teachers from API on component mount
  useEffect(() => {
    async function fetchTeachers() {
      try {
        const res = await fetch(
          `/api/schools/${schoolData.schoolCode}/teachers`
        );
        if (res.ok) {
          const data = await res.json();
          setTeachers(data);
        }
      } catch (error) {
        console.error("Failed to fetch teachers", error);
        toast({
          title: "Error",
          description: "Could not load teacher data.",
          variant: "destructive",
        });
      }
    }
    fetchTeachers();
  }, [schoolData.schoolCode, toast]);

  // Fetch bursars from API on component mount
  useEffect(() => {
    async function fetchBursars() {
      try {
        const res = await fetch(
          `/api/schools/${schoolData.schoolCode}/bursars`
        );
        if (res.ok) {
          const data = await res.json();
          setBursars(data);
        }
      } catch (error) {
        console.error("Failed to fetch bursars", error);
        toast({
          title: "Error",
          description: "Could not load bursar data.",
          variant: "destructive",
        });
      }
    }
    fetchBursars();
  }, [schoolData.schoolCode, toast]);

  // Fetch students from API on component mount
  const fetchStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/students`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load student data.",
        variant: "destructive",
      });
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch students on mount and when schoolCode changes
  useEffect(() => {
    fetchStudents();
  }, [schoolData.schoolCode]);

  // Fetch subjects from API on component mount
  useEffect(() => {
    async function fetchSubjects() {
      try {
        const res = await fetch(
          `/api/schools/${schoolData.schoolCode}/subjects`
        );
        if (res.ok) {
          const data = await res.json();
          setSubjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch subjects", error);
        toast({
          title: "Error",
          description: "Could not load subject data.",
          variant: "destructive",
        });
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
        const res = await fetch(
          `/api/schools/${schoolData.schoolCode}/fee-structure`
        );
        if (res.ok) {
          const data = await res.json();
          setFeeStructures(data);
          // Update fee management step completion status
          setSetupSteps((prev) =>
            prev.map((step) =>
              step.id === "fees"
                ? { ...step, completed: data.length > 0 }
                : step
            )
          );
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
      const refreshedData = await getSchool(schoolData.schoolCode);
      if (refreshedData) {
        setSchoolData(refreshedData);
        // setTeachers(refreshedData.teachers || []); // Only update teachers from the API, not from local storage
        // setStudents(refreshedData.students || []); // Only update students from the API, not from local storage
        setSubjects(refreshedData.subjects || []);
        setClasses(refreshedData.classes || []);
      }
    }
    fetchSchool();
  }, [schoolData.schoolCode]);

  const completedSteps = setupSteps.filter((step) => step.completed).length;
  const progressPercentage = (completedSteps / setupSteps.length) * 100;

  const handleStepComplete = (stepId: string) => {
    setSetupSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
  };

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
      });
      if (!res.ok) throw new Error("Failed to update school profile");
      handleStepComplete("profile");
      setProfileSaved(true);
      setIsEditingProfile(false);
      toast({
        title: "Success!",
        description: "School profile saved successfully!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save school profile.",
        variant: "destructive",
      });
    }
  };

  // Teacher CRUD operations
  const createTeacher = async (teacherData: Partial<Teacher>) => {
    if (!teacherData.name || !teacherData.email) {
      toast({
        title: "Validation Error",
        description: "Name and Email are required.",
        variant: "destructive",
      });
      return false;
    }

    const tempPassword = generateTempPassword();
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/teachers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...teacherData, tempPassword }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create teacher");
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
      toast({
        title: "Error",
        description: error.message || "Failed to create teacher.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTeacher = async (updatedTeacher: Teacher) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/teachers`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTeacher),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update teacher");
      }

      const returnedTeacher = await response.json();
      setTeachers(
        teachers.map((t) => (t.id === returnedTeacher.id ? returnedTeacher : t))
      );

      setEditingItem(null);
      setViewMode((prev) => ({ ...prev, staff: "list" }));
      toast({
        title: "Success!",
        description: "Teacher updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update teacher.",
        variant: "destructive",
      });
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/teachers`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete teacher");
      }

      setTeachers(teachers.filter((t) => t.id !== id));
      toast({
        title: "Success!",
        description: "Teacher deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete teacher.",
        variant: "destructive",
      });
    }
  };

  const deleteBursar = async (id: string) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/bursars`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete bursar");
      }

      setBursars(bursars.filter((b) => b.id !== id));
      toast({
        title: "Success!",
        description: "Bursar deleted successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bursar.",
        variant: "destructive",
      });
    }
  };

  const updateBursar = async (updatedBursar: any) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/bursars`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: updatedBursar.id,
            name: updatedBursar.name,
            email: updatedBursar.email,
            phone: updatedBursar.phone,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update bursar");
      }

      const returnedBursar = await response.json();
      setBursars(bursars.map((b) => (b.id === returnedBursar.id ? returnedBursar : b)));

      setEditingItem(null);
      setViewMode((prev) => ({ ...prev, staff: "list" }));
      toast({
        title: "Success!",
        description: "Bursar updated successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update bursar.",
        variant: "destructive",
      });
    }
  };

  // Bursar CRUD operations
  const createBursar = async (bursarData: Partial<any>) => {
    if (!bursarData.name || !bursarData.email) {
      toast({
        title: "Validation Error",
        description: "Name and Email are required.",
        variant: "destructive",
      });
      return false;
    }

    const tempPassword = "bursar123";
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/bursars`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...bursarData, tempPassword }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bursar");
      }

      const newBursar = await response.json();
      setBursars([...bursars, newBursar]);

      setNewBursar({});
      setViewMode((prev) => ({ ...prev, staff: "list" }));
      handleStepComplete("staff");
      setLastBursarCredentials({ email: newBursar.email, tempPassword });
      setShowBursarCredentials(true);
      toast({ title: "Success!", description: "Bursar added successfully!" });
      return true;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create bursar.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Student CRUD operations
  const createStudent = async (studentData: Partial<Student>) => {
    if (
      !studentData.name ||
      !studentData.parentName ||
      !studentData.parentPhone ||
      !studentData.email ||
      !studentData.classId
    ) {
      toast({
        title: "Validation Error",
        description:
          "Student Name, Email, Class, Parent Name, and Parent Phone are required.",
        variant: "destructive",
      });
      return false;
    }

    const tempPassword = "student123";
    const admissionNumber = studentData.admissionNumber || `ADM${Date.now()}`;

    console.log("Creating student with data:", {
      ...studentData,
      tempPassword,
      admissionNumber,
    });

    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...studentData,
            tempPassword,
            admissionNumber,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create student");
      }

      const newStudent = await response.json();
      console.log("API response for new student:", newStudent);

      setStudents([...students, newStudent]);
      console.log("Updated students state:", [...students, newStudent]);

      setNewStudent({});
      setViewMode((prev) => ({ ...prev, students: "list" }));
      handleStepComplete("students");

      // Set student credentials
      setLastStudentCredentials({
        admissionNumber,
        email: newStudent.email,
        tempPassword: newStudent.tempPassword,
      });
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
      await fetchStudents();
      return true;
    } catch (error: any) {
      console.error("Error creating student:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create student.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateStudent = async (updatedStudent: Student) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/students`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...updatedStudent,
            studentId: updatedStudent.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update student");
      }

      const returnedStudent = await response.json();
      setStudents(
        students.map((s) => (s.id === returnedStudent.id ? returnedStudent : s))
      );

      setEditingItem(null);
      setViewMode((prev) => ({ ...prev, students: "list" }));
      toast({
        title: "Success!",
        description: "Student updated successfully!",
      });
      await fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update student.",
        variant: "destructive",
      });
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/students`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete student");
      }

      setStudents(students.filter((s) => s.id !== id));
      toast({
        title: "Success!",
        description: "Student deleted successfully!",
      });
      await fetchStudents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student.",
        variant: "destructive",
      });
    }
  };

  // Subject CRUD operations
  const createSubject = async () => {
    if (!newSubject.name || !newSubject.code) {
      toast({
        title: "Validation Error",
        description: "Subject Name and Code are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/subjects`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newSubject),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create subject");
      }

      const createdSubject = await response.json();
      setSubjects([...subjects, createdSubject]);
      setNewSubject({});
      toast({ title: "Success!", description: "Subject added successfully!" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subject.",
        variant: "destructive",
      });
    }
  };

  const updateSubject = async (updatedSubject: Subject) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/subjects`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedSubject),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update subject");
      }

      const returnedSubject = await response.json();
      setSubjects(
        subjects.map((s) => (s.id === returnedSubject.id ? returnedSubject : s))
      );
      setEditingItem(null);
      toast({
        title: "Success!",
        description: "Subject updated successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update subject.",
        variant: "destructive",
      });
    }
  };

  const deleteSubject = async (id: string) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/subjects`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete subject");
      }

      setSubjects(subjects.filter((s) => s.id !== id));
      toast({
        title: "Success!",
        description: "Subject deleted successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject.",
        variant: "destructive",
      });
    }
  };

  // Class CRUD operations
  const createClass = async () => {
    if (!newClass.name || !newClass.level || !newClass.gradeId) {
      toast({
        title: "Validation Error",
        description:
          "Please fill in required fields (Class Name, Level, and Grade)",
        variant: "destructive",
      });
      return;
    }
    try {
      // Map the frontend fields to the correct database fields
      const apiData = {
        name: newClass.name,
        academicYear:
          newClass.academicYear || new Date().getFullYear().toString(),
        teacherId: newClass.classTeacherId, // Map classTeacherId to teacherId
        gradeId: newClass.gradeId,
      };

      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/classes`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create class");
      }
      const createdClass = await response.json();

      // Map the returned data back to the frontend format
      const mappedClass = {
        ...createdClass,
        classTeacherId: createdClass.teacherId, // Map teacherId back to classTeacherId
        level: newClass.level, // Keep the level from the original data
        capacity: newClass.capacity, // Keep the capacity from the original data
      };

      setClasses([...classes, mappedClass]);
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
  };

  const updateClass = async (updatedClass: SchoolClass) => {
    try {
      // Map the frontend fields to the correct database fields
      const apiData = {
        id: updatedClass.id,
        name: updatedClass.name,
        academicYear:
          updatedClass.academicYear || new Date().getFullYear().toString(),
        teacherId: updatedClass.classTeacherId, // Map classTeacherId to teacherId
        gradeId: updatedClass.gradeId,
      };

      console.log("Updating class with data:", apiData);
      console.log("Original class data:", updatedClass);

      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/classes`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update class");
      }
      const returnedClass = await response.json();

      console.log("API returned class:", returnedClass);

      // Map the returned data back to the frontend format
      const mappedClass = {
        ...returnedClass,
        classTeacherId: returnedClass.teacherId, // Map teacherId back to classTeacherId
        level: updatedClass.level, // Keep the level from the original data
        capacity: updatedClass.capacity, // Keep the capacity from the original data
      };

      console.log("Mapped class for frontend:", mappedClass);

      setClasses(
        classes.map((c) => (c.id === mappedClass.id ? mappedClass : c))
      );
      setEditingItem(null);
      toast({
        title: "Success!",
        description: "Class updated successfully!",
      });
    } catch (error: any) {
      console.error("Error updating class:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update class.",
        variant: "destructive",
      });
    }
  };

  const deleteClass = async (id: string) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/classes`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete class");
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
  };

  // Teacher Form Component
  const TeacherForm = ({
    teacher,
    onSave,
    onCancel,
  }: {
    teacher?: Teacher;
    onSave: (teacher: Teacher) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<Partial<Teacher>>(
      teacher || newTeacher
    );

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (teacher) {
        onSave(formData as Teacher);
      } else {
        // Directly create teacher without setting state first
        const success = await createTeacher(formData);
        if (success) {
          // Reset form data after successful creation
          setFormData({});
        }
      }
    };

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
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Teacher Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+254 700 000 000"
                />
              </div>
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input
                  value={formData.qualification || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, qualification: e.target.value })
                  }
                  placeholder="e.g., Bachelor of Education"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date Joined</Label>
              <Input
                type="date"
                value={formData.dateJoined || ""}
                onChange={(e) =>
                  setFormData({ ...formData, dateJoined: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: schoolData.colorTheme }}
              >
                {teacher ? "Update Teacher" : "Add Teacher"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  // Bursar Form Component
  const BursarForm = ({
    bursar,
    onSave,
    onCancel,
  }: {
    bursar?: any;
    onSave: (bursar: any) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<Partial<any>>(
      bursar || newBursar
    );

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (bursar) {
        onSave(formData as any);
      } else {
        // Directly create bursar without setting state first
        const success = await createBursar(formData);
        if (success) {
          // Reset form data after successful creation
          setFormData({});
        }
      }
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {bursar ? "Edit Bursar" : "Add New Bursar"}
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
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Bursar Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="bursar@school.edu"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+254 700 000 000"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: schoolData.colorTheme }}
              >
                {bursar ? "Update Bursar" : "Add Bursar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  // Student Form Component
  const StudentForm = ({
    student,
    onSave,
    onCancel,
  }: {
    student?: Student;
    onSave: (student: Student) => void;
    onCancel: () => void;
  }) => {
    const [formData, setFormData] = useState<Partial<Student>>(
      student || newStudent
    );
    const [admissionPreview, setAdmissionPreview] = useState('');
    const [loadingAdmission, setLoadingAdmission] = useState(false);

    // Fetch the latest lastAdmissionNumber when opening the form (for new student)
    useEffect(() => {
      if (!student) {
        setLoadingAdmission(true);
        fetch(`/api/schools/${schoolData.schoolCode}`)
          .then(res => res.json())
          .then(data => {
            const next = getNextAdmissionNumber(data.lastAdmissionNumber || '');
            setAdmissionPreview(next);
            setFormData(f => ({ ...f, admissionNumber: f.admissionNumber || next }));
            setLoadingAdmission(false);
          })
          .catch(() => setLoadingAdmission(false));
      }
    }, [student]);

    // After adding a student, re-fetch and suggest the next admission number
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      // ...existing validation...
      if (
        !formData.name ||
        !formData.email ||
        !formData.classId ||
        !formData.parentName ||
        !formData.parentPhone
      ) {
        toast({
          title: "Validation Error",
          description:
            "Please fill in all required fields: Student Name, Email, Class, Parent Name, and Parent Phone.",
          variant: "destructive",
        });
        return;
      }
      if (student) {
        onSave(formData as Student);
      } else {
        const success = await createStudent(formData);
        if (success) {
          // Re-fetch the latest admission number and reset form for rapid entry
          setLoadingAdmission(true);
          fetch(`/api/schools/${schoolData.schoolCode}`)
            .then(res => res.json())
            .then(data => {
              const next = getNextAdmissionNumber(data.lastAdmissionNumber || '');
              setAdmissionPreview(next);
              setFormData({ admissionNumber: next });
              setLoadingAdmission(false);
            })
            .catch(() => setLoadingAdmission(false));
        }
      }
    };

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
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Student Full Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Admission Number</Label>
                <Input
                  value={formData.admissionNumber || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      admissionNumber: e.target.value,
                    })
                  }
                  placeholder=""
                />
                {admissionPreview && !formData.admissionNumber && (
                  <div className="text-xs text-gray-500 mb-2">
                    <span
                      className="font-mono bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-blue-100"
                      onClick={() => setFormData(f => ({ ...f, admissionNumber: admissionPreview }))}
                      title="Click to autofill"
                    >
                      Click to use: {admissionPreview}
                    </span>
                  </div>
                )}
                {!admissionPreview && !formData.admissionNumber && (
                  <div className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-2 py-1 mt-2">
                    Please set the <b>first admission number</b> in the <b>Settings</b> tab before adding students. This enables automatic admission number suggestions.
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Class/Grade *</Label>
                <Select
                  value={formData.classId || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, classId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
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
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select
                  value={formData.gender || ""}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, gender: value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="student@email.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Student Phone</Label>
                <Input
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="+254 700 000 000"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Parent/Guardian Name *</Label>
                <Input
                  value={formData.parentName || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, parentName: e.target.value })
                  }
                  placeholder="Parent Full Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Phone *</Label>
                <Input
                  value={formData.parentPhone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, parentPhone: e.target.value })
                  }
                  placeholder="+254 700 000 000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Email</Label>
                <Input
                  type="email"
                  value={formData.parentEmail || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, parentEmail: e.target.value })
                  }
                  placeholder="parent@email.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Home Address</Label>
              <Textarea
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Student's home address"
                rows={2}
              />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: schoolData.colorTheme }}
              >
                {student ? "Update Student" : "Add Student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  // Function to map className to classId (no gradeName)
  const mapClassToId = (className: string) => {
    const classObj = classes.find((cls) => cls.name === className);
    if (!classObj) {
      throw new Error(`Class not found: ${className}`);
    }
    return classObj.id;
  };

  // Bulk import function
  const bulkImportStudents = async (students: any[]) => {
    setIsImporting(true);
    try {
      console.log("[DEBUG] All classes loaded at import:", classes);
      classes.forEach((cls) => {
        console.log(
          `[DEBUG] Class: name='${cls.name}', gradeId='${cls.gradeId}', isActive=${cls.isActive}, academicYear=${cls.academicYear}`
        );
      });
      // Map className to classId for each student
      const mappedStudents = students.map((student) => {
        const classId = mapClassToId(student.className);
        return {
          ...student,
          classId,
          className: undefined, // Remove for backend
        };
      });

      const response = await fetch(
        `/api/schools/${schoolData.schoolCode}/students/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students: mappedStudents }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import students");
      }

      const result = await response.json();
      setImportResults(result.results);
      setImportStep("results");

      // Refresh students list
      await fetchStudents();

      toast({
        title: "Import Complete!",
        description: `Successfully imported ${
          result.results.filter((r: any) => r.status === "success").length
        } students.`,
      });
    } catch (error: any) {
      console.error("Error importing students:", error);
      toast({
        title: "Import Error",
        description: error.message || "Failed to import students.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // File parsing function
  const parseFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      let students: any[] = [];

      // Helper to trim all keys and values in a row
      const trimRow = (row: any) => {
        const trimmed: any = {};
        Object.keys(row).forEach((key) => {
          const trimmedKey = key.trim();
          let value = row[key];
          if (typeof value === "string") value = value.trim();
          trimmed[trimmedKey] = value;
        });
        return trimmed;
      };

      if (file.name.endsWith(".csv")) {
        Papa.parse(content, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            students = results.data.map((row: any) => {
              const tRow = trimRow(row);
              return {
                name: tRow.name || tRow.Name || tRow.NAME,
                email: tRow.email || tRow.Email || tRow.EMAIL,
                phone: tRow.phone || tRow.Phone || tRow.PHONE,
                parentName:
                  tRow.parentName ||
                  tRow.ParentName ||
                  tRow.PARENTNAME ||
                  tRow.parent_name,
                parentPhone:
                  tRow.parentPhone ||
                  tRow.ParentPhone ||
                  tRow.PARENTPHONE ||
                  tRow.parent_phone,
                parentEmail:
                  tRow.parentEmail ||
                  tRow.ParentEmail ||
                  tRow.PARENTEMAIL ||
                  tRow.parent_email,
                admissionNumber:
                  tRow.admissionNumber ||
                  tRow.AdmissionNumber ||
                  tRow.ADMISSIONNUMBER ||
                  tRow.admission_number,
                className:
                  tRow.className ||
                  tRow.ClassName ||
                  tRow.CLASSNAME ||
                  tRow.class_name,
                gradeName:
                  tRow.gradeName ||
                  tRow.GradeName ||
                  tRow.GRADENAME ||
                  tRow.grade_name,
                dateOfBirth:
                  tRow.dateOfBirth ||
                  tRow.DateOfBirth ||
                  tRow.DATEOFBIRTH ||
                  tRow.date_of_birth,
                dateAdmitted:
                  tRow.dateAdmitted ||
                  tRow.DateAdmitted ||
                  tRow.DATEADMITTED ||
                  tRow.date_admitted,
                address: tRow.address || tRow.Address || tRow.ADDRESS,
                gender: tRow.gender || tRow.Gender || tRow.GENDER,
                status: tRow.status || tRow.Status || tRow.STATUS || "active",
              };
            });
            setParsedStudents(students);
            setImportStep("preview");
          },
          error: (error) => {
            toast({
              title: "CSV Parse Error",
              description: error.message,
              variant: "destructive",
            });
          },
        });
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        try {
          const workbook = XLSX.read(content, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          students = jsonData.map((row: any) => {
            const tRow = trimRow(row);
            return {
              name: tRow.name || tRow.Name || tRow.NAME,
              email: tRow.email || tRow.Email || tRow.EMAIL,
              phone: tRow.phone || tRow.Phone || tRow.PHONE,
              parentName:
                tRow.parentName ||
                tRow.ParentName ||
                tRow.PARENTNAME ||
                tRow.parent_name,
              parentPhone:
                tRow.parentPhone ||
                tRow.ParentPhone ||
                tRow.PARENTPHONE ||
                tRow.parent_phone,
              parentEmail:
                tRow.parentEmail ||
                tRow.ParentEmail ||
                tRow.PARENTEMAIL ||
                tRow.parent_email,
              admissionNumber:
                tRow.admissionNumber ||
                tRow.AdmissionNumber ||
                tRow.ADMISSIONNUMBER ||
                tRow.admission_number,
              className:
                tRow.className ||
                tRow.ClassName ||
                tRow.CLASSNAME ||
                tRow.class_name,
              gradeName:
                tRow.gradeName ||
                tRow.GradeName ||
                tRow.GRADENAME ||
                tRow.grade_name,
              dateOfBirth:
                tRow.dateOfBirth ||
                tRow.DateOfBirth ||
                tRow.DATEOFBIRTH ||
                tRow.date_of_birth,
              dateAdmitted:
                tRow.dateAdmitted ||
                tRow.DateAdmitted ||
                tRow.DATEADMITTED ||
                tRow.date_admitted,
              address: tRow.address || tRow.Address || tRow.ADDRESS,
              gender: tRow.gender || tRow.Gender || tRow.GENDER,
              status: tRow.status || tRow.Status || tRow.STATUS || "active",
            };
          });
          setParsedStudents(students);
          setImportStep("preview");
        } catch (error: any) {
          toast({
            title: "Excel Parse Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    };

    reader.readAsBinaryString(file);
  };

  // Reset import dialog
  const resetImportDialog = () => {
    setShowBulkImportDialog(false);
    setParsedStudents([]);
    setImportResults([]);
    setImportStep("upload");
    setIsImporting(false);
  };

  // The return statement must be inside the function
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Sidebar with modern look */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} colorTheme={schoolData.colorTheme} onLogout={onLogout} />
      {/* Main Content Area with vertical divider */}
      <div className="flex-1 flex justify-center items-start relative">
        {/* Vertical divider/shadow */}
        <div className="hidden md:block absolute left-0 top-0 h-full w-10 z-10">
          <div className="h-full w-2 ml-6 bg-gradient-to-b from-transparent via-blue-200 to-transparent shadow-2xl rounded-full opacity-80" />
        </div>
        <main className="flex-1 flex justify-center items-start p-2 md:p-6 transition-all duration-300">
          <section className="w-full max-w-7xl bg-white/80 rounded-3xl shadow-2xl p-4 md:p-14 backdrop-blur-lg mx-2 md:mx-6 ml-0 md:ml-20 lg:ml-32 pl-0 md:pl-16">
            {/* Header */}
            <div
              className="sticky top-0 z-20 bg-white/70 shadow-sm border-b rounded-2xl mb-8 px-4 py-8 flex items-center justify-between"
              style={{ borderTopColor: schoolData.colorTheme, borderTopWidth: "4px" }}
            >
              <div className="flex items-center space-x-4">
                {schoolData.logoUrl ? (
                  <img
                    src={schoolData.logoUrl || "/placeholder.svg"}
                    alt={`${schoolData.name} logo`}
                    className="w-16 h-16 object-cover rounded-xl border-2 shadow-lg"
                    style={{ borderColor: schoolData.colorTheme }}
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center border-2 shadow-lg"
                    style={{
                      backgroundColor: schoolData.colorTheme + "20",
                      borderColor: schoolData.colorTheme,
                    }}
                  >
                    <School
                      className="w-8 h-8"
                      style={{ color: schoolData.colorTheme }}
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, {schoolData.adminFirstName} {schoolData.adminLastName}!
                  </h1>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge
                  variant={
                    schoolData.status === "setup" ? "secondary" : "default"
                  }
                >
                  {schoolData.status === "setup" ? "Setup in Progress" : "Active"}
                </Badge>
                {/* <Button variant="outline" onClick={onLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button> */}
              </div>
            </div>
            {/* Main Tab Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Contents remain unchanged */}
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                {/* Summary Stats Section - Modern Cards, Only at Top */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <Users className="w-6 h-6 text-blue-500 mb-1" />
                      <div className="text-2xl font-bold">{teachers.length}</div>
                      <div className="text-gray-500 text-sm">Teachers</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <GraduationCap className="w-6 h-6 text-green-500 mb-1" />
                      <div className="text-2xl font-bold">{students.length}</div>
                      <div className="text-gray-500 text-sm">Students</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <BookOpen className="w-6 h-6 text-purple-500 mb-1" />
                      <div className="text-2xl font-bold">{subjects.length}</div>
                      <div className="text-gray-500 text-sm">Subjects</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <School className="w-6 h-6 text-orange-500 mb-1" />
                      <div className="text-2xl font-bold">{classes.length}</div>
                      <div className="text-gray-500 text-sm">Classes</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <DollarSign className="w-6 h-6 text-emerald-500 mb-1" />
                      <div className="text-2xl font-bold">{feeStructures.length}</div>
                      <div className="text-gray-500 text-sm">Fee Structure</div>
                    </CardContent>
                  </Card>
                </div>
                {/* Animated Gradient Background */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-100 via-emerald-100 to-purple-100 animate-gradient-x" />

                {/* Progress Card with Glassmorphism */}
                <Card className="bg-white/60 backdrop-blur-lg rounded-3xl shadow-2xl border-0 px-4 py-4 md:px-12 md:py-10">
                  <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                    <CardTitle className="flex items-center space-x-2 text-base md:text-xl">
                      <CheckCircle className="w-6 h-6 md:w-5 md:h-5 text-green-500 animate-bounce" />
                      <span>Setup Progress</span>
                    </CardTitle>
                    <CardDescription className="text-sm md:text-base">
                      Complete these steps to fully activate your school management
                      system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                        <span className="text-xs md:text-sm font-medium">
                          Overall Progress
                        </span>
                        <span className="text-xs md:text-sm text-gray-600">
                          {completedSteps}/{setupSteps.length} completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-3 rounded-full transition-all duration-500 animate-pulse"
                          style={{
                            width: `${progressPercentage}%`,
                            background: `linear-gradient(90deg, ${schoolData.colorTheme}, #34d399, #6366f1)`,
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
                      className={`transition-all duration-300 border-0 shadow-xl bg-white/70 backdrop-blur-lg rounded-2xl active:scale-95 md:hover:scale-[1.02] md:hover:shadow-2xl ${
                        step.completed ? "ring-2 ring-green-200 bg-green-50/80" : ""
                      }`}
                    >
                      <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                        <CardTitle className="flex items-center justify-between text-base md:text-lg">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shadow ${
                                step.completed
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {step.completed ? (
                                <CheckCircle className="w-5 h-5 animate-pulse" />
                              ) : (
                                <step.icon className="w-5 h-5" />
                              )}
                            </div>
                            <span
                              className={
                                step.completed
                                  ? "text-green-700 font-semibold"
                                  : "font-medium"
                              }
                            >
                              {step.title}
                            </span>
                          </div>
                          {step.completed ? (
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline">Pending</Badge>
                          )}
                        </CardTitle>
                        <CardDescription
                          className={step.completed ? "text-green-600" : ""}
                        >
                          {step.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          onClick={() =>
                            setActiveTab(
                              step.id === "profile" ? "profile" : step.id
                            )
                          }
                          className="w-full py-3 md:py-2 text-base md:text-sm rounded-xl md:rounded-lg"
                          variant={step.completed ? "outline" : "default"}
                          style={
                            !step.completed
                              ? { backgroundColor: schoolData.colorTheme }
                              : {}
                          }
                        >
                          {step.completed ? "Review" : "Start Setup"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

              </TabsContent>

              {/* School Profile Tab */}
              <TabsContent value="profile" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                {profileSaved && !isEditingProfile ? (
                  // Read-only view after profile is saved
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <School className="w-5 h-5" />
                          School Profile
                        </span>
                        <Button
                          onClick={() => setIsEditingProfile(true)}
                          variant="outline"
                          style={{
                            borderColor: schoolData.colorTheme,
                            color: schoolData.colorTheme,
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Update Profile
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Complete school information and administrative details
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Contact & Location
                            </h4>
                            <div className="space-y-4">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <Label className="text-sm font-medium text-gray-600 mb-1">
                                  Campus Address
                                </Label>
                                <p className="text-gray-900 font-medium">
                                  {schoolProfile.address || "Address not set"}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <Label className="text-sm font-medium text-gray-600 mb-1">
                                  Contact Phone
                                </Label>
                                <p className="text-gray-900 font-medium">
                                  {schoolProfile.phone || "Phone not set"}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <Label className="text-sm font-medium text-gray-600 mb-1">
                                  Email Address
                                </Label>
                                <p className="text-gray-900 font-medium">
                                  {schoolProfile.email || "Email not set"}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <Label className="text-sm font-medium text-gray-600 mb-1">
                                  Website
                                </Label>
                                <p className="text-gray-900 font-medium">
                                  {schoolProfile.website ? (
                                    <a
                                      href={schoolProfile.website}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline"
                                    >
                                      {schoolProfile.website}
                                    </a>
                                  ) : (
                                    "Website not set"
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              School Information
                            </h4>
                            <div className="space-y-4">
                              <div className="bg-gray-50 rounded-lg p-4">
                                <Label className="text-sm font-medium text-gray-600 mb-1">
                                  Principal
                                </Label>
                                <p className="text-gray-900 font-medium">
                                  {schoolProfile.principalName || "Principal not set"}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <Label className="text-sm font-medium text-gray-600 mb-1">
                                  Founded
                                </Label>
                                <p className="text-gray-900 font-medium">
                                  {schoolProfile.establishedYear || "Year not set"}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <Label className="text-sm font-medium text-gray-600 mb-1">
                                  Institution Type
                                </Label>
                                <p className="text-gray-900 font-medium capitalize">
                                  {schoolProfile.type || "Type not set"}
                                </p>
                              </div>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <Label className="text-sm font-medium text-gray-600 mb-1">
                                  School Motto
                                </Label>
                                <p className="text-gray-900 font-medium italic">
                                  "{schoolProfile.motto || "Motto not set"}"
                                </p>
                              </div>
                            </div>
                          </div>
                          {schoolProfile.description && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                About Our School
                              </h4>
                              <div className="bg-gray-50 rounded-lg p-4">
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {schoolProfile.description}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="text-sm font-medium text-green-700">Profile Complete</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Edit form view
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {profileSaved
                          ? "Edit School Profile"
                          : "School Profile Information"}
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
                        {profileSaved
                          ? "Update your school's information and contact details"
                          : "Complete your school's basic information and contact details"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="address">School Address *</Label>
                          <Textarea
                            id="address"
                            value={schoolProfile.address}
                            onChange={(e) =>
                              setSchoolProfile({
                                ...schoolProfile,
                                address: e.target.value,
                              })
                            }
                            placeholder="Enter school address"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            value={schoolProfile.phone}
                            onChange={(e) =>
                              setSchoolProfile({
                                ...schoolProfile,
                                phone: e.target.value,
                              })
                            }
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
                            onChange={(e) =>
                              setSchoolProfile({
                                ...schoolProfile,
                                email: e.target.value,
                              })
                            }
                            placeholder="info@school.edu"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="website">Website (Optional)</Label>
                          <Input
                            id="website"
                            value={schoolProfile.website}
                            onChange={(e) =>
                              setSchoolProfile({
                                ...schoolProfile,
                                website: e.target.value,
                              })
                            }
                            placeholder="https://www.school.edu"
                          />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="principal">
                            Principal/Head Teacher *
                          </Label>
                          <Input
                            id="principal"
                            value={schoolProfile.principalName}
                            onChange={(e) =>
                              setSchoolProfile({
                                ...schoolProfile,
                                principalName: e.target.value,
                              })
                            }
                            placeholder="Enter principal's name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="established">Year Established *</Label>
                          <Input
                            id="established"
                            value={schoolProfile.establishedYear}
                            onChange={(e) =>
                              setSchoolProfile({
                                ...schoolProfile,
                                establishedYear: e.target.value,
                              })
                            }
                            placeholder="2000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="type">School Type *</Label>
                          <Select
                            value={schoolProfile.type}
                            onValueChange={(value: any) =>
                              setSchoolProfile({ ...schoolProfile, type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primary">
                                Primary School
                              </SelectItem>
                              <SelectItem value="secondary">
                                Secondary School
                              </SelectItem>
                              <SelectItem value="mixed">
                                Mixed (Primary & Secondary)
                              </SelectItem>
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
                          onChange={(e) =>
                            setSchoolProfile({
                              ...schoolProfile,
                              motto: e.target.value,
                            })
                          }
                          placeholder="Enter school motto"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">School Description</Label>
                        <Textarea
                          id="description"
                          value={schoolProfile.description}
                          onChange={(e) =>
                            setSchoolProfile({
                              ...schoolProfile,
                              description: e.target.value,
                            })
                          }
                          placeholder="Brief description of the school..."
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={saveSchoolProfile}
                        style={{ backgroundColor: schoolData.colorTheme }}
                      >
                        {profileSaved
                          ? "Update School Profile"
                          : "Save School Profile"}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Staff & Teachers Tab */}
              <TabsContent value="staff" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                {viewMode.staff === "form" ? (
                  <TeacherForm
                    onSave={updateTeacher}
                    onCancel={() =>
                      setViewMode((prev) => ({ ...prev, staff: "list" }))
                    }
                  />
                ) : editingItem ? (
                  <TeacherForm
                    teacher={editingItem}
                    onSave={updateTeacher}
                    onCancel={() => {
                      setEditingItem(null);
                      setViewMode((prev) => ({ ...prev, staff: "list" }));
                    }}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Teachers ({teachers.length})
                        <Button
                          onClick={() =>
                            setViewMode((prev) => ({ ...prev, staff: "form" }))
                          }
                          style={{ backgroundColor: schoolData.colorTheme }}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Teacher
                        </Button>
                      </CardTitle>
                      <CardDescription>
                        Manage your school's teaching staff
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {teachers.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">
                            No teachers added yet. Click "Add Teacher" to get
                            started.
                          </p>
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
                                  <TableCell className="font-medium">
                                    {teacher.name}
                                  </TableCell>
                                  <TableCell>{teacher.email}</TableCell>
                                  <TableCell>{teacher.phone}</TableCell>
                                  <TableCell>
                                    {teacher.teacherProfile?.qualification || "-"}
                                  </TableCell>
                                  <TableCell>
                                    {teacher.teacherProfile?.dateJoined
                                      ? new Date(
                                          teacher.teacherProfile.dateJoined
                                        ).toLocaleDateString()
                                      : "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        teacher.status === "active"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {teacher.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setViewingItem(teacher)}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingItem(teacher)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete Teacher
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete{" "}
                                              {teacher.name}? This action cannot be
                                              undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                deleteTeacher(teacher.id)
                                              }
                                            >
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
                <Dialog
                  open={!!viewingItem}
                  onOpenChange={() => setViewingItem(null)}
                >
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Teacher Details</DialogTitle>
                      <DialogDescription>
                        Complete information for {viewingItem?.name}
                      </DialogDescription>
                    </DialogHeader>
                    {viewingItem && (
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Full Name
                            </Label>
                            <p className="text-sm">{viewingItem.name}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Employee ID
                            </Label>
                            <p className="text-sm">{viewingItem.employeeId}</p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Email
                            </Label>
                            <p className="text-sm">{viewingItem.email}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Phone
                            </Label>
                            <p className="text-sm">{viewingItem.phone}</p>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Qualification
                            </Label>
                            <p className="text-sm">
                              {viewingItem.teacherProfile?.qualification || "-"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-600">
                              Date Joined
                            </Label>
                            <p className="text-sm">
                              {viewingItem.teacherProfile?.dateJoined
                                ? new Date(
                                    viewingItem.teacherProfile.dateJoined
                                  ).toLocaleDateString()
                                : "-"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-600">
                            Status
                          </Label>
                          <Badge
                            variant={
                              viewingItem.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {viewingItem.status}
                          </Badge>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4 mt-6 justify-end">
                          <Button asChild variant="default">
                            <Link
                              href={`/schools/${
                                schoolData.schoolCode
                              }/teachers/login?email=${encodeURIComponent(
                                viewingItem.email
                              )}&password=${encodeURIComponent(
                                viewingItem.teacherProfile?.tempPassword || ""
                              )}`}
                            >
                              Go to Teacher Dashboard
                            </Link>
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={async () => {
                              await fetch(
                                `/api/schools/${schoolData.schoolCode}/teachers/${viewingItem.id}/send-credentials`,
                                { method: "POST" }
                              );
                              toast({
                                title: "Credentials sent (simulated)",
                                description: `Credentials sent to ${viewingItem.email}`,
                              });
                            }}
                          >
                            Simulate Send Credentials
                          </Button>
                        </div>
                      </div>
                    )}

                  </CardTitle>
                  <CardDescription>
                    {profileSaved
                      ? "Update your school's information and contact details"
                      : "Complete your school's basic information and contact details"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">School Address *</Label>
                      <Textarea
                        id="address"
                        value={schoolProfile.address}
                        onChange={(e) =>
                          setSchoolProfile({
                            ...schoolProfile,
                            address: e.target.value,
                          })
                        }
                        placeholder="Enter school address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        value={schoolProfile.phone}
                        onChange={(e) =>
                          setSchoolProfile({
                            ...schoolProfile,
                            phone: e.target.value,
                          })
                        }
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
                        onChange={(e) =>
                          setSchoolProfile({
                            ...schoolProfile,
                            email: e.target.value,
                          })
                        }
                        placeholder="info@school.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website (Optional)</Label>
                      <Input
                        id="website"
                        value={schoolProfile.website}
                        onChange={(e) =>
                          setSchoolProfile({
                            ...schoolProfile,
                            website: e.target.value,
                          })
                        }
                        placeholder="https://www.school.edu"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="principal">
                        Principal/Head Teacher *
                      </Label>
                      <Input
                        id="principal"
                        value={schoolProfile.principalName}
                        onChange={(e) =>
                          setSchoolProfile({
                            ...schoolProfile,
                            principalName: e.target.value,
                          })
                        }
                        placeholder="Enter principal's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="established">Year Established *</Label>
                      <Input
                        id="established"
                        value={schoolProfile.establishedYear}
                        onChange={(e) =>
                          setSchoolProfile({
                            ...schoolProfile,
                            establishedYear: e.target.value,
                          })
                        }
                        placeholder="2000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type">School Type *</Label>
                      <Select
                        value={schoolProfile.type}
                        onValueChange={(value: any) =>
                          setSchoolProfile({ ...schoolProfile, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">
                            Primary School
                          </SelectItem>
                          <SelectItem value="secondary">
                            Secondary School
                          </SelectItem>
                          <SelectItem value="mixed">
                            Mixed (Primary & Secondary)
                          </SelectItem>
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
                      onChange={(e) =>
                        setSchoolProfile({
                          ...schoolProfile,
                          motto: e.target.value,
                        })
                      }
                      placeholder="Enter school motto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">School Description</Label>
                    <Textarea
                      id="description"
                      value={schoolProfile.description}
                      onChange={(e) =>
                        setSchoolProfile({
                          ...schoolProfile,
                          description: e.target.value,
                        })
                      }
                      placeholder="Brief description of the school..."
                      rows={4}
                    />
                  </div>
                  <Button
                    onClick={saveSchoolProfile}
                    style={{ backgroundColor: schoolData.colorTheme }}
                  >
                    {profileSaved
                      ? "Update School Profile"
                      : "Save School Profile"}
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
                onCancel={() =>
                  setViewMode((prev) => ({ ...prev, staff: "list" }))
                }
              />
            ) : editingItem ? (
              editingItem.role === 'bursar' ? (
                <BursarForm
                  bursar={editingItem}
                  onSave={updateBursar}
                  onCancel={() => {
                    setEditingItem(null);
                    setViewMode((prev) => ({ ...prev, staff: "list" }));
                  }}
                />
              ) : (
                <TeacherForm
                  teacher={editingItem}
                  onSave={updateTeacher}
                  onCancel={() => {
                    setEditingItem(null);
                    setViewMode((prev) => ({ ...prev, staff: "list" }));
                  }}
                />
              )
            ) : (
              <>
                {/* Teachers Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Teachers ({teachers.length})
                      <Button
                        onClick={() =>
                          setViewMode((prev) => ({ ...prev, staff: "form" }))
                        }
                        style={{ backgroundColor: schoolData.colorTheme }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Teacher
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Manage your school's teaching staff
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {teachers.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          No teachers added yet. Click "Add Teacher" to get
                          started.
                        </p>
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
                                <TableCell className="font-medium">
                                  {teacher.name}
                                </TableCell>
                                <TableCell>{teacher.email}</TableCell>
                                <TableCell>{teacher.phone}</TableCell>
                                <TableCell>
                                  {teacher.teacherProfile?.qualification || "-"}
                                </TableCell>
                                <TableCell>
                                  {teacher.teacherProfile?.dateJoined
                                    ? new Date(
                                        teacher.teacherProfile.dateJoined
                                      ).toLocaleDateString()
                                    : "-"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      teacher.status === "active"
=======
                  </DialogContent>
                </Dialog>
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                {viewMode.students === "form" ? (
                  <StudentForm
                    onSave={updateStudent}
                    onCancel={() =>
                      setViewMode((prev) => ({ ...prev, students: "list" }))
                    }
                  />
                ) : editingItem ? (
                  <StudentForm
                    student={editingItem}
                    onSave={updateStudent}
                    onCancel={() => {
                      setEditingItem(null);
                      setViewMode((prev) => ({ ...prev, students: "list" }));
                    }}
                  />
                ) : (
                  <Card className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border-0 px-2 py-2 md:px-8 md:py-6">
                    <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                      <CardTitle className="flex items-center justify-between text-base md:text-lg">
                        <span>Students ({students.length})</span>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => setShowBulkImportDialog(true)}
                            variant="outline"
                            className="w-full md:w-auto py-3 md:py-2 text-base md:text-sm rounded-xl md:rounded-lg"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Import CSV/Excel
                          </Button>
                          <Button
                            onClick={() =>
                              setViewMode((prev) => ({ ...prev, students: "form" }))
                            }
                            style={{ backgroundColor: schoolData.colorTheme }}
                            className="w-full md:w-auto py-3 md:py-2 text-base md:text-sm rounded-xl md:rounded-lg"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Student
                          </Button>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        Manage your school's student records
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                        <Input
                          type="text"
                          placeholder="Search students..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="md:w-1/3"
                        />
                        <Select
                          value={studentClassFilter}
                          onValueChange={setStudentClassFilter}
                        >
                          <SelectTrigger className="md:w-48">
                            <SelectValue placeholder="Filter by class" />
                          </SelectTrigger>
                          <SelectContent>
                            {classOptions.map((cls) => (
                              <SelectItem key={cls} value={cls}>
                                {cls}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {filteredStudents.length === 0 ? (
                        <div className="text-center py-8">
                          <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">
                            No students found. Try adjusting your search or filter.
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table className="hidden md:table">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Admission No.</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Parent Name</TableHead>
                                <TableHead>Parent Phone</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredStudents.map((student) => (
                                <TableRow
                                  key={student.id}
                                  className="hover:bg-blue-50/30 transition-colors duration-200"
                                >
                                  <TableCell className="font-medium">
                                    {student.name}
                                  </TableCell>
                                  <TableCell>{student.admissionNumber}</TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {student.className || (
                                      <span className="text-red-500">Missing</span>
                                    )}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {student.gradeName || (
                                      <span className="text-red-500">Missing</span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    {student.parentName || "N/A"}
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">
                                    {student.parentPhone || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        student.status === "active"
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {student.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setViewingItem(student)}
                                        className="hover:bg-blue-100 active:scale-95"
                                      >
                                        View Details
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingItem(student)}
                                        className="hover:bg-green-100 active:scale-95"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:bg-red-100 active:scale-95"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete Student
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete{" "}
                                              {student.name}? This action cannot be
                                              undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                deleteStudent(student.id)
                                              }
                                            >
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
                            {filteredStudents.map((student) => (
                              <div
                                key={student.id}
                                className="bg-white/90 rounded-xl shadow-md p-4 flex flex-col gap-2 border border-gray-100"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="font-bold text-lg text-gray-800">
                                    {student.name}
                                  </div>
                                  <Badge
                                    variant={
                                      student.status === "active"

                                        ? "default"
                                        : "secondary"
                                    }
                                  >

                                    {teacher.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setViewingItem(teacher)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingItem(teacher)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Teacher
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete{" "}
                                            {teacher.name}? This action cannot be
                                            undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              deleteTeacher(teacher.id)
                                            }
                                          >
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

                {/* Bursars Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Bursars ({bursars.length})
                      <Button
                        onClick={() =>
                          setViewMode((prev) => ({ ...prev, staff: "bursar-form" }))
                        }
                        style={{ backgroundColor: schoolData.colorTheme }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Bursar
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Manage your school's financial staff
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bursars.length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">
                          No bursars added yet. Click "Add Bursar" to get
                          started.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bursars.map((bursar) => (
                              <TableRow key={bursar.id}>
                                <TableCell className="font-medium">
                                  {bursar.name}
                                </TableCell>
                                <TableCell>{bursar.email}</TableCell>
                                <TableCell>{bursar.phone || "-"}</TableCell>
                                <TableCell>
                                  <Badge variant="default">
                                    Active
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setViewingItem(bursar)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingItem(bursar)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Bursar
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete{" "}
                                            {bursar.name}? This action cannot be
                                            undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              bursar.role === 'bursar' ? deleteBursar(bursar.id) : deleteTeacher(bursar.id)
                                            }
                                          >
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
              </>
            )}

            {/* Bursar Form Modal */}
            {viewMode.staff === "bursar-form" && (
              <Dialog
                open={viewMode.staff === "bursar-form"}
                onOpenChange={() =>
                  setViewMode((prev) => ({ ...prev, staff: "list" }))
                }
              >
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Bursar</DialogTitle>
                    <DialogDescription>
                      Create a new bursar account for your school
                    </DialogDescription>
                  </DialogHeader>
                  <BursarForm
                    onSave={createBursar}
                    onCancel={() =>
                      setViewMode((prev) => ({ ...prev, staff: "list" }))
                    }
                  />
                </DialogContent>
              </Dialog>
            )}

            {/* Staff View Dialog */}
            <Dialog
              open={!!viewingItem}
              onOpenChange={() => setViewingItem(null)}
            >
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {viewingItem?.role === 'bursar' ? 'Bursar Details' : 'Teacher Details'}
                  </DialogTitle>
                  <DialogDescription>
                    Complete information for {viewingItem?.name}
                  </DialogDescription>
                </DialogHeader>
                {viewingItem && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Full Name
                        </Label>
                        <p className="text-sm">{viewingItem.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Employee ID
                        </Label>
                        <p className="text-sm">{viewingItem.employeeId}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Email
                        </Label>
                        <p className="text-sm">{viewingItem.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Phone
                        </Label>
                        <p className="text-sm">{viewingItem.phone}</p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Qualification
                        </Label>
                        <p className="text-sm">
                          {viewingItem.teacherProfile?.qualification || "-"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-600">
                          Date Joined
                        </Label>
                        <p className="text-sm">
                          {viewingItem.teacherProfile?.dateJoined
                            ? new Date(
                                viewingItem.teacherProfile.dateJoined
                              ).toLocaleDateString()
                            : "-"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">
                        Status
                      </Label>
                      <Badge
                        variant={
                          viewingItem.status === "active"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {viewingItem.status}
                      </Badge>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4 mt-6 justify-end">
                      <Button asChild variant="default">
                        <Link
                          href={`/schools/${
                            schoolData.schoolCode
                          }/${viewingItem.role === 'bursar' ? 'bursar' : 'teachers'}/login?email=${encodeURIComponent(
                            viewingItem.email
                          )}&password=${encodeURIComponent(
                            viewingItem.role === 'bursar' ? 'bursar123' : (viewingItem.teacherProfile?.tempPassword || "")
                          )}`}
                        >
                          Go to {viewingItem.role === 'bursar' ? 'Bursar' : 'Teacher'} Dashboard
                        </Link>
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={async () => {
                          const endpoint = viewingItem.role === 'bursar' 
                            ? `/api/schools/${schoolData.schoolCode}/bursars/${viewingItem.id}/send-credentials`
                            : `/api/schools/${schoolData.schoolCode}/teachers/${viewingItem.id}/send-credentials`;
                          
                          await fetch(endpoint, { method: "POST" });
                          toast({
                            title: "Credentials sent (simulated)",
                            description: `Credentials sent to ${viewingItem.email}`,
                          });
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
                onCancel={() =>
                  setViewMode((prev) => ({ ...prev, students: "list" }))
                }
              />
            ) : editingItem ? (
              <StudentForm
                student={editingItem}
                onSave={updateStudent}
                onCancel={() => {
                  setEditingItem(null);
                  setViewMode((prev) => ({ ...prev, students: "list" }));
                }}
              />
            ) : (
              <Card className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border-0 px-2 py-2 md:px-8 md:py-6">
                <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                  <CardTitle className="flex items-center justify-between text-base md:text-lg">
                    <span>Students ({students.length})</span>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowBulkImportDialog(true)}
                        variant="outline"
                        className="w-full md:w-auto py-3 md:py-2 text-base md:text-sm rounded-xl md:rounded-lg"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import CSV/Excel
                      </Button>
                      <Button
                        onClick={() =>
                          setViewMode((prev) => ({ ...prev, students: "form" }))
                        }
                        style={{ backgroundColor: schoolData.colorTheme }}
                        className="w-full md:w-auto py-3 md:py-2 text-base md:text-sm rounded-xl md:rounded-lg"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Student
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Manage your school's student records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                    <Input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="md:w-1/3"
                    />
                    <Select
                      value={studentClassFilter}
                      onValueChange={setStudentClassFilter}
                    >
                      <SelectTrigger className="md:w-48">
                        <SelectValue placeholder="Filter by class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classOptions.map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-8">
                      <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No students found. Try adjusting your search or filter.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="hidden md:table">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Admission No.</TableHead>
                            <TableHead>Class</TableHead>
                            <TableHead>Grade</TableHead>
                            <TableHead>Parent Name</TableHead>
                            <TableHead>Parent Phone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student) => (
                            <TableRow
                              key={student.id}
                              className="hover:bg-blue-50/30 transition-colors duration-200"
                            >
                              <TableCell className="font-medium">
                                {student.name}
                              </TableCell>
                              <TableCell>{student.admissionNumber}</TableCell>
                              <TableCell className="whitespace-nowrap">
                                {student.className || (
                                  <span className="text-red-500">Missing</span>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {student.gradeName || (
                                  <span className="text-red-500">Missing</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {student.parentName || "N/A"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {student.parentPhone || "N/A"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    student.status === "active"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {student.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">

                                    {student.status}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                  <span>Adm: {student.admissionNumber}</span>
                                  <span>Class: {student.className || "N/A"}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                  <span>Parent: {student.parentName || "N/A"}</span>
                                  <span>Phone: {student.parentPhone || "N/A"}</span>
                                </div>
                                <div className="flex gap-2 pt-2">

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewingItem(student)}
                                    className="flex-1 active:scale-95"
                                  >
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingItem(student)}
                                    className="flex-1 active:scale-95"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-red-600 active:scale-95"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="max-w-full px-2">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          Delete Student
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete{" "}
                                          {student.name}? This action cannot be
                                          undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => deleteStudent(student.id)}
                                        >
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
                <Dialog
                  open={!!viewingItem && activeTab === "students"}
                  onOpenChange={() => setViewingItem(null)}
                >
                  <DialogContent className="max-w-full md:max-w-4xl px-2 py-4 rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-lg md:text-2xl">
                        Student Details
                      </DialogTitle>
                      <DialogDescription>
                        Complete information for {viewingItem?.name}
                      </DialogDescription>
                    </DialogHeader>
                    {viewingItem && (
                      <div className="space-y-4 text-base md:text-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Full Name
                            </Label>
                            <p className="text-gray-800">{viewingItem.name}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Admission Number
                            </Label>
                            <p className="text-gray-800">
                              {viewingItem.admissionNumber}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Class
                            </Label>
                            <p className="text-gray-800">
                              {viewingItem.classId || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Date of Birth
                            </Label>
                            <p className="text-gray-800">
                              {viewingItem.dateOfBirth}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Gender
                            </Label>
                            <p className="text-gray-800">{viewingItem.gender}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Date Admitted
                            </Label>
                            <p className="text-gray-800">
                              {viewingItem.dateAdmitted}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Student Email
                            </Label>
                            <p className="text-gray-800">
                              {viewingItem.email || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Student Phone
                            </Label>
                            <p className="text-gray-800">
                              {viewingItem.phone || "Not provided"}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Parent Name
                            </Label>
                            <p className="text-gray-800">
                              {viewingItem.parentName || "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Parent Phone
                            </Label>
                            <p className="text-gray-800">
                              {viewingItem.parentPhone || "N/A"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-gray-600">
                              Parent Email
                            </Label>
                            <p className="text-gray-800">
                              {viewingItem.parentEmail || "Not provided"}
                            </p>
                          </div>
                        </div>
                        {viewingItem.parent && (
                          <div className="space-y-2 mt-4">
                            <div className="font-bold">
                              Parent Login Credentials
                            </div>
                            <div>
                              <strong>Email:</strong> {viewingItem.parent.email}
                            </div>
                            <div>
                              <strong>Temporary Password:</strong>{" "}
                              {viewingItem.parent.tempPassword || "N/A"}
                            </div>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Home Address
                          </Label>
                          <p className="text-gray-800">
                            {viewingItem.address || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-gray-600">
                            Status
                          </Label>
                          <Badge
                            variant={
                              viewingItem.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
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
              <TabsContent value="subjects" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Subjects Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        Subjects ({subjects.length})
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              style={{ backgroundColor: schoolData.colorTheme }}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Subject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Subject</DialogTitle>
                              <DialogDescription>
                                Create a new subject for your school
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Subject Name *</Label>
                                <Input
                                  value={newSubject.name || ""}
                                  onChange={(e) =>
                                    setNewSubject({
                                      ...newSubject,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Mathematics"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Subject Code *</Label>
                                <Input
                                  value={newSubject.code || ""}
                                  onChange={(e) =>
                                    setNewSubject({
                                      ...newSubject,
                                      code: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., MATH101"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Assigned Teacher</Label>
                                <Select
                                  value={newSubject.teacherId || ""}
                                  onValueChange={(value) =>
                                    setNewSubject({
                                      ...newSubject,
                                      teacherId: value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select teacher" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers.map((teacher) => (
                                      <SelectItem
                                        key={teacher.id}
                                        value={teacher.id}
                                      >
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
                                  onChange={(e) =>
                                    setNewSubject({
                                      ...newSubject,
                                      description: e.target.value,
                                    })
                                  }
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
                      <CardDescription>
                        Configure subjects taught in your school
                      </CardDescription>
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
                            <div
                              key={subject.id}
                              className="flex items-center justify-between p-3 border rounded-lg"
                            >
                              <div>
                                <h5 className="font-medium">{subject.name}</h5>
                                <p className="text-sm text-gray-600">
                                  {subject.code}
                                </p>
                                {subject.teacherId && (
                                  <p className="text-xs text-gray-500">
                                    Teacher:{" "}
                                    {
                                      teachers.find(
                                        (t) => t.id === subject.teacherId
                                      )?.name
                                    }
                                  </p>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingItem(subject)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Edit Subject</DialogTitle>
                                      <DialogDescription>
                                        Update subject information
                                      </DialogDescription>
                                    </DialogHeader>
                                    {editingItem && (
                                      <div className="space-y-4">
                                        <div className="space-y-2">
                                          <Label>Subject Name *</Label>
                                          <Input
                                            value={editingItem.name || ""}
                                            onChange={(e) =>
                                              setEditingItem({
                                                ...editingItem,
                                                name: e.target.value,
                                              })
                                            }
                                            placeholder="e.g., Mathematics"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Subject Code *</Label>
                                          <Input
                                            value={editingItem.code || ""}
                                            onChange={(e) =>
                                              setEditingItem({
                                                ...editingItem,
                                                code: e.target.value,
                                              })
                                            }
                                            placeholder="e.g., MATH101"
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Assigned Teacher</Label>
                                          <Select
                                            value={editingItem.teacherId || ""}
                                            onValueChange={(value) =>
                                              setEditingItem({
                                                ...editingItem,
                                                teacherId: value,
                                              })
                                            }
                                          >
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select teacher" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {teachers.map((teacher) => (
                                                <SelectItem
                                                  key={teacher.id}
                                                  value={teacher.id}
                                                >
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
                                              setEditingItem({
                                                ...editingItem,
                                                description: e.target.value,
                                              })
                                            }
                                            placeholder="Brief description of the subject"
                                            rows={2}
                                          />
                                        </div>
                                        <Button
                                          onClick={() => updateSubject(editingItem)}
                                          className="w-full"
                                          style={{
                                            backgroundColor: schoolData.colorTheme,
                                          }}
                                        >
                                          Update Subject
                                        </Button>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Subject
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete{" "}
                                        {subject.name}? This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteSubject(subject.id)}
                                      >
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
                            <Button
                              size="sm"
                              style={{ backgroundColor: schoolData.colorTheme }}
                              onClick={() =>
                                setNewClass({
                                  ...newClass,
                                  academicYear: new Date().getFullYear().toString(),
                                })
                              }
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add Class
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Class</DialogTitle>
                              <DialogDescription>
                                Create a new class for your school
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label>Class Name *</Label>
                                <Input
                                  value={newClass.name || ""}
                                  onChange={(e) =>
                                    setNewClass({
                                      ...newClass,
                                      name: e.target.value,
                                    })
                                  }
                                  placeholder="e.g., Grade 5A"
                                />
                              </div>

                     <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="class-grade" className="text-right">
                          Grade/Level
                          </Label>
                          <Select  
                          value={newClass.gradeId}
                          onValueChange={(value) =>
                             setNewClass({ ...newClass, gradeId: value })
    }
  >
    <SelectTrigger className="col-span-3">
      <SelectValue placeholder="Select a grade" />
    </SelectTrigger>
    <SelectContent>
      {grades.map((grade) => (
        <SelectItem key={grade.id} value={grade.id}>
          {grade.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
                        
                         
                          <div className="space-y-2">
                            <Label>Level *</Label>
                            <Select
                              value={newClass.level || ""}
                              onValueChange={(value) =>
                                setNewClass({ ...newClass, level: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Primary">Primary</SelectItem>
                                <SelectItem value="Secondary">
                                  Secondary
                                </SelectItem>
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
                                setNewClass({
                                  ...newClass,
                                  capacity:
                                    Number.parseInt(e.target.value) || 0,
                                })
                              }
                              placeholder="30"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Class Teacher</Label>
                            <Select
                              value={newClass.classTeacherId || ""}
                              onValueChange={(value) =>
                                setNewClass({
                                  ...newClass,
                                  classTeacherId: value,
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select class teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem
                                    key={teacher.id}
                                    value={teacher.id}
                                  >
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Academic Year *</Label>
                            <Input
                              type="number"
                              value={
                                newClass.academicYear ||
                                new Date().getFullYear().toString()
                              }
                              onChange={(e) =>
                                setNewClass({
                                  ...newClass,
                                  academicYear: e.target.value,
                                })
                              }
                              placeholder="e.g., 2024"
                            />
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
                  <CardDescription>
                    Set up classes and their structure
                  </CardDescription>
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
                        <div
                          key={cls.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <h5 className="font-medium">{cls.name}</h5>
                            <p className="text-sm text-gray-600">
                              {cls.level} - Capacity: {cls.capacity}
                            </p>
                            {cls.classTeacherId && (
                              <p className="text-xs text-gray-500">
                                Teacher:{" "}
                                {
                                  teachers.find(
                                    (t) => t.id === cls.classTeacherId
                                  )?.name
                                }
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingItem(cls)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingItem(cls)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Class</DialogTitle>
                                  <DialogDescription>
                                    Update class information
                                  </DialogDescription>
                                </DialogHeader>
                                {editingItem && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Class Name *</Label>
                            <Input
                                        value={editingItem.name || ""}
                                        onChange={(e) =>
                                          setEditingItem({
                                            ...editingItem,
                                            name: e.target.value,
                                          })
                                        }
                                        placeholder="e.g., Grade 5A"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Level *</Label>
                                      <Select
                                        value={editingItem.level || ""}
                                        onValueChange={(value) =>
                                          setEditingItem({
                                            ...editingItem,
                                            level: value,
                                          })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Primary">
                                            Primary
                                          </SelectItem>
                                          <SelectItem value="Secondary">
                                            Secondary
                                          </SelectItem>
                                          <SelectItem value="College">
                                            College
                                          </SelectItem>
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
                                  capacity:
                                              Number.parseInt(e.target.value) ||
                                              0,
                                })
                              }
                              placeholder="30"
                            />
                          </div>
                                    <div className="space-y-2">
                                      <Label>Class Teacher</Label>
                            <Select
                                        value={editingItem.classTeacherId || ""}
                              onValueChange={(value) =>
                                          setEditingItem({
                                            ...editingItem,
                                  classTeacherId: value,
                                })
                              }
                            >
                                        <SelectTrigger>
                                <SelectValue placeholder="Select class teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {teachers.map((teacher) => (
                                  <SelectItem
                                    key={teacher.id}
                                    value={teacher.id}
                                  >
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                                    <Button
                                      onClick={() => updateClass(editingItem)}
                                      className="w-full"
                                      style={{
                                        backgroundColor: schoolData.colorTheme,
                                      }}
                                    >
                                      Update Class
                                    </Button>
                        </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                          <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Class
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete {cls.name}?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteClass(cls.id)}
                                  >
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
            </div>
          </TabsContent>

          {/* Fee Management Tab */}
          <TabsContent value="fees" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
            <FeeManagement
              schoolCode={schoolData.schoolCode}
              colorTheme={schoolData.colorTheme}
              onGoBack={() => setActiveTab("overview")}
              onFeeStructureCreated={() => {
                // Update the fee management step as completed
                setSetupSteps((prev) =>
                  prev.map((step) =>
                    step.id === "fees" ? { ...step, completed: true } : step
                  )
                );
              }}
            />
          </TabsContent>

          {/* Promotions Tab */}
          <TabsContent value="promotions" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
            <Card className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border-0 px-2 py-2 md:px-8 md:py-6">
              <CardHeader className="px-2 py-2 md:px-6 md:py-4">
                <CardTitle className="flex items-center justify-between text-base md:text-lg">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5" />
                    Student Promotion Management
                  </span>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Link
                      href={`/schools/${schoolData.schoolCode}/admin/promotions`}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Manage Promotions
                    </Link>
                  </Button>
                </CardTitle>
                <CardDescription>
                  Manage bulk student promotions with individual exclusions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {students.length}
                          </p>
                          <p className="text-sm text-gray-600">
                            Total Students
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {
                              students.filter((s) => s.status === "active")
                                .length
                            }
                          </p>
                          <p className="text-sm text-gray-600">
                            Active Students
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Card className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">
                            {new Set(students.map((s) => s.className)).size}
                          </p>
                          <p className="text-sm text-gray-600">Class Levels</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      asChild
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Link
                        href={`/schools/${schoolData.schoolCode}/admin/promotions`}
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Manage Promotions
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("students")}
                    >
                      <Users className="w-4 h-4 mr-2" />
                      View All Students
                    </Button>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">
                      Recent Promotion Activity
                    </h3>
                    <div className="space-y-2">
                      <p className="text-gray-600">
                        No recent promotion activity
                      </p>
                      <p className="text-sm text-gray-500">
                        Promotion history will appear here once you start
                        managing promotions.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">
                      How Bulk Promotion Works
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Select a class to promote students from</li>
                      <li>• Review all eligible students automatically</li>
                      <li>• Exclude individual students with reasons</li>
                      <li>• Confirm and execute bulk promotion</li>
                      <li>• Track promotion history and exclusions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Calendar Tab */}
          <TabsContent value="academic-calendar" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
            <AcademicCalendarCrud schoolCode={schoolData.schoolCode} />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
            {/* Admission Number Settings UI (moved from admin/settings/page.tsx) */}
            <AdmissionNumberSettings schoolCode={schoolData.schoolCode} />
          </TabsContent>
        </Tabs>
        </section>
      </main>
      </div>


      {/* Class View Dialog */}
      <Dialog
        open={!!viewingItem && activeTab === "subjects"}
        onOpenChange={() => setViewingItem(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <School className="w-5 h-5 text-blue-600" />
              Class Details
            </DialogTitle>
            <DialogDescription>
              Complete information for {viewingItem?.name}
            </DialogDescription>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-6">
              {/* Class Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    Class Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Class Name:</span>
                      <span className="font-medium">{viewingItem.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Level:</span>
                      <span className="font-medium">{viewingItem.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Academic Year:</span>
                      <span className="font-medium">
                        {viewingItem.academicYear}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge
                        variant={viewingItem.isActive ? "default" : "secondary"}
                      >
                        {viewingItem.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">
                    Student Statistics
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Students:</span>
                      <span className="font-medium text-green-700">
                        {
                          students.filter((s) => s.classId === viewingItem.id)
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-medium">
                        {viewingItem.capacity || "Unlimited"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available Spots:</span>
                      <span className="font-medium text-blue-700">
                        {viewingItem.capacity
                          ? Math.max(
                              0,
                              viewingItem.capacity -
                                students.filter(
                                  (s) => s.classId === viewingItem.id
                                ).length
                            )
                          : "Unlimited"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Utilization:</span>
                      <span className="font-medium">
                        {viewingItem.capacity
                          ? `${Math.round(
                              (students.filter(
                                (s) => s.classId === viewingItem.id
                              ).length /
                                viewingItem.capacity) *
                                100
                            )}%`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-900 mb-2">
                    Class Teacher
                  </h4>
                  <div className="space-y-2 text-sm">
                    {viewingItem.classTeacherId ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Teacher:</span>
                          <span className="font-medium">
                            {viewingItem.teacher?.name ||
                              teachers.find(
                                (t) => t.id === viewingItem.classTeacherId
                              )?.name ||
                              "Unknown"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium text-purple-700">
                            {viewingItem.teacher?.email ||
                              teachers.find(
                                (t) => t.id === viewingItem.classTeacherId
                              )?.email ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">
                            {viewingItem.teacher?.phone ||
                              teachers.find(
                                (t) => t.id === viewingItem.classTeacherId
                              )?.phone ||
                              "N/A"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-gray-500 py-2">
                        <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p>No teacher assigned</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Students List */}
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    Students in {viewingItem.name}
                    <Badge variant="outline" className="ml-2">
                      {
                        students.filter((s) => s.classId === viewingItem.id)
                          .length
                      }{" "}
                      students
                    </Badge>
                  </h4>
                </div>
                <div className="p-4">
                  {students.filter((s) => s.classId === viewingItem.id)
                    .length === 0 ? (
                    <div className="text-center py-8">
                      <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">
                        No students assigned to this class yet.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Students will appear here when they are assigned to this
                        class.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Admission No.</TableHead>
                            <TableHead>Parent Name</TableHead>
                            <TableHead>Parent Phone</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students
                            .filter((s) => s.classId === viewingItem.id)
                            .map((student) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-medium">
                                  {student.name}
                                </TableCell>
                                <TableCell>{student.admissionNumber}</TableCell>
                                <TableCell>
                                  {student.parentName || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {student.parentPhone || "N/A"}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      student.status === "active"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {student.status}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingItem(null);
                    setActiveTab("students");
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage Students
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingItem(viewingItem)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Class
                </Button>
                <Button onClick={() => setViewingItem(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add a modal/dialog to show credentials after adding a teacher */}
      <Dialog
        open={showTeacherCredentials}
        onOpenChange={setShowTeacherCredentials}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Credentials</DialogTitle>
            <DialogDescription>
              Share these credentials with the teacher. They will use them to
              log in for the first time.
            </DialogDescription>
          </DialogHeader>
          {lastTeacherCredentials && (
            <div className="space-y-2">
              <div>
                <strong>Email:</strong> {lastTeacherCredentials.email}
              </div>
              <div>
                <strong>Temporary Password:</strong>{" "}
                {lastTeacherCredentials.tempPassword}
              </div>
            </div>
          )}
          <Button
            onClick={() => setShowTeacherCredentials(false)}
            className="mt-4"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>

      {/* Add a modal/dialog to show credentials after adding a bursar */}
      <Dialog
        open={showBursarCredentials}
        onOpenChange={setShowBursarCredentials}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bursar Login Credentials</DialogTitle>
            <DialogDescription>
              Share these credentials with the bursar for their first login.
              <br />
              <span className="text-blue-700 font-semibold">
                Default password for all new bursars is <b>bursar123</b>.
              </span>
            </DialogDescription>
          </DialogHeader>
          {lastBursarCredentials && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <strong>Email:</strong>
                  <span className="font-mono">
                    {lastBursarCredentials.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <strong>Password:</strong>
                  <span className="font-mono text-blue-700">
                    {lastBursarCredentials.tempPassword}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Link
                    href={`/schools/${encodeURIComponent(
                      schoolData.schoolCode
                    )}/bursar/login?email=${encodeURIComponent(
                      lastBursarCredentials.email
                    )}&password=${encodeURIComponent(
                      lastBursarCredentials.tempPassword
                    )}`}
                  >
                    🚀 Quick Login (Auto-fill)
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const credentials = `Email: ${lastBursarCredentials.email}\nPassword: ${lastBursarCredentials.tempPassword}`;
                    navigator.clipboard.writeText(credentials);
                    toast({
                      title: "Copied!",
                      description: "Credentials copied to clipboard",
                      variant: "default",
                    });
                  }}
                >
                  📋 Copy Credentials
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link
                    href={`/schools/${schoolData.schoolCode}/bursar/login`}
                  >
                    📝 Manual Login
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                💡 Tip: Use "Quick Login" to automatically fill the login form
                with these credentials
                <br />
                <span className="text-orange-600">
                  ⚠️ Note: Credentials are only shown immediately after creation
                  for security reasons
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Credentials Modal */}
      <Dialog
        open={showStudentCredentials}
        onOpenChange={setShowStudentCredentials}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Student Login Credentials</DialogTitle>
            <DialogDescription>
              Share these credentials with the student for their first login.
              <br />
              <span className="text-blue-700 font-semibold">
                Default password for all new students is <b>student123</b>.
              </span>
            </DialogDescription>
          </DialogHeader>
          {lastStudentCredentials && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <strong>Admission Number:</strong>
                  <span className="font-mono">
                    {lastStudentCredentials.admissionNumber}
                  </span>
                </div>
                {lastStudentCredentials.email && (
                  <div className="flex justify-between items-center">
                    <strong>Email:</strong>
                    <span className="font-mono">
                      {lastStudentCredentials.email}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <strong>Password:</strong>
                  <span className="font-mono text-blue-700">student123</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Link
                    href={`/schools/${encodeURIComponent(
                      schoolData.schoolCode
                    )}/students/login?admissionNumber=${encodeURIComponent(
                      lastStudentCredentials.admissionNumber
                    )}&email=${encodeURIComponent(
                      lastStudentCredentials.email || ""
                    )}&password=${encodeURIComponent(
                      lastStudentCredentials.tempPassword
                    )}`}
                  >
                    🚀 Quick Login (Auto-fill)
                  </Link>
                </Button>
                <Button
                  variant="outline"
                            className="w-full"
                  onClick={() => {
                    const credentials = `Admission Number: ${
                      lastStudentCredentials.admissionNumber
                    }\nEmail: ${
                      lastStudentCredentials.email || "N/A"
                    }\nPassword: ${lastStudentCredentials.tempPassword}`;
                    navigator.clipboard.writeText(credentials);
                    toast({
                      title: "Copied!",
                      description: "Credentials copied to clipboard",
                      variant: "default",
                    });
                  }}
                >
                  📋 Copy Credentials
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link
                    href={`/schools/${schoolData.schoolCode}/students/login`}
                  >
                    📝 Manual Login
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                💡 Tip: Use "Quick Login" to automatically fill the login form
                with these credentials
                <br />
                <span className="text-orange-600">
                  ⚠️ Note: Credentials are only shown immediately after creation
                  for security reasons
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Parent Credentials Modal */}
      <Dialog
        open={showParentCredentials}
        onOpenChange={setShowParentCredentials}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-700">
              Parent Login Credentials
            </DialogTitle>
            <DialogDescription>
              Share these credentials with the parent for their first login.
              <br />
              <span className="text-blue-700 font-semibold">
                Default password for all new parents is <b>parent123</b>.
              </span>
            </DialogDescription>
          </DialogHeader>
          {lastParentCredentials && (
            <div className="space-y-4">
              <div className="bg-gray-100 rounded p-4 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <b>Admission Number:</b>
                  <span className="font-mono">
                    {lastParentCredentials.admissionNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <b>Parent Phone:</b>
                  <span className="font-mono">
                    {lastParentCredentials.parentPhone}
                  </span>
                </div>
                {lastParentCredentials.parentEmail && (
                  <div className="flex justify-between">
                    <b>Parent Email:</b>
                    <span className="font-mono">
                      {lastParentCredentials.parentEmail}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <b>Password:</b>
                  <span className="font-mono text-blue-700">parent123</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    console.log(
                      "Parent credentials debug:",
                      lastParentCredentials
                    );
                    const url = `/schools/${
                      schoolData.schoolCode
                    }/parent/login?phone=${encodeURIComponent(
                      lastParentCredentials.parentPhone
                    )}&password=${encodeURIComponent(
                      lastParentCredentials.tempPassword
                    )}`;
                    console.log("Generated URL:", url);
                    console.log(
                      "Phone value:",
                      lastParentCredentials.parentPhone
                    );
                    console.log(
                      "Password value:",
                      lastParentCredentials.tempPassword
                    );
                  }}
                >
                  🔍 Debug Parent Credentials
                </Button>
                <Button
                  asChild
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Link
                    href={`/schools/${
                      schoolData.schoolCode
                    }/parent/login?phone=${encodeURIComponent(
                      lastParentCredentials.parentPhone
                    )}&password=${encodeURIComponent(
                      lastParentCredentials.tempPassword
                    )}`}
                  >
                    🚀 Quick Parent Login (Auto-fill)
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    console.log(
                      "Parent credentials for copy:",
                      lastParentCredentials
                    );
                    const credentials = `Admission Number: ${
                      lastParentCredentials.admissionNumber
                    }\nParent Phone: ${
                      lastParentCredentials.parentPhone
                    }\nParent Email: ${
                      lastParentCredentials.parentEmail || "N/A"
                    }\nPassword: ${lastParentCredentials.tempPassword}`;
                    navigator.clipboard.writeText(credentials);
                    toast({
                      title: "Copied!",
                      description: "Parent credentials copied to clipboard",
                      variant: "default",
                    });
                  }}
                >
                  📋 Copy Parent Credentials
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/schools/${schoolData.schoolCode}/parent/login`}>
                    📝 Manual Parent Login
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link
                    href={`/schools/${schoolData.schoolCode}/students/login`}
                  >
                    📚 Go to Student Login
                  </Link>
                </Button>
              </div>

              <div className="text-xs text-gray-500 text-center">
                💡 Tip: Use "Quick Parent Login" to automatically fill the
                parent login form
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog
        open={showBulkImportDialog}
        onOpenChange={setShowBulkImportDialog}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Import Students</DialogTitle>
            <DialogDescription>
              Import multiple students from a CSV or Excel file
            </DialogDescription>
          </DialogHeader>

          {importStep === "upload" && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload CSV or Excel File
                </h3>
                <p className="text-gray-600 mb-4">
                  Supported formats: .csv, .xlsx, .xls
                </p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      parseFile(file);
                    }
                  }}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Choose File
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">
                  Required Columns:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>• name (Student Name)</div>
                  <div>• email (Student Email)</div>
                  <div>• parentName (Parent Name)</div>
                  <div>• parentPhone (Parent Phone)</div>
                  <div>• className (Class Name)</div>
                  <div>• gradeName (Grade Name)</div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                  Other columns: phone, parentEmail, dateOfBirth, dateAdmitted,
                  address, gender, status
                </div>
                <div className="mt-2 text-xs text-orange-600">
                  Note: Use className and gradeName instead of classId. Example:
                  className="Grade 1A", gradeName="Grade 1"
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={resetImportDialog}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {importStep === "preview" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  Preview ({parsedStudents.length} students)
                </h3>
                <Button
                  variant="outline"
                  onClick={() => setImportStep("upload")}
                >
                  Back to Upload
                </Button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Parent Name</TableHead>
                      <TableHead>Parent Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedStudents.map((student, index) => {
                      const classObj = classes.find(
                        (cls) => cls.name === student.className
                      );
                      const gradeObj =
                        classObj &&
                        grades.find((g) => g.id === classObj.gradeId);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {student.name || (
                              <span className="text-red-500">Missing</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.email || (
                              <span className="text-red-500">Missing</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.className || (
                              <span className="text-red-500">Missing</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {gradeObj ? (
                              gradeObj.name
                            ) : (
                              <span className="text-gray-400">Unknown</span>
                            )}
                          </TableCell>
                          <TableCell>{student.parentName || "N/A"}</TableCell>
                          <TableCell>{student.parentPhone || "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.name &&
                                student.email &&
                                student.className &&
                                student.parentName &&
                                student.parentPhone
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {student.name &&
                              student.email &&
                              student.className &&
                              student.parentName &&
                              student.parentPhone
                                ? "Valid"
                                : "Invalid"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {
                    parsedStudents.filter(
                      (s) =>
                        s.name &&
                        s.email &&
                        s.className &&
                        s.parentName &&
                        s.parentPhone
                    ).length
                  }{" "}
                  of {parsedStudents.length} students are valid
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setImportStep("upload")}
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => bulkImportStudents(parsedStudents)}
                    disabled={
                      isImporting ||
                      parsedStudents.filter(
                        (s) =>
                          s.name &&
                          s.email &&
                          s.className &&
                          s.parentName &&
                          s.parentPhone
                      ).length === 0
                    }
                            style={{ backgroundColor: schoolData.colorTheme }}
                          >
                    {isImporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Importing...
                      </>
                    ) : (
                      "Import Students"
                    )}
                          </Button>
                </div>
              </div>
            </div>
          )}

          {importStep === "results" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Import Results</h3>
                <Button variant="outline" onClick={resetImportDialog}>
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {importResults.filter((r) => r.status === "success").length}
                  </div>
                  <div className="text-sm text-green-700">
                    Successfully Imported
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {importResults.filter((r) => r.status === "error").length}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {importResults.length}
                  </div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
              </div>

              {importResults.filter((r) => r.status === "error").length > 0 && (
                <div className="max-h-64 overflow-y-auto">
                  <h4 className="font-medium text-red-900 mb-2">
                    Failed Imports:
                  </h4>
                  <div className="space-y-2">
                    {importResults
                      .filter((r) => r.status === "error")
                      .map((result, index) => (
                        <div key={index} className="bg-red-50 p-3 rounded-lg">
                          <div className="font-medium text-red-900">
                            {result.admissionNumber || "Unknown"}
                          </div>
                          <div className="text-sm text-red-700">
                            {result.error}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={resetImportDialog}>Done</Button>
              </div>
            </div>
          )}
                      </DialogContent>
                    </Dialog>

    </div>
  );
}
