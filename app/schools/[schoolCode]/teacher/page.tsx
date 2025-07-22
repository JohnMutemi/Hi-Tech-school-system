"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap,
  Users,
  FileText,
  Calendar,
  CheckCircle,
  Settings,
  LogOut,
  Bell,
  BookOpen,
  TrendingUp,
  Activity,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Star,
  Award,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  MoreVertical,
  Grid,
  List,
  CalendarDays,
  BookMarked,
  Library,
  School,
  Building,
  Home,
  Briefcase,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  UserEdit,
  UserCog,
  UserShield,
  UserStar,
  Key,
  AlertCircle,
} from "lucide-react";
import { TeacherSidebar } from "@/components/teacher-dashboard/TeacherSidebar";

export default function TeacherDashboardPage({
  params,
}: {
  params: { schoolCode: string };
}) {
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    async function fetchTeacherData() {
      try {
        const res = await fetch(`/api/schools/${params.schoolCode}/teachers/session`);
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        const data = await res.json();
        setTeacher(data.teacher);
        setSchoolData(data.schoolData);
        setIsLoading(false);
      } catch (error) {
        console.error("Session fetch error:", error);
        router.push(`/schools/${params.schoolCode}/teacher/login`);
      }
    }
    fetchTeacherData();
  }, [params.schoolCode, router]);

  const handleLogout = async () => {
    try {
      await fetch(`/api/schools/${params.schoolCode}/teachers/logout`, { method: "POST" });
      router.push(`/schools/${params.schoolCode}/teacher/login`);
    } catch (error) {
      console.error("Logout error:", error);
      router.push(`/schools/${params.schoolCode}/teacher/login`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match");
      return;
    }

    try {
      const res = await fetch(`/api/schools/${params.schoolCode}/teachers/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      if (res.ok) {
        setPasswordMsg("Password changed successfully!");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setPasswordMsg(data.error || "Failed to change password");
      }
    } catch (error) {
      setPasswordMsg("Failed to change password");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Teacher Profile Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-blue-800">
            <User className="w-6 h-6" />
            Teacher Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-blue-200 shadow-lg">
              <AvatarImage src={teacher?.avatarUrl} alt={teacher?.name} />
              <AvatarFallback className="bg-blue-600 text-white text-xl font-semibold">
                {teacher?.name?.charAt(0) || "T"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{teacher?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Employee ID:</span>
                  <span className="ml-2 text-gray-900">{teacher?.employeeId || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Department:</span>
                  <span className="ml-2 text-gray-900">{teacher?.department || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Status:</span>
                  <Badge className="ml-2 bg-green-100 text-green-800">Active</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Classes</p>
                <p className="text-2xl font-bold text-blue-800">4</p>
              </div>
              <GraduationCap className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Students</p>
                <p className="text-2xl font-bold text-green-800">120</p>
              </div>
              <Users className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Subjects</p>
                <p className="text-2xl font-bold text-purple-800">3</p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Attendance</p>
                <p className="text-2xl font-bold text-orange-800">95%</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { icon: FileText, text: "Grades submitted for Math", time: "2 hours ago", color: "text-blue-600" },
              { icon: Calendar, text: "Attendance marked", time: "1 day ago", color: "text-green-600" },
              { icon: Bell, text: "New assignment posted", time: "3 days ago", color: "text-purple-600" },
              { icon: Users, text: "Parent meeting scheduled", time: "1 week ago", color: "text-orange-600" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <activity.icon className={`w-5 h-5 ${activity.color}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderClasses = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            My Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Grade 10A", subject: "Mathematics", students: 32, schedule: "Mon, Wed, Fri" },
              { name: "Grade 9B", subject: "Mathematics", students: 28, schedule: "Tue, Thu" },
              { name: "Grade 8A", subject: "Mathematics", students: 30, schedule: "Mon, Wed" },
              { name: "Grade 7B", subject: "Mathematics", students: 25, schedule: "Tue, Thu, Fri" },
            ].map((cls, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  <Badge className="bg-blue-100 text-blue-800">{cls.subject}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-medium">{cls.students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Schedule:</span>
                    <span className="font-medium">{cls.schedule}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Users className="w-4 h-4 mr-1" />
                    View Students
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <FileText className="w-4 h-4 mr-1" />
                    Grades
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSubjects = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            My Subjects
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: "Mathematics", grade: "Grade 7-10", students: 115, avgGrade: "B+" },
              { name: "Advanced Mathematics", grade: "Grade 11-12", students: 45, avgGrade: "A-" },
              { name: "Statistics", grade: "Grade 12", students: 28, avgGrade: "B" },
            ].map((subject, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  <Badge className="bg-purple-100 text-purple-800">{subject.grade}</Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Students:</span>
                    <span className="font-medium">{subject.students}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Grade:</span>
                    <span className="font-medium">{subject.avgGrade}</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <FileText className="w-4 h-4 mr-1" />
                    Curriculum
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            My Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: "John Doe", class: "Grade 10A", attendance: 95, avgGrade: "A-" },
              { name: "Jane Smith", class: "Grade 10A", attendance: 88, avgGrade: "B+" },
              { name: "Mike Johnson", class: "Grade 9B", attendance: 92, avgGrade: "A" },
              { name: "Sarah Wilson", class: "Grade 9B", attendance: 85, avgGrade: "B" },
              { name: "David Brown", class: "Grade 8A", attendance: 90, avgGrade: "A-" },
            ].map((student, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {student.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.class}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Attendance</p>
                    <p className="font-semibold text-green-600">{student.attendance}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Avg Grade</p>
                    <p className="font-semibold text-blue-600">{student.avgGrade}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800">95%</p>
                <p className="text-sm text-green-600">Overall Attendance</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-800">120</p>
                <p className="text-sm text-blue-600">Total Students</p>
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-800">6</p>
                <p className="text-sm text-orange-600">Absent Today</p>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-800">3</p>
                <p className="text-sm text-purple-600">Late Today</p>
              </div>
            </div>
          </div>

          {/* Class Attendance */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Today's Attendance</h3>
            {[
              { class: "Grade 10A", present: 30, absent: 2, late: 1 },
              { class: "Grade 9B", present: 26, absent: 2, late: 0 },
              { class: "Grade 8A", present: 28, absent: 2, late: 2 },
            ].map((cls, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{cls.class}</h4>
                  <p className="text-sm text-gray-600">Total: {cls.present + cls.absent + cls.late} students</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-green-600 font-medium">{cls.present}</p>
                    <p className="text-xs text-gray-600">Present</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-red-600 font-medium">{cls.absent}</p>
                    <p className="text-xs text-gray-600">Absent</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-orange-600 font-medium">{cls.late}</p>
                    <p className="text-xs text-gray-600">Late</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Edit className="w-4 h-4 mr-1" />
                    Mark
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                title: "Staff Meeting",
                message: "Monthly staff meeting scheduled for Friday at 3 PM",
                time: "2 hours ago",
                type: "meeting",
                color: "bg-blue-100 text-blue-800"
              },
              {
                title: "Grade Submission Deadline",
                message: "Term 2 grades due by end of this week",
                time: "1 day ago",
                type: "deadline",
                color: "bg-orange-100 text-orange-800"
              },
              {
                title: "Parent Conference",
                message: "Parent-teacher conference next Tuesday",
                time: "3 days ago",
                type: "conference",
                color: "bg-purple-100 text-purple-800"
              },
              {
                title: "Professional Development",
                message: "Math teaching workshop next month",
                time: "1 week ago",
                type: "workshop",
                color: "bg-green-100 text-green-800"
              },
            ].map((notification, index) => (
              <div key={index} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full mt-2 ${notification.color.replace('bg-', 'bg-').replace(' text-', '')}`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
                {passwordMsg}
              </p>
            )}
            <Button type="submit" className="w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Account Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={teacher?.name || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={teacher?.email || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
              <input
                type="text"
                value={teacher?.employeeId || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <input
                type="text"
                value={teacher?.department || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return renderOverview();
      case "classes":
        return renderClasses();
      case "subjects":
        return renderSubjects();
      case "students":
        return renderStudents();
      case "attendance":
        return renderAttendance();
      case "notifications":
        return renderNotifications();
      case "settings":
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <TeacherSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="#3b82f6"
        onLogout={handleLogout}
        teacher={teacher}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header - Hidden on desktop */}
        <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-blue-700">Teacher Portal</span>
                <span className="text-xs text-gray-500">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                <User className="w-4 h-4" />
                <span className="font-medium">{teacher?.name || 'Teacher'}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8">
          {renderContent()}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-20">
          <div className="flex justify-around">
            {[
              { id: "overview", label: "Overview", icon: BookOpen },
              { id: "classes", label: "Classes", icon: GraduationCap },
              { id: "students", label: "Students", icon: Users },
              { id: "attendance", label: "Attendance", icon: Calendar },
              { id: "settings", label: "Settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center py-3 px-2 min-w-0 flex-1 transition-all duration-200 ${
                    isActive 
                      ? "text-blue-600 bg-blue-50" 
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
