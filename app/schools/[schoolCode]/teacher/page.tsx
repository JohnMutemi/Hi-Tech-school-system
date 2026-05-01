"use client";

import { useEffect, useMemo, useState } from "react";
import { TeacherSidebar } from "@/components/teacher-dashboard/TeacherSidebar";
import TeacherGradingTab from "@/components/teacher-dashboard/TeacherGradingTab";
import { useParams, useRouter } from "next/navigation";

export default function TeacherPage() {
  const params = useParams<{ schoolCode: string }>();
  const router = useRouter();
  const schoolCode = params?.schoolCode;
  const [teacher, setTeacher] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [schoolTheme, setSchoolTheme] = useState("#3b82f6");

  useEffect(() => {
    async function loadData() {
      if (!schoolCode) return;
      setLoading(true);
      try {
        const [sessionRes, classesRes, schoolRes] = await Promise.all([
          fetch(`/api/schools/${encodeURIComponent(schoolCode)}/teachers/session`, {
            credentials: "include",
          }),
          fetch(`/api/schools/${encodeURIComponent(schoolCode)}/classes`),
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
        if (classesRes.ok) setClasses(await classesRes.json());
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
    () => classes.filter((cls) => cls.teacherId === teacher?.id),
    [classes, teacher?.id]
  );
  const classCount = assignedClasses.length;
  const studentCount = assignedClasses.reduce(
    (sum, cls) => sum + Number(cls.currentStudents ?? 0),
    0
  );

  let content = null;
  if (loading) {
    content = <div className="p-8">Loading teacher dashboard...</div>;
  } else if (activeTab === "overview") {
    content = (
      <div className="p-8 space-y-4">
        <h2 className="text-2xl font-semibold">Teacher Overview</h2>
        <p>Teacher: {teacher?.name ?? "N/A"}</p>
        <p>Assigned classes: {classCount}</p>
        <p>Total students in assigned classes: {studentCount}</p>
      </div>
    );
  } else if (activeTab === "classes") {
    content = (
      <div className="p-8 space-y-2">
        <h2 className="text-2xl font-semibold">Assigned Classes</h2>
        {assignedClasses.length === 0 ? (
          <p>No class assignments found.</p>
        ) : (
          assignedClasses.map((cls) => (
            <div key={cls.id} className="rounded border p-3">
              {cls.name} - {cls.grade?.name ?? "N/A"} ({cls.currentStudents ?? 0} students)
            </div>
          ))
        )}
      </div>
    );
  } else if (activeTab === "students") {
    content = <div className="p-8">Students are derived from assigned classes ({studentCount} total).</div>;
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
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 backdrop-blur-sm">
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
      <div className="flex-1">
        {content}
      </div>
    </div>
  );
}
