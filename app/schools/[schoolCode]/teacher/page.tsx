"use client";

import { useState } from "react";
import { TeacherSidebar } from "@/components/teacher-dashboard/TeacherSidebar";

export default function TeacherPage() {
  // Use placeholder teacher info since session API is removed
  const teacher = { id: "", name: "Teacher", email: "", qualification: "", dateJoined: "" };
  const classCount = 0;
  const studentCount = 0;
  const [activeTab, setActiveTab] = useState("overview");

  let content = null;
  if (activeTab === "overview") {
    content = <div className="p-8">Overview (placeholder)</div>;
  } else if (activeTab === "classes") {
    content = <div className="p-8">Classes (placeholder)</div>;
  } else if (activeTab === "students") {
    content = <div className="p-8">Students (placeholder)</div>;
      } else {
    content = <div className="p-8">Coming soon...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <TeacherSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="#3b82f6"
        onLogout={() => {}}
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
