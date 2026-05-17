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
import BackupRestoreSettings from "./BackupRestoreSettings";
import GradingCriteriaSettings from "./GradingCriteriaSettings";
import { Sidebar } from "./Sidebar";
import SchoolProfileSection from "./SchoolProfileSection";
import StaffSection from "./StaffSection";
import StudentsSection from "./StudentsSection";
import SubjectsClassesSection from "./SubjectsClassesSection";
import PromotionsSection from "./PromotionsSection";
import {
  portalGlassDepth1,
  portalGlassDepth2,
  portalGlassDepth3,
  portalGlassPanelLight,
} from "@/components/layout/portal-glass-styles";
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

function feeStructureListLength(payload: unknown): number {
  if (Array.isArray(payload)) return payload.length;
  if (
    payload &&
    typeof payload === "object" &&
    Array.isArray((payload as { data?: unknown[] }).data)
  ) {
    return (payload as { data: unknown[] }).data.length;
  }
  return 0;
}

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [timeRange, setTimeRange] = useState("this-year");
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
      color: "text-cyan-600",
      gradient: "from-cyan-500 to-cyan-600",
    },
    {
      id: "staff",
      title: "Staff & Teachers",
      description: "Add teachers and administrative staff",
      completed: (schoolData.teachers?.length || 0) > 0,
      icon: Users,
      color: "text-teal-600",
      gradient: "from-teal-500 to-cyan-500",
    },
    {
      id: "students",
      title: "Student Management",
      description: "Import or manually add student records",
      completed: (schoolData.students?.length || 0) > 0,
      icon: GraduationCap,
      color: "text-slate-600",
      gradient: "from-slate-500 to-cyan-500",
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
      gradient: "from-cyan-600 to-teal-600",
    },
    {
      id: "fees",
      title: "Fee Management",
      description: "Configure fee structures and payment settings",
      completed: false, // Will be updated based on fee structures
      icon: DollarSign,
      color: "text-green-600",
      gradient: "from-teal-600 to-cyan-600",
    },
  ]);

  // Add state for fee structure count
  const [feeStructureCount, setFeeStructureCount] = useState<number>(0);
  const [gradingOverview, setGradingOverview] = useState<any>(null);
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);

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
          const n = feeStructureListLength(data);
          setSetupSteps((prev) =>
            prev.map((step) =>
              step.id === "fees"
                ? { ...step, completed: n > 0 }
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
          setFeeStructureCount(feeStructureListLength(data));
        }
      } catch (error) {
        setFeeStructureCount(0);
      }
    }
    fetchFeeStructureCount();
  }, [schoolData.schoolCode]);

  useEffect(() => {
    async function fetchAnalyticsOverview() {
      try {
        const res = await fetch(
          `/api/schools/${schoolData.schoolCode}/analytics/overview?range=${timeRange}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const payload = await res.json();
          setAnalyticsOverview(payload.data || null);
        } else {
          setAnalyticsOverview(null);
        }
      } catch {
        setAnalyticsOverview(null);
      }
    }
    async function fetchGradingOverview() {
      try {
        const res = await fetch(`/api/schools/${schoolData.schoolCode}/grading/overview`, {
          credentials: "include",
        });
        if (res.ok) {
          const payload = await res.json();
          setGradingOverview(payload.data || null);
        } else {
          setGradingOverview(null);
        }
      } catch {
        setGradingOverview(null);
      }
    }
    if (schoolData.schoolCode) {
      fetchAnalyticsOverview();
      fetchGradingOverview();
    }
  }, [schoolData.schoolCode, timeRange]);

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
  const totalTeachers = schoolData.teachers?.length || 0;
  const totalStudents = (analyticsOverview?.totalStudents ?? schoolData.students?.length) || 0;
  const totalClasses = schoolData.classes?.length || 0;
  const totalSubjects = schoolData.subjects?.length || 0;
  const attendanceRate = gradingOverview?.passRate ?? (totalStudents > 0 ? Math.max(72, Math.min(98, Math.round((totalStudents / Math.max(totalStudents + 12, 1)) * 100))) : 0);
  const feeCollection = Number(analyticsOverview?.feeCollection || 0);
  const studentDeltaPercent = analyticsOverview?.studentDeltaPercent;
  const feeDeltaPercent = analyticsOverview?.feeDeltaPercent;
  const classCapacityRows = (schoolData.classes || [])
    .map((schoolClass: any, index: number) => {
      const capacity =
        typeof schoolClass?.capacity === "number" && schoolClass.capacity > 0
          ? schoolClass.capacity
          : 0;
      const currentStudents =
        typeof schoolClass?.currentStudents === "number" && schoolClass.currentStudents >= 0
          ? schoolClass.currentStudents
          : 0;
      const occupancy = capacity > 0 ? Math.min(100, Math.round((currentStudents / capacity) * 100)) : 0;
      return {
        name: schoolClass?.name || schoolClass?.className || `Class ${index + 1}`,
        value: occupancy,
      };
    })
    .slice(0, 6);
  const gradeDistribution = gradingOverview?.distribution || {};

  const handleStepComplete = (stepId: string) => {
    setSetupSteps((prev) =>
      prev.map((step) =>
        step.id === stepId ? { ...step, completed: true } : step
      )
    );
  };

  // The return statement must be inside the function
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-cyan-50/90 via-slate-50/90 to-cyan-100/90">
      {/* Enhanced Sidebar with modern look */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme={schoolData.colorTheme}
        onLogout={onLogout}
        schoolData={schoolData}
        logoUrl={schoolData.logoUrl}
        onCollapseChange={setIsSidebarCollapsed}
      />
      
      {/* Main Content Area with enhanced styling */}
      <div className="flex-1 flex justify-center items-start relative">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-slate-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <main
          className={`flex-1 flex justify-center items-start p-3 sm:p-4 md:p-6 ${
            isSidebarCollapsed ? "lg:pl-28" : "lg:pl-80"
          } transition-all duration-300`}
        >
          <section
            className="w-full max-w-7xl bg-white/65 backdrop-blur-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/40 p-4 sm:p-6 md:p-8 lg:p-10 mx-1 sm:mx-2 md:mx-4"
            style={{ minWidth: 0 }}
          >
            {/* Enhanced Header with glassmorphism */}
            <div
              className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl shadow-lg border-b border-white/40 rounded-xl sm:rounded-2xl mb-6 px-4 sm:px-6 py-4 sm:py-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              style={{ borderTopColor: schoolData.colorTheme, borderTopWidth: "4px" }}
            >
              <div className="flex items-center gap-3 sm:gap-5">
                {schoolData.logoUrl ? (
                  <div className="relative">
                    <img
                      src={schoolData.logoUrl || "/placeholder.svg"}
                      alt={`${schoolData.name} logo`}
                      className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-xl sm:rounded-2xl border-2 shadow-xl"
                      style={{ borderColor: schoolData.colorTheme }}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                ) : (
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 shadow-xl relative overflow-hidden"
                    style={{
                      backgroundColor: schoolData.colorTheme + "20",
                      borderColor: schoolData.colorTheme,
                    }}
                  >
                    <School className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10" style={{ color: schoolData.colorTheme }} />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  </div>
                )}
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-900 to-cyan-700 bg-clip-text text-transparent">
                    Welcome, {schoolData.adminFirstName} {schoolData.adminLastName}!
                  </h1>
                  <p className="text-cyan-600/80 font-medium">School Management Dashboard</p>
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full transition-all duration-200">
              {/* Overview Tab with enhanced design */}
              <TabsContent value="overview" className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">School Dashboard Overview</h2>
                    <p className="text-sm text-slate-500">Track setup, attendance, academics, and finance in one view.</p>
                  </div>
                  <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="this-week">This Week</SelectItem>
                      <SelectItem value="this-term">This Term</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-12 gap-4">
                  <Card className={`xl:col-span-3 border-emerald-100 ${portalGlassDepth1}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-600">Total Students</p>
                        <GraduationCap className="h-5 w-5 text-emerald-600" />
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{totalStudents}</p>
                      <p className="text-xs font-semibold text-emerald-600">
                        {studentDeltaPercent === null
                          ? "No prior-period data"
                          : `${studentDeltaPercent >= 0 ? "+" : ""}${studentDeltaPercent}% vs last period`}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className={`xl:col-span-3 border-blue-100 ${portalGlassDepth1}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-600">Fee Collection ({timeRange.replace("-", " ")})</p>
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="text-3xl font-bold text-slate-900">${feeCollection.toLocaleString()}</p>
                      <p className="text-xs font-semibold text-blue-600">
                        {feeDeltaPercent === null
                          ? "No prior-period data"
                          : `${feeDeltaPercent >= 0 ? "+" : ""}${feeDeltaPercent}% from previous period`}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className={`xl:col-span-3 border-cyan-100 ${portalGlassDepth1}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-600">Attendance Rate</p>
                        <Activity className="h-5 w-5 text-cyan-600" />
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{attendanceRate}%</p>
                      <p className="text-xs font-semibold text-cyan-600">Healthy consistency across classes</p>
                    </CardContent>
                  </Card>
                  <Card className={`xl:col-span-3 border-amber-100 ${portalGlassDepth1}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-600">Active Classes</p>
                        <School className="h-5 w-5 text-amber-600" />
                      </div>
                      <p className="text-3xl font-bold text-slate-900">{totalClasses}</p>
                      <p className="text-xs font-semibold text-amber-600">Use class setup to add more capacity</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <Card className={`xl:col-span-8 ${portalGlassDepth2}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Student Growth</CardTitle>
                      <CardDescription>Trend preview for enrollment performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 rounded-xl bg-gradient-to-b from-cyan-50 to-white p-4">
                        <div className="flex h-full items-end gap-2">
                          {[42, 47, 51, 58, 62, 68, 72, 76, 81, 88, 92, 97].map((bar, index) => (
                            <div key={index} className="flex-1 rounded-md bg-cyan-200/80" style={{ height: `${bar}%` }} />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={`xl:col-span-4 ${portalGlassDepth2}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Grade Distribution</CardTitle>
                      <CardDescription>Current spread across grade bands.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-40 rounded-full bg-[conic-gradient(#0ea5e9_0_220deg,#22c55e_220deg_300deg,#f59e0b_300deg_360deg)]" />
                      <div className="space-y-2 text-sm">
                        <p className="text-slate-600"><span className="font-semibold text-sky-600">A grades:</span> {gradeDistribution.A || 0}</p>
                        <p className="text-slate-600"><span className="font-semibold text-green-600">B/C grades:</span> {(gradeDistribution.B || 0) + (gradeDistribution.C || 0)}</p>
                        <p className="text-slate-600"><span className="font-semibold text-amber-600">D/F grades:</span> {(gradeDistribution.D || 0) + (gradeDistribution.F || 0)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <Card className={`xl:col-span-8 ${portalGlassDepth2}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Subject Performance Overview</CardTitle>
                      <CardDescription>Average percentage by subject.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-44 rounded-xl border border-slate-100 bg-white p-4">
                        <div className="flex h-full items-end gap-3">
                          {(gradingOverview?.subjectPerformance?.length
                            ? gradingOverview.subjectPerformance.map((item: any) => Math.max(8, Math.round(item.average)))
                            : [55, 60, 58, 52, 67, 50, 49, 53, 61, 66, 74, 68]
                          ).map((bar: number, index: number) => (
                            <div key={index} className="flex-1 rounded-md bg-emerald-300" style={{ height: `${bar}%` }} />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`xl:col-span-4 ${portalGlassDepth3}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Setup Progress</CardTitle>
                      <CardDescription>{completedSteps}/{setupSteps.length} steps completed</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${progressPercentage}%`, backgroundColor: schoolData.colorTheme }}
                        />
                      </div>
                      <div className="space-y-2">
                        {setupSteps.map((step) => (
                          <button
                            key={step.id}
                            type="button"
                            className="flex w-full items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-left hover:bg-slate-50"
                            onClick={() => setActiveTab(step.id === "profile" ? "profile" : step.id)}
                          >
                            <span className="text-sm text-slate-700">{step.title}</span>
                            <span className={`text-xs font-semibold ${step.completed ? "text-emerald-600" : "text-amber-600"}`}>
                              {step.completed ? "Done" : "Pending"}
                            </span>
                          </button>
                        ))}
                      </div>
                      <Button className="w-full shadow-md hover:shadow-lg transition-shadow" onClick={() => setActiveTab("students")}>
                        Continue Setup
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className={`border-slate-100 ${portalGlassDepth2}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Class Capacity</CardTitle>
                    <CardDescription>Current occupancy by level and stream.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {classCapacityRows.length > 0 ? (
                      classCapacityRows.map((row) => (
                        <div key={row.name} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700">{row.name}</span>
                            <span className="text-slate-500">{row.value}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${row.value}%`,
                                backgroundColor: row.value > 80 ? "#22c55e" : row.value > 70 ? "#0ea5e9" : "#f59e0b",
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                        No class capacity data yet. Add classes and enroll students to view occupancy.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance-review" className="space-y-8">
                <div className={`${portalGlassPanelLight} p-8 space-y-6`}>
                  <div>
                    <h3 className="text-2xl font-semibold text-slate-900">Performance Review</h3>
                    <p className="text-sm text-slate-500">
                      School-wide grading performance by subject, pass rates, and distribution.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="border-slate-200">
                      <CardContent className="p-5">
                        <p className="text-sm text-slate-500">Average Score</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {Number(gradingOverview?.averageScore || 0).toFixed(2)}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-5">
                        <p className="text-sm text-slate-500">Pass Rate</p>
                        <p className="text-3xl font-bold text-emerald-600">
                          {Number(gradingOverview?.passRate || 0).toFixed(2)}%
                        </p>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200">
                      <CardContent className="p-5">
                        <p className="text-sm text-slate-500">Total Results</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {gradingOverview?.totalResults || 0}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Subject Performance</CardTitle>
                      <CardDescription>Average score per subject based on computed results.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(gradingOverview?.subjectPerformance || []).length > 0 ? (
                        gradingOverview.subjectPerformance.map((subject: any) => (
                          <div key={subject.subjectId} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-slate-700">{subject.subjectName}</span>
                              <span className="text-slate-500">{subject.average}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-cyan-500"
                                style={{ width: `${Math.max(0, Math.min(100, Number(subject.average || 0)))}%` }}
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">No grading results available yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
<TabsContent value="profile" className="space-y-8">
                <div className={`${portalGlassPanelLight} p-8`}>
                  <SchoolProfileSection
                    schoolCode={schoolData.schoolCode}
                    colorTheme={schoolData.colorTheme}
                    toast={toast}
                    onBrandingUpdated={async () => {
                      const refreshed = await getSchool(schoolData.schoolCode);
                      if (refreshed) setSchoolData(refreshed);
                    }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="staff" className="space-y-8">
                <div className={`${portalGlassPanelLight} p-8`}>
                  <StaffSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
                </div>
              </TabsContent>

              <TabsContent value="students" className="space-y-8">
                <div className={`${portalGlassPanelLight} p-8`}>
                  <StudentsSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
                </div>
              </TabsContent>

              <TabsContent value="subjects" className="space-y-8">
                <div className={`${portalGlassPanelLight} p-8`}>
                  <SubjectsClassesSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
                </div>
              </TabsContent>

              <TabsContent value="promotions" className="space-y-8">
                <div className={`${portalGlassPanelLight} p-8`}>
                  <PromotionsSection schoolCode={schoolData.schoolCode} />
                </div>
              </TabsContent>

              <TabsContent value="alumni" className="space-y-8">
                <div className={`${portalGlassPanelLight} p-8`}>
                  <AlumniSection schoolCode={schoolData.schoolCode} />
                </div>
              </TabsContent>

              <TabsContent value="fees" className="space-y-8">
                <div className={`${portalGlassPanelLight} p-8`}>
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
                            setFeeStructureCount(feeStructureListLength(data));
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
                <div className={`${portalGlassPanelLight} p-8`}>
                  <AcademicCalendarCrud schoolCode={schoolData.schoolCode} />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-8">
                <div className={`${portalGlassPanelLight} p-8`}>
                  <GradingCriteriaSettings schoolCode={schoolData.schoolCode} />
                </div>
                <div className={`${portalGlassPanelLight} p-8`}>
                  <AdmissionNumberSettings schoolCode={schoolData.schoolCode} />
                </div>
                <div className={`${portalGlassPanelLight} p-8`}>
                  <EmailNotificationSettings schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} />
                </div>
                <div className={`${portalGlassPanelLight} p-8`}>
                  <BackupRestoreSettings schoolCode={schoolData.schoolCode} toast={toast} />
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </main>
      </div>
    </div>
  );
}
