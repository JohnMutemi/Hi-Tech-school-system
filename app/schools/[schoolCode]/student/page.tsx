"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  GraduationCap,
  FileText,
  DollarSign,
  Receipt,
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
import { StudentSidebar } from "@/components/student-dashboard/StudentSidebar";

export default function StudentDashboardPage({
  params,
}: {
  params: { schoolCode: string };
}) {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [schoolData, setSchoolData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");

  useEffect(() => {
    async function fetchStudentData() {
      try {
        const res = await fetch(`/api/schools/${params.schoolCode}/students/session`);
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        const data = await res.json();
        setStudent(data.student);
        setSchoolData(data.schoolData);
        setIsLoading(false);
      } catch (error) {
        console.error("Session fetch error:", error);
        router.push(`/schools/${params.schoolCode}/student/login`);
      }
    }
    fetchStudentData();
  }, [params.schoolCode, router]);

  const handleLogout = async () => {
    try {
      await fetch(`/api/schools/${params.schoolCode}/students/logout`, { method: "POST" });
      router.push(`/schools/${params.schoolCode}/student/login`);
    } catch (error) {
      console.error("Logout error:", error);
      router.push(`/schools/${params.schoolCode}/student/login`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg("New passwords do not match");
      return;
    }

    try {
      const res = await fetch(`/api/schools/${params.schoolCode}/students/change-password`, {
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
      {/* Student Profile Card */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-green-800">
            <User className="w-6 h-6" />
            Student Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-green-200 shadow-lg">
              <AvatarImage src={student?.avatarUrl} alt={student?.name} />
              <AvatarFallback className="bg-green-600 text-white text-xl font-semibold">
                {student?.name?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{student?.name || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Admission No:</span>
                  <span className="ml-2 text-gray-900">{student?.admissionNumber || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Class:</span>
                  <span className="ml-2 text-gray-900">{student?.className || "N/A"}</span>
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
                <p className="text-sm font-medium text-blue-600">Attendance</p>
                <p className="text-2xl font-bold text-blue-800">95%</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Average Grade</p>
                <p className="text-2xl font-bold text-purple-800">B+</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Fees Paid</p>
                <p className="text-2xl font-bold text-green-800">KES 45K</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Outstanding</p>
                <p className="text-2xl font-bold text-orange-800">KES 15K</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
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
              { icon: FileText, text: "Math test submitted", time: "2 hours ago", color: "text-blue-600" },
              { icon: Calendar, text: "Attendance marked", time: "1 day ago", color: "text-green-600" },
              { icon: DollarSign, text: "Fee payment received", time: "3 days ago", color: "text-purple-600" },
              { icon: Bell, text: "New assignment posted", time: "1 week ago", color: "text-orange-600" },
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

  const renderClass = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-700">Class Name</span>
                <span className="text-blue-900 font-semibold">{student?.className || "N/A"}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-700">Class Teacher</span>
                <span className="text-green-900 font-semibold">Mrs. Johnson</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-purple-700">Total Students</span>
                <span className="text-purple-900 font-semibold">32</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium text-orange-700">Academic Year</span>
                <span className="text-orange-900 font-semibold">2024</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                <span className="font-medium text-indigo-700">Current Term</span>
                <span className="text-indigo-900 font-semibold">Term 2</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                <span className="font-medium text-teal-700">Class Position</span>
                <span className="text-teal-900 font-semibold">5th</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
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
              { name: "Mathematics", teacher: "Mr. Smith", grade: "A", color: "bg-blue-100 text-blue-800" },
              { name: "English", teacher: "Mrs. Davis", grade: "B+", color: "bg-green-100 text-green-800" },
              { name: "Science", teacher: "Mr. Wilson", grade: "A-", color: "bg-purple-100 text-purple-800" },
              { name: "History", teacher: "Ms. Brown", grade: "B", color: "bg-orange-100 text-orange-800" },
              { name: "Geography", teacher: "Mr. Taylor", grade: "A", color: "bg-indigo-100 text-indigo-800" },
              { name: "Art", teacher: "Mrs. Garcia", grade: "A+", color: "bg-pink-100 text-pink-800" },
            ].map((subject, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  <Badge className={subject.color}>{subject.grade}</Badge>
                </div>
                <p className="text-sm text-gray-600">Teacher: {subject.teacher}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGrades = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Academic Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { subject: "Mathematics", grade: "A", score: 85, color: "bg-blue-100 text-blue-800" },
              { subject: "English", grade: "B+", score: 78, color: "bg-green-100 text-green-800" },
              { subject: "Science", grade: "A-", score: 82, color: "bg-purple-100 text-purple-800" },
              { subject: "History", grade: "B", score: 75, color: "bg-orange-100 text-orange-800" },
              { subject: "Geography", grade: "A", score: 88, color: "bg-indigo-100 text-indigo-800" },
              { subject: "Art", grade: "A+", score: 92, color: "bg-pink-100 text-pink-800" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{item.subject}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{item.score}%</span>
                  <Badge className={item.color}>{item.grade}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Performance Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Performance chart will be displayed here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFinance = () => (
    <div className="space-y-6">
      {/* Fee Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Fee Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200 min-h-[80px] flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-green-600 truncate">Total Fees</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-800 truncate">KES 60K</p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200 min-h-[80px] flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-blue-600 truncate">Paid</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-800 truncate">KES 45K</p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200 min-h-[80px] flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-orange-600 truncate">Outstanding</p>
                  <p className="text-lg sm:text-2xl font-bold text-orange-800 truncate">KES 15K</p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200 min-h-[80px] flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-purple-600 truncate">Due Date</p>
                  <p className="text-sm sm:text-lg font-bold text-purple-800 truncate">15th Dec</p>
                </div>
                <div className="flex-shrink-0 ml-2">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Fee Breakdown</h3>
            {[
              { term: "Term 1", amount: 20000, paid: 20000, status: "Paid" },
              { term: "Term 2", amount: 20000, paid: 15000, status: "Partial" },
              { term: "Term 3", amount: 20000, paid: 10000, status: "Pending" },
            ].map((term, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">{term.term}</span>
                  <p className="text-sm text-gray-600">KES {term.amount.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900">KES {term.paid.toLocaleString()}</span>
                  <Badge className={`ml-2 ${
                    term.status === "Paid" ? "bg-green-100 text-green-800" :
                    term.status === "Partial" ? "bg-orange-100 text-orange-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {term.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReceipts = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Payment Receipts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: "R001", date: "2024-01-15", amount: 20000, term: "Term 1", status: "Paid" },
              { id: "R002", date: "2024-04-20", amount: 15000, term: "Term 2", status: "Paid" },
              { id: "R003", date: "2024-07-10", amount: 10000, term: "Term 2", status: "Paid" },
            ].map((receipt, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">Receipt #{receipt.id}</p>
                    <p className="text-sm text-gray-600">{receipt.term} • {receipt.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900">KES {receipt.amount.toLocaleString()}</span>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Download
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
            Attendance Record
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-800">95%</p>
                <p className="text-sm text-green-600">Attendance Rate</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-800">180</p>
                <p className="text-sm text-blue-600">Days Present</p>
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-800">8</p>
                <p className="text-sm text-orange-600">Days Absent</p>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-800">2</p>
                <p className="text-sm text-purple-600">Late Arrivals</p>
              </div>
            </div>
          </div>

          {/* Monthly Attendance */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">This Month</h3>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const isPresent = Math.random() > 0.1;
                const isLate = Math.random() > 0.9;
                return (
                  <div
                    key={day}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium ${
                      isPresent
                        ? isLate
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Present</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Absent</span>
              </div>
            </div>
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
                title: "New Assignment Posted",
                message: "Mathematics assignment due next week",
                time: "2 hours ago",
                type: "assignment",
                color: "bg-blue-100 text-blue-800"
              },
              {
                title: "Fee Payment Reminder",
                message: "Term 2 fees due in 5 days",
                time: "1 day ago",
                type: "payment",
                color: "bg-orange-100 text-orange-800"
              },
              {
                title: "Parent Meeting",
                message: "Scheduled for next Friday at 2 PM",
                time: "3 days ago",
                type: "meeting",
                color: "bg-purple-100 text-purple-800"
              },
              {
                title: "Exam Schedule",
                message: "Mid-term exams start next month",
                time: "1 week ago",
                type: "exam",
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
                value={student?.name || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={student?.email || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Admission Number</label>
              <input
                type="text"
                value={student?.admissionNumber || ""}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
              <input
                type="text"
                value={student?.className || ""}
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
      case "class":
        return renderClass();
      case "grades":
        return renderGrades();
      case "finance":
        return renderFinance();
      case "receipts":
        return renderReceipts();
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
    <div className="flex min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <StudentSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="#10b981"
        onLogout={handleLogout}
        student={student}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header - Hidden on desktop */}
        <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-20">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="font-bold text-lg text-green-700">Student Portal</span>
                <span className="text-xs text-gray-500">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-full">
                <User className="w-4 h-4" />
                <span className="font-medium">{student?.name || 'Student'}</span>
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
              { id: "class", label: "Class", icon: GraduationCap },
              { id: "grades", label: "Grades", icon: FileText },
              { id: "finance", label: "Finance", icon: DollarSign },
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
                      ? "text-green-600 bg-green-50" 
                      : "text-gray-600 hover:text-green-600 hover:bg-green-50"
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