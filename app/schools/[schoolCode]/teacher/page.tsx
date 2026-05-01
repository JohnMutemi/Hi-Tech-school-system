"use client";

import { useEffect, useMemo, useState } from "react";
import { TeacherSidebar } from "@/components/teacher-dashboard/TeacherSidebar";
import TeacherGradingTab from "@/components/teacher-dashboard/TeacherGradingTab";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, GraduationCap, Calendar, Bell } from "lucide-react";

export default function TeacherPage() {
  const params = useParams<{ schoolCode: string }>();
  const router = useRouter();
  const schoolCode = params?.schoolCode;
  const [teacher, setTeacher] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [schoolTheme, setSchoolTheme] = useState("#3b82f6");

  useEffect(() => {
    async function loadData() {
      if (!schoolCode) return;
      setLoading(true);
      try {
        const [sessionRes, dashboardRes, schoolRes] = await Promise.all([
          fetch(`/api/schools/${encodeURIComponent(schoolCode)}/teachers/session`, {
            credentials: "include",
          }),
          fetch(`/api/schools/${encodeURIComponent(schoolCode)}/teachers/dashboard`, {
            credentials: "include",
          }),
          fetch(`/api/schools/${encodeURIComponent(schoolCode)}`),
        ]);

        if (sessionRes.status === 401) {
          router.replace(`/schools/${encodeURIComponent(schoolCode)}/teachers/login`);
          return;
        }

        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setTeacher(sessionData.teacher ?? null);
        }
        if (dashboardRes.ok) {
          const dashboardPayload = await dashboardRes.json();
          const dashboardData = dashboardPayload?.data;
          setClasses(dashboardData?.assignedClasses ?? []);
          setSubjects(dashboardData?.subjects ?? []);
          setRecentActivities(dashboardData?.recentActivities ?? []);
          setNotifications(dashboardData?.notifications ?? []);
          setAttendanceData(dashboardData?.attendance ?? null);
          if (dashboardData?.teacher) setTeacher(dashboardData.teacher);
          if (dashboardData?.school?.colorTheme) setSchoolTheme(dashboardData.school.colorTheme);
        }
        if (schoolRes.ok) {
          const schoolData = await schoolRes.json();
          if (schoolData?.colorTheme) setSchoolTheme(schoolData.colorTheme);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [schoolCode, router]);

  const assignedClasses = useMemo(
    () => classes,
    [classes]
  );
  const classCount = assignedClasses.length;
  const studentCount = assignedClasses.reduce(
    (sum, cls) => sum + Number(cls.studentCount ?? cls.currentStudents ?? 0),
    0
  );

  let content = null;
  if (loading) {
    content = <div className="p-8">Loading teacher dashboard...</div>;
  } else if (activeTab === "overview") {
    content = (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <h2 className="text-xl sm:text-2xl font-semibold">Teacher Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-white/70 backdrop-blur-md border-white/40">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500">Teacher</p>
              <p className="text-base font-semibold text-slate-900">{teacher?.name ?? "N/A"}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-md border-white/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Classes</p>
                <GraduationCap className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-2xl font-semibold text-slate-900">{classCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-md border-white/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Students</p>
                <Users className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-2xl font-semibold text-slate-900">{studentCount}</p>
            </CardContent>
          </Card>
          <Card className="bg-white/70 backdrop-blur-md border-white/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Subjects</p>
                <BookOpen className="w-4 h-4 text-slate-600" />
              </div>
              <p className="text-2xl font-semibold text-slate-900">{subjects.length}</p>
            </CardContent>
          </Card>
        </div>
        <Card className="bg-white/70 backdrop-blur-md border-white/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-slate-500">No recent activity yet.</p>
            ) : (
              recentActivities.slice(0, 6).map((activity) => (
                <div key={activity.id} className="rounded-lg border border-slate-100 bg-white/70 px-3 py-2 text-sm text-slate-700">
                  {activity.text}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  } else if (activeTab === "classes") {
    content = (
      <div className="p-4 sm:p-6 lg:p-8 space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold">Assigned Classes</h2>
        {assignedClasses.length === 0 ? (
          <p>No class assignments found.</p>
        ) : (
          assignedClasses.map((cls) => (
            <div key={cls.id} className="rounded-xl border border-slate-200/70 bg-white/70 backdrop-blur-md p-3 sm:p-4">
              <p className="font-semibold text-slate-900">{cls.name}</p>
              <p className="text-sm text-slate-600">
                {cls.gradeName ?? cls.grade?.name ?? "N/A"} ({cls.studentCount ?? cls.currentStudents ?? 0} students)
              </p>
            </div>
          ))
        )}
      </div>
    );
  } else if (activeTab === "subjects") {
    content = (
      <div className="p-4 sm:p-6 lg:p-8 space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold">My Subjects</h2>
        {subjects.length === 0 ? (
          <p className="text-slate-500">No subjects assigned yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {subjects.map((subject) => (
              <Card key={subject.id} className="bg-white/70 backdrop-blur-md border-white/40">
                <CardContent className="p-4">
                  <p className="font-semibold text-slate-900">{subject.name}</p>
                  <p className="text-sm text-slate-600">{subject.code || "No code"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  } else if (activeTab === "students") {
    content = (
      <div className="p-4 sm:p-6 lg:p-8 space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold">My Students</h2>
        {assignedClasses.length === 0 ? (
          <p className="text-slate-500">No students yet because no classes are assigned.</p>
        ) : (
          assignedClasses.map((cls) => (
            <Card key={cls.id} className="bg-white/70 backdrop-blur-md border-white/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{cls.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(cls.students || []).length === 0 ? (
                  <p className="text-sm text-slate-500">No active students.</p>
                ) : (
                  (cls.students || []).map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white/70 px-3 py-2 text-sm">
                      <span className="font-medium text-slate-800">{student.name}</span>
                      <Badge variant="outline" className="text-xs">{student.admissionNumber}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    );
  } else if (activeTab === "attendance") {
    content = (
      <div className="p-4 sm:p-6 lg:p-8 space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Attendance
        </h2>
        <Card className="bg-white/70 backdrop-blur-md border-white/40">
          <CardContent className="p-4">
            {attendanceData ? (
              <pre className="text-xs overflow-auto">{JSON.stringify(attendanceData, null, 2)}</pre>
            ) : (
              <p className="text-sm text-slate-500">Attendance feed is not configured yet for this school.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  } else if (activeTab === "notifications") {
    content = (
      <div className="p-4 sm:p-6 lg:p-8 space-y-3">
        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications
        </h2>
        <Card className="bg-white/70 backdrop-blur-md border-white/40">
          <CardContent className="p-4">
            {notifications.length === 0 ? (
              <p className="text-sm text-slate-500">No notifications available right now.</p>
            ) : (
              notifications.map((notice) => (
                <div key={notice.id} className="rounded-lg border border-slate-100 bg-white/70 px-3 py-2">
                  <p className="text-sm font-medium text-slate-800">
                    {notice.title || "Notification"}
                  </p>
                  <p className="text-xs text-slate-600">
                    {notice.message || "No details provided."}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {notice.createdAt
                      ? new Date(notice.createdAt).toLocaleString("en-GB")
                      : ""}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    );
  } else if (activeTab === "grading") {
    content = (
      <TeacherGradingTab
        schoolCode={schoolCode || ""}
        teacher={teacher}
        assignedClasses={assignedClasses}
      />
    );
      } else {
    content = <div className="p-8">Coming soon...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-100/90 via-white/80 to-slate-200/90">
      <TeacherSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme={schoolTheme}
        onLogout={async () => {
          if (!schoolCode) return;
          await fetch(`/api/schools/${encodeURIComponent(schoolCode)}/teachers/logout`, {
            method: "POST",
          });
          router.replace(`/schools/${encodeURIComponent(schoolCode)}/teachers/login`);
        }}
        teacher={teacher}
        classCount={classCount}
        studentCount={studentCount}
        hasPromotionCriteria={false}
      />
      <div className="flex-1 min-w-0">
        {content}
      </div>
    </div>
  );
}
