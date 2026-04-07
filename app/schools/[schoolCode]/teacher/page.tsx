"use client";

import { useEffect, useMemo, useState } from "react";
import { TeacherSidebar } from "@/components/teacher-dashboard/TeacherSidebar";
import { useParams, useRouter } from "next/navigation";

export default function TeacherPage() {
  const params = useParams<{ schoolCode: string }>();
  const router = useRouter();
  const schoolCode = params?.schoolCode;
  const [teacher, setTeacher] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadData() {
      if (!schoolCode) return;
      setLoading(true);
      try {
        const [sessionRes, classesRes] = await Promise.all([
          fetch(`/api/schools/${encodeURIComponent(schoolCode)}/teachers/session`, {
            credentials: "include",
          }),
          fetch(`/api/schools/${encodeURIComponent(schoolCode)}/classes`),
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
      } else {
    content = <div className="p-8">Coming soon...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50/90 via-white/80 to-indigo-50/90 backdrop-blur-sm">
      <TeacherSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="#3b82f6"
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
