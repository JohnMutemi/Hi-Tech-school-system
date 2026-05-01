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
import { FeesStatementDownload } from "@/components/fees-statement/FeesStatementDownload";
import { getSchoolThemeTokens, hexToRgba } from "@/lib/utils/school-theme";

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
  const [feePayload, setFeePayload] = useState<any>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [receiptsList, setReceiptsList] = useState<any[]>([]);
  const [receiptsLoading, setReceiptsLoading] = useState(false);
  const [gradePayload, setGradePayload] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const theme = getSchoolThemeTokens(schoolData?.colorTheme || "#10b981");

  useEffect(() => {
    async function fetchStudentData() {
      try {
        const res = await fetch(`/api/schools/${params.schoolCode}/students/session`);
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        const data = await res.json();
        setStudent(data.student);
        if (data.schoolData) {
          setSchoolData(data.schoolData);
        } else {
          const schoolRes = await fetch(`/api/schools/${encodeURIComponent(params.schoolCode)}`);
          if (schoolRes.ok) {
            setSchoolData(await schoolRes.json());
          }
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Session fetch error:", error);
        router.push(`/schools/${params.schoolCode}/student/login`);
      }
    }
    fetchStudentData();
  }, [params.schoolCode, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/schools/${encodeURIComponent(params.schoolCode)}/students/dashboard`,
          { credentials: "include" }
        );
        if (!res.ok || cancelled) return;
        const payload = await res.json();
        const data = payload?.data ?? null;
        if (cancelled) return;
        setDashboardData(data);
        if (data?.school?.colorTheme) {
          setSchoolData((prev: any) => ({
            ...(prev || {}),
            colorTheme: data.school.colorTheme,
            name: data.school.name || prev?.name,
          }));
        }
      } catch {
        if (!cancelled) setDashboardData(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.schoolCode]);

  useEffect(() => {
    if (!student?.id) return;
    let cancelled = false;
    (async () => {
      setFinanceLoading(true);
      try {
        const res = await fetch(
          `/api/schools/${encodeURIComponent(params.schoolCode)}/students/${student.id}/fees`,
          { credentials: "include" }
        );
        if (res.ok && !cancelled) {
          setFeePayload(await res.json());
        }
      } finally {
        if (!cancelled) setFinanceLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [student?.id, params.schoolCode]);

  useEffect(() => {
    if (!student?.id || activeTab !== "receipts") return;
    let cancelled = false;
    (async () => {
      setReceiptsLoading(true);
      try {
        const res = await fetch(
          `/api/schools/${encodeURIComponent(params.schoolCode)}/students/${student.id}/receipts`,
          { credentials: "include" }
        );
        if (res.ok && !cancelled) {
          setReceiptsList(await res.json());
        } else if (!cancelled) {
          setReceiptsList([]);
        }
      } finally {
        if (!cancelled) setReceiptsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [student?.id, activeTab, params.schoolCode]);

  useEffect(() => {
    if (!student?.id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/schools/${encodeURIComponent(params.schoolCode)}/students/${student.id}/grading/results`,
          { credentials: "include" }
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setGradePayload(data.data || null);
        }
      } catch {
        if (!cancelled) setGradePayload(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [student?.id, params.schoolCode]);

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

  const renderOverview = () => {
    const assessed = (feePayload?.termBalances ?? []).reduce(
      (s: number, t: any) => s + Number(t.totalAmount ?? 0),
      0
    );
    const paid = (feePayload?.termBalances ?? []).reduce(
      (s: number, t: any) => s + Number(t.paidAmount ?? 0),
      0
    );
    const outstanding = Number(feePayload?.outstanding ?? 0);
    return (
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
                <p className="text-2xl font-bold text-blue-800">
                  {dashboardData?.attendance?.attendanceRate != null
                    ? `${dashboardData.attendance.attendanceRate}%`
                    : "N/A"}
                </p>
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
                <p className="text-2xl font-bold text-purple-800">
                  {gradePayload?.summary?.averageLetterGrade ||
                    (dashboardData?.academics?.averageScore != null
                      ? `${Math.round(Number(dashboardData.academics.averageScore))}%`
                      : "N/A")}
                </p>
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
                <p className="text-2xl font-bold text-green-800">KES {Math.round(paid).toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-orange-800">KES {Math.round(outstanding).toLocaleString()}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Assessed (Year)</p>
              <p className="text-2xl font-bold text-blue-800">KES {Math.round(assessed).toLocaleString()}</p>
            </div>
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

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
            {(dashboardData?.recentActivities || []).length > 0 ? (
              (dashboardData.recentActivities as any[]).map((activity: any) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-500">
                      {activity.date ? new Date(activity.date).toLocaleString("en-GB") : "—"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent activity yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  };

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
                <span className="text-green-900 font-semibold">
                  {dashboardData?.student?.classTeacherName || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-purple-700">Total Students</span>
                <span className="text-purple-900 font-semibold">
                  {dashboardData?.student?.classStudentCount ?? "N/A"}
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <span className="font-medium text-orange-700">Academic Year</span>
                <span className="text-orange-900 font-semibold">
                  {gradePayload?.summary?.academicYear || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
                <span className="font-medium text-indigo-700">Current Term</span>
                <span className="text-indigo-900 font-semibold">
                  {gradePayload?.summary?.term || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg">
                <span className="font-medium text-teal-700">Class Position</span>
                <span className="text-teal-900 font-semibold">N/A</span>
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
            {(dashboardData?.academics?.subjects || []).length > 0 ? (
              (dashboardData.academics.subjects as any[]).map((subject: any) => (
              <div key={subject.name} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    {subject.latestGrade || "N/A"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">Teacher: {subject.teacherName || "N/A"}</p>
              </div>
            ))
            ) : (
              <p className="text-sm text-gray-500">No subject records found yet.</p>
            )}
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
            {(gradePayload?.results || []).length > 0 ? (
              gradePayload.results.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.passStatus ? "bg-green-500" : "bg-red-500"}`}></div>
                    <span className="font-medium text-gray-900">{item.subject?.name || "Subject"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">{Math.round(item.percentage)}%</span>
                    <Badge className={item.passStatus ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {item.letterGrade}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No published grading results yet.</p>
            )}
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
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{gradePayload?.summary?.averageScore ?? 0}%</p>
              <p className="text-gray-500 text-sm">Overall Average Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderFinance = () => {
    const fmt = (n: number) => `KES ${Math.round(Number(n) || 0).toLocaleString()}`;
    const terms = feePayload?.termBalances ?? [];
    const assessed = terms.reduce((s: number, t: any) => s + Number(t.totalAmount ?? 0), 0);
    const paidSum = terms.reduce((s: number, t: any) => s + Number(t.paidAmount ?? 0), 0);
    const outstanding = Number(feePayload?.outstanding ?? 0);
    const arrears = Number(feePayload?.arrears ?? 0);

    return (
      <div className="space-y-6">
        <Card className="border-slate-200/80 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <DollarSign className="w-5 h-5 text-teal-700" />
              Fees & payments
            </CardTitle>
            <CardDescription className="text-slate-600">
              Balances match the school records for the current academic year view.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {financeLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading fee summary…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                  <div className="p-3 sm:p-4 rounded-xl border border-emerald-100 bg-[#f4faf8] min-h-[80px] flex flex-col justify-center">
                    <p className="text-xs sm:text-sm font-medium text-emerald-800 truncate">Assessed (year)</p>
                    <p className="text-lg sm:text-2xl font-bold text-emerald-950 truncate">{fmt(assessed)}</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl border border-teal-100 bg-teal-50/50 min-h-[80px] flex flex-col justify-center">
                    <p className="text-xs sm:text-sm font-medium text-teal-800 truncate">Paid</p>
                    <p className="text-lg sm:text-2xl font-bold text-teal-950 truncate">{fmt(paidSum)}</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl border border-amber-100 bg-amber-50/60 min-h-[80px] flex flex-col justify-center">
                    <p className="text-xs sm:text-sm font-medium text-amber-900 truncate">Total outstanding</p>
                    <p className="text-lg sm:text-2xl font-bold text-amber-950 truncate">{fmt(outstanding)}</p>
                  </div>
                  <div className="p-3 sm:p-4 rounded-xl border border-slate-200 bg-slate-50/80 min-h-[80px] flex flex-col justify-center">
                    <p className="text-xs sm:text-sm font-medium text-slate-600 truncate">Prior arrears</p>
                    <p className="text-lg sm:text-2xl font-bold text-slate-900 truncate">{fmt(arrears)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 mb-1">Payment history</h3>
                  <p className="text-sm text-slate-600 mb-3">
                    Recent payments recorded against your account (newest first in the list below).
                  </p>
                  {(feePayload?.paymentHistory?.length ?? 0) === 0 ? (
                    <p className="text-sm text-slate-500 py-4">No payments recorded yet for this view.</p>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {[...(feePayload.paymentHistory as any[])].reverse().map((p: any) => (
                        <div
                          key={p.id}
                          className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg border border-slate-100 bg-slate-50/50"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{fmt(p.amount)}</p>
                            <p className="text-xs text-slate-600">
                              {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-GB") : "—"}
                              {p.receiptNumber ? ` · ${p.receiptNumber}` : ""}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-slate-700 border-slate-200">
                            {p.paymentMethod || "Payment"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3 mt-8">
                  <h3 className="font-semibold text-slate-900 mb-3">Term breakdown</h3>
                  {terms.length === 0 ? (
                    <p className="text-sm text-slate-500">No term fee rows for this period.</p>
                  ) : (
                    terms.map((t: any, index: number) => {
                      const bal = Number(t.balance ?? 0);
                      const status =
                        bal <= 0 ? "Settled" : bal < Number(t.totalAmount ?? 0) ? "Partial" : "Due";
                      return (
                        <div
                          key={`${t.term}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-white"
                        >
                          <div>
                            <span className="font-medium text-slate-900">{t.term}</span>
                            <p className="text-sm text-slate-600">
                              Assessed {fmt(Number(t.totalAmount ?? 0))}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-medium text-slate-900">{fmt(Number(t.paidAmount ?? 0))} paid</span>
                            <Badge
                              className={`ml-2 ${
                                status === "Settled"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : status === "Partial"
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-red-100 text-red-900"
                              }`}
                            >
                              {status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {student?.id ? (
          <FeesStatementDownload
            schoolCode={params.schoolCode}
            studentId={student.id}
            studentName={student.name || "Student"}
            admissionNumber={student.admissionNumber || "N/A"}
            gradeName={student.gradeName || "N/A"}
            className={student.className || "N/A"}
          />
        ) : null}
      </div>
    );
  };

  const renderReceipts = () => {
    const code = encodeURIComponent(params.schoolCode);
    return (
      <div className="space-y-6">
        <Card className="border-slate-200/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Receipt className="w-5 h-5 text-teal-700" />
              Payment receipts
            </CardTitle>
            <CardDescription className="text-slate-600">
              View a receipt in the browser or download a PDF (same formats as the bursar office).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {receiptsLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                Loading receipts…
              </div>
            ) : receiptsList.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No receipts found yet.</p>
            ) : (
              <div className="space-y-3">
                {receiptsList.map((r: any) => {
                  const rn = encodeURIComponent(r.receiptNumber || "");
                  const viewUrl = `/api/schools/${code}/receipts/${rn}/view`;
                  const dlA4 = `/api/schools/${code}/receipts/${rn}/download?size=A4`;
                  return (
                    <div
                      key={r.id || r.receiptNumber}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border border-slate-100 rounded-xl bg-slate-50/30 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Receipt className="w-5 h-5 text-teal-700 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900">{r.receiptNumber || "Receipt"}</p>
                          <p className="text-sm text-slate-600">
                            {r.term || "—"} ·{" "}
                            {r.paymentDate
                              ? new Date(r.paymentDate).toLocaleDateString("en-GB")
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900 mr-2">
                          KES {Number(r.amount ?? 0).toLocaleString()}
                        </span>
                        <Button size="sm" variant="outline" asChild className="border-slate-200">
                          <a href={viewUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </a>
                        </Button>
                        <Button size="sm" variant="outline" asChild className="border-slate-200">
                          <a href={dlA4} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

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
                <p className="text-2xl font-bold text-green-800">
                  {dashboardData?.attendance?.attendanceRate != null
                    ? `${dashboardData.attendance.attendanceRate}%`
                    : "N/A"}
                </p>
                <p className="text-sm text-green-600">Attendance Rate</p>
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-800">
                  {dashboardData?.attendance?.daysPresent ?? "N/A"}
                </p>
                <p className="text-sm text-blue-600">Days Present</p>
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-800">
                  {dashboardData?.attendance?.daysAbsent ?? "N/A"}
                </p>
                <p className="text-sm text-orange-600">Days Absent</p>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-800">
                  {dashboardData?.attendance?.lateArrivals ?? "N/A"}
                </p>
                <p className="text-sm text-purple-600">Late Arrivals</p>
              </div>
            </div>
          </div>

          {/* Monthly Attendance */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">This Month</h3>
            <p className="text-sm text-gray-500">
              Daily attendance timeline will appear once attendance records are enabled for this school.
            </p>
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
            {(dashboardData?.notifications || []).length > 0 ? (
              (dashboardData.notifications as any[]).map((notification: any) => (
              <div key={notification.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full mt-2 bg-blue-500"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900">{notification.title || "Notification"}</h3>
                    <span className="text-xs text-gray-500">
                      {notification.createdAt
                        ? new Date(notification.createdAt).toLocaleString("en-GB")
                        : "—"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{notification.message || "No details provided."}</p>
                </div>
              </div>
            ))
            ) : (
              <p className="text-sm text-gray-500">No notifications available at the moment.</p>
            )}
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100/90 via-white/85 to-slate-200/90 backdrop-blur-sm">
      <StudentSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme={schoolData?.colorTheme || "#10b981"}
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
                <span className="font-bold text-lg" style={{ color: theme.primaryDark }}>Student Portal</span>
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
                      ? "text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{
                    color: isActive ? theme.primary : undefined,
                    backgroundColor: isActive ? hexToRgba(theme.primary, 0.12) : undefined,
                  }}
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