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
import SchoolProfileSection from "./SchoolProfileSection";
import StaffSection from "./StaffSection";
import StudentsSection from "./StudentsSection";
import SubjectsClassesSection from "./SubjectsClassesSection";
import PromotionsSection from "./PromotionsSection";

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

  // Add state for fee structure count
  const [feeStructureCount, setFeeStructureCount] = useState<number>(0);

  // Fetch grades from API on component mount
  useEffect(() => {
    async function fetchGrades() {
      const res = await fetch(`/api/grades`);
      if (!res.ok) throw new Error("Failed to fetch grades");
      // setGrades(await res.json()); // Grades are now managed by SchoolProfileSection
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
          <section
            className="w-full max-w-7xl bg-white/80 rounded-3xl shadow-2xl p-4 md:p-14 backdrop-blur-lg mx-2 md:mx-6"
            style={{ marginLeft: '260px', minWidth: 0 }} // Increased for more gap
          >
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
                {/* <Button variant="outline" onClick={onLogout}> // Removed
                  <LogOut className="w-4 h-4 mr-2" /> // Removed
                  Logout // Removed
                </Button> */}
              </div>
            </div>
            {/* Main Tab Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-8">
                {/* Summary Stats Section - Modern Cards, Only at Top */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <Users className="w-6 h-6 text-blue-500 mb-1" />
                      <div className="text-2xl font-bold">{schoolData.teachers?.length || 0}</div>
                      <div className="text-gray-500 text-sm">Teachers</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <GraduationCap className="w-6 h-6 text-green-500 mb-1" />
                      <div className="text-2xl font-bold">{schoolData.students?.length || 0}</div>
                      <div className="text-gray-500 text-sm">Students</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <BookOpen className="w-6 h-6 text-purple-500 mb-1" />
                      <div className="text-2xl font-bold">{schoolData.subjects?.length || 0}</div>
                      <div className="text-gray-500 text-sm">Subjects</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <School className="w-6 h-6 text-orange-500 mb-1" />
                      <div className="text-2xl font-bold">{schoolData.classes?.length || 0}</div>
                      <div className="text-gray-500 text-sm">Classes</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg border-0 rounded-2xl flex flex-col items-center py-4 md:py-6 px-4 md:px-6">
                    <CardContent className="flex flex-col items-center p-2">
                      <DollarSign className="w-6 h-6 text-emerald-500 mb-1" />
                      <div className="text-2xl font-bold">{feeStructureCount}</div>
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
              <TabsContent value="profile" className="space-y-8">
                <SchoolProfileSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
              </TabsContent>

              {/* Staff & Teachers Tab */}
              <TabsContent value="staff" className="space-y-8">
                <StaffSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
              </TabsContent>

              {/* Students Tab */}
              <TabsContent value="students" className="space-y-8">
                <StudentsSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
              </TabsContent>

              {/* Subjects & Classes Tab */}
              <TabsContent value="subjects" className="space-y-8">
                <SubjectsClassesSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
              </TabsContent>

              {/* Promotions Tab */}
              <TabsContent value="promotions" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
                <PromotionsSection schoolCode={schoolData.schoolCode} colorTheme={schoolData.colorTheme} toast={toast} />
              </TabsContent>

             
              {/* Fee Management Tab */}
              <TabsContent value="fees" className="space-y-8 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg p-6">
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
    </div>
  );
}
