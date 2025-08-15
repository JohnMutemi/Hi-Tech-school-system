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
  Settings,
  Calendar,
  Award,
  TrendingUp,
  Shield,
  Activity,
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
import EmailNotificationSettings from "./EmailNotificationSettings";
import { Sidebar } from "./Sidebar";
import SchoolProfileSection from "./SchoolProfileSection";
import StaffSection from "./StaffSection";
import StudentsSection from "./StudentsSection";
import SubjectsClassesSection from "./SubjectsClassesSection";
import PromotionsSection from "./PromotionsSection";
import AlumniSection from "./AlumniSection";

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
  color: string;
  gradient: string;
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
      color: "text-blue-600",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      id: "staff",
      title: "Staff & Teachers",
      description: "Add teachers and administrative staff",
      completed: (schoolData.teachers?.length || 0) > 0,
      icon: Users,
      color: "text-emerald-600",
      gradient: "from-emerald-500 to-teal-500",
    },
    {
      id: "students",
      title: "Student Management",
      description: "Import or manually add student records",
      completed: (schoolData.students?.length || 0) > 0,
      icon: GraduationCap,
      color: "text-purple-600",
      gradient: "from-purple-500 to-indigo-500",
    },
    {
      id: "subjects",
      title: "Academic Setup",
      description: "Configure subjects, classes, and timetables",
      completed:
        (schoolData.subjects?.length || 0) > 0 &&
        (schoolData.classes?.length || 0) > 0,
      icon: BookOpen,
      color: "text-orange-600",
      gradient: "from-orange-500 to-red-500",
    },
    {
      id: "fees",
      title: "Fee Management",
      description: "Configure fee structures and payment settings",
      completed: false, // Will be updated based on fee structures
      icon: DollarSign,
      color: "text-green-600",
      gradient: "from-green-500 to-emerald-500",
    },
  ]);

  // Add state for fee structure count
  const [feeStructureCount, setFeeStructureCount] = useState<number>(0);

  // Fetch grades from API on component mount
  useEffect(() => {
    async function fetchGrades() {
      try {
        const res = await fetch(`/api/schools/${schoolData.schoolCode}/grades`);
        if (!res.ok) {
          console.warn("Grades endpoint not available, this is normal for new schools");
          return;
        }
        
        // setGrades(await res.json()); // Grades are now managed by SchoolProfileSection
      } catch (error) {
        console.warn("Could not fetch grades:", error);
      }
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
          // setClasses(mappedClasses); // Classes are now managed by SubjectsClassesSection
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

  // Fetch students from API on component mount
  const fetchStudents = async () => {
    // setStudentsLoading(true); // Removed
    try {
      const res = await fetch(`/api/schools/${schoolData.schoolCode}/students`);
      if (res.ok) {
        const data = await res.json();
        // setStudents(data); // Students are now managed by StudentsSection
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load student data.",
        variant: "destructive",
      });
    } finally {
      // setStudentsLoading(false); // Removed
    }
  };

  // Fetch students on mount and when schoolCode changes
  useEffect(() => {
    fetchStudents();
  }, [schoolData.schoolCode]);

  // Fetch fee structures from API on component mount
  useEffect(() => {
    async function fetchFeeStructures() {
      try {
        const res = await fetch(
          `/api/schools/${schoolData.schoolCode}/fee-structure`
        );
        if (res.ok) {
          const data = await res.json();
          // setFeeStructures(data); // Fee structures are now managed by FeeManagement
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

  // Fetch fee structure count on mount and when schoolCode changes
  useEffect(() => {
    async function fetchFeeStructureCount() {
      try {
        const res = await fetch(`/api/schools/${schoolData.schoolCode}/fee-structure`);
        if (res.ok) {
          const data = await res.json();
          setFeeStructureCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (error) {
        setFeeStructureCount(0);
      }
    }
    fetchFeeStructureCount();
  }, [schoolData.schoolCode]);

  // Refresh school data when localStorage changes
  useEffect(() => {
    async function fetchSchool() {
      const refreshedData = await getSchool(schoolData.schoolCode);
      if (refreshedData) {
        setSchoolData(refreshedData);
        // setTeachers(refreshedData.teachers || []); // Only update teachers from the API, not from local storage
        // setStudents(refreshedData.students || []); // Only update students from the API, not from local storage
        // setSubjects(refreshedData.subjects || []); // Only update subjects from the API, not from local storage
        // setClasses(refreshedData.classes || []); // Only update classes from the API, not from local storage
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

  // The return statement must be inside the function
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Sidebar with modern look */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} colorTheme={schoolData.colorTheme} onLogout={onLogout} />
      
      {/* Main Content Area with enhanced styling */}
      <div className="flex-1 flex justify-center items-start relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <main className="flex-1 flex justify-center items-start p-4 md:p-8 transition-all duration-300">
          <section
            className="w-full max-w-7xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 md:p-12 mx-2 md:mx-8"
            style={{ marginLeft: '280px', minWidth: 0 }}
          >
            {/* Enhanced Header with glassmorphism */}
            <div
              className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 rounded-2xl mb-8 px-6 py-8 flex items-center justify-between"
              style={{ borderTopColor: schoolData.colorTheme, borderTopWidth: "4px" }}
            >
              <div className="flex items-center space-x-6">
                {schoolData.logoUrl ? (
                  <div className="relative">
                    <img
                      src={schoolData.logoUrl || "/placeholder.svg"}
                      alt={`${schoolData.name} logo`}
                      className="w-20 h-20 object-cover rounded-2xl border-2 shadow-xl"
                      style={{ borderColor: schoolData.colorTheme }}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                ) : (
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center border-2 shadow-xl relative overflow-hidden"
                    style={{
                      backgroundColor: schoolData.colorTheme + "20",
                      borderColor: schoolData.colorTheme,
                    }}
                  >
                    <School
                      className="w-10 h-10"
                      style={{ color: schoolData.colorTheme }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                )}
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Welcome, {schoolData.adminFirstName} {schoolData.adminLastName}!
                  </h1>
                  <p className="text-gray-600 font-medium">School Management Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Badge
                  variant={schoolData.status === "setup" ? "secondary" : "default"}
                  className="px-4 py-2 text-sm font-semibold"
                >
                  {schoolData.status === "setup" ? "Setup in Progress" : "Active"}
                </Badge>
              </div>
            </div>

            {/* Enhanced Main Tab Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Overview Tab with enhanced design */}
              <TabsContent value="overview" className="space-y-8">
                {/* Enhanced Summary Stats Section */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
                  <Card className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 shadow-lg border-0 rounded-2xl flex flex-col items-center py-6 px-6 transition-all duration-300 hover:scale-105">
                    <CardContent className="flex flex-col items-center p-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-blue-700">{schoolData.teachers?.length || 0}</div>
                      <div className="text-blue-600 text-sm font-medium">Teachers</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="group bg-gradient-to-br from-emerald-50 to-emerald-100 hover:from-emerald-100 hover:to-emerald-200 shadow-lg border-0 rounded-2xl flex flex-col items-center py-6 px-6 transition-all duration-300 hover:scale-105">
                    <CardContent className="flex flex-col items-center p-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <GraduationCap className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-emerald-700">{schoolData.students?.length || 0}</div>
                      <div className="text-emerald-600 text-sm font-medium">Students</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="group bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 shadow-lg border-0 rounded-2xl flex flex-col items-center py-6 px-6 transition-all duration-300 hover:scale-105">
                    <CardContent className="flex flex-col items-center p-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-purple-700">{schoolData.subjects?.length || 0}</div>
                      <div className="text-purple-600 text-sm font-medium">Subjects</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 shadow-lg border-0 rounded-2xl flex flex-col items-center py-6 px-6 transition-all duration-300 hover:scale-105">
                    <CardContent className="flex flex-col items-center p-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <School className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-orange-700">{schoolData.classes?.length || 0}</div>
                      <div className="text-orange-600 text-sm font-medium">Classes</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="group bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 shadow-lg border-0 rounded-2xl flex flex-col items-center py-6 px-6 transition-all duration-300 hover:scale-105">
                    <CardContent className="flex flex-col items-center p-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                        <DollarSign className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-3xl font-bold text-green-700">{feeStructureCount}</div>
                      <div className="text-green-600 text-sm font-medium">Fee Structures</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Progress Card with Glassmorphism */}
                <Card className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 px-8 py-8">
                  <CardHeader className="px-0 py-0 pb-6">
                    <CardTitle className="flex items-center space-x-3 text-2xl font-bold">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                        Setup Progress
                      </span>
                    </CardTitle>
                    <CardDescription className="text-lg text-gray-600">
                      Complete these steps to fully activate your school management system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <span className="text-lg font-semibold text-gray-700">
                        Overall Progress
                      </span>
                      <span className="text-lg text-gray-600 font-medium">
                        {completedSteps}/{setupSteps.length} completed
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                      <div
                        className="h-4 rounded-full transition-all duration-700 ease-out shadow-lg"
                        style={{
                          width: `${progressPercentage}%`,
                          background: `linear-gradient(90deg, ${schoolData.colorTheme}, #34d399, #6366f1)`,
                        }}
                      ></div>
                    </div>
                    <div className="text-center">
                      <span className="text-3xl font-bold text-gray-900">{Math.round(progressPercentage)}%</span>
                      <span className="text-gray-600 ml-2">Complete</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Enhanced Setup Steps Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {setupSteps.map((step, index) => (
                    <Card
                      key={step.id}
                      className={`group transition-all duration-500 border-0 shadow-xl bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg rounded-2xl hover:scale-105 hover:shadow-2xl cursor-pointer ${
                        step.completed 
                          ? "ring-2 ring-green-200 bg-gradient-to-br from-green-50/90 to-emerald-50/90" 
                          : "hover:bg-gradient-to-br hover:from-gray-50/90 hover:to-white/90"
                      }`}
                      onClick={() => setActiveTab(step.id === "profile" ? "profile" : step.id)}
                    >
                      <CardHeader className="px-6 py-6">
                        <CardTitle className="flex items-center justify-between text-lg font-bold">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 ${
                                step.completed
                                  ? "bg-gradient-to-br from-green-500 to-emerald-500 text-white"
                                  : `bg-gradient-to-br ${step.gradient} text-white`
                              }`}
                            >
                              {step.completed ? (
                                <CheckCircle className="w-6 h-6 animate-pulse" />
                              ) : (
                                <step.icon className="w-6 h-6" />
                              )}
                            </div>
                            <span
                              className={
                                step.completed
                                  ? "text-green-700 font-bold"
                                  : "text-gray-800 font-semibold"
                              }
                            >
                              {step.title}
                            </span>
                          </div>
                          {step.completed ? (
                            <Badge className="bg-green-100 text-green-800 font-semibold px-3 py-1">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="font-semibold px-3 py-1">
                              Pending
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription
                          className={`text-base ${step.completed ? "text-green-600" : "text-gray-600"}`}
                        >
                          {step.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="px-6 pb-6">
                        <Button
                          className="w-full py-3 text-base font-semibold rounded-xl transition-all duration-300"
                          variant={step.completed ? "outline" : "default"}
                          style={
                            !step.completed
                              ? { 
                                  backgroundColor: schoolData.colorTheme,
                                  borderColor: schoolData.colorTheme,
                                  color: "white"
                                }
                              : {}
                          }
                        >
                          {step.completed ? "Review Setup" : "Start Setup"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Actions Section */}
                <Card className="bg-gradient-to-br from-indigo-50/90 to-purple-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20">
                  <CardHeader className="px-8 py-8">
                    <CardTitle className="flex items-center space-x-3 text-2xl font-bold">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <span className="bg-gradient-to-r from-indigo-900 to-purple-900 bg-clip-text text-transparent">
                        Quick Actions
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        variant="outline" 
                        className="h-16 text-lg font-semibold border-2 border-indigo-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-300"
                        onClick={() => setActiveTab("staff")}
                      >
                        <Users className="w-5 h-5 mr-2" />
                        Add Staff
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-16 text-lg font-semibold border-2 border-purple-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-300"
                        onClick={() => setActiveTab("students")}
                      >
                        <GraduationCap className="w-5 h-5 mr-2" />
                        Add Students
                      </Button>
                      <Button 
                        variant="outline" 
                        className="h-16 text-lg font-semibold border-2 border-green-200 hover:border-green-300 hover:bg-green-50 transition-all duration-300"
                        onClick={() => setActiveTab("fees")}
                      >
                        <DollarSign className="w-5 h-5 mr-2" />
                        Setup Fees
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Enhanced Tab Content with consistent styling */}
              <TabsContent value="profile" className="space-y-8">
                <div className="bg-gradient-to-br from-blue-50/90 to-cyan-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <SchoolProfileSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
                </div>
              </TabsContent>

              <TabsContent value="staff" className="space-y-8">
                <div className="bg-gradient-to-br from-emerald-50/90 to-teal-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <StaffSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
                </div>
              </TabsContent>

              <TabsContent value="students" className="space-y-8">
                <div className="bg-gradient-to-br from-purple-50/90 to-indigo-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <StudentsSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
                </div>
              </TabsContent>

              <TabsContent value="subjects" className="space-y-8">
                <div className="bg-gradient-to-br from-orange-50/90 to-red-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <SubjectsClassesSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
                </div>
              </TabsContent>

              <TabsContent value="promotions" className="space-y-8">
                <div className="bg-gradient-to-br from-blue-50/90 to-blue-100/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <PromotionsSection schoolCode={schoolData.schoolCode} />
                </div>
              </TabsContent>

              <TabsContent value="alumni" className="space-y-8">
                <div className="bg-gradient-to-br from-purple-50/90 to-purple-100/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <AlumniSection schoolCode={schoolData.schoolCode} />
                </div>
              </TabsContent>

              <TabsContent value="fees" className="space-y-8">
                <div className="bg-gradient-to-br from-green-50/90 to-emerald-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <FeeManagement
                    schoolCode={schoolData.schoolCode}
                    colorTheme={schoolData.colorTheme}
                    onGoBack={() => setActiveTab("overview")}
                    onFeeStructureCreated={() => {
                      setSetupSteps((prev) =>
                        prev.map((step) =>
                          step.id === "fees" ? { ...step, completed: true } : step
                        )
                      );
                      // Refetch fee structure count
                      (async () => {
                        try {
                          const res = await fetch(`/api/schools/${schoolData.schoolCode}/fee-structure`);
                          if (res.ok) {
                            const data = await res.json();
                            setFeeStructureCount(Array.isArray(data) ? data.length : 0);
                          }
                        } catch (error) {
                          setFeeStructureCount(0);
                        }
                      })();
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="academic-calendar" className="space-y-8">
                <div className="bg-gradient-to-br from-cyan-50/90 to-blue-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <AcademicCalendarCrud schoolCode={schoolData.schoolCode} />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-8">
                <div className="bg-gradient-to-br from-gray-50/90 to-slate-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <AdmissionNumberSettings schoolCode={schoolData.schoolCode} />
                </div>
                <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-lg rounded-3xl shadow-xl border border-white/20 p-8">
                  <EmailNotificationSettings schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} />
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </main>
      </div>
    </div>
  );
}
