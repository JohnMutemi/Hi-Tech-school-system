"use client";

import { useParentDashboard } from "@/components/parent-dashboard/useParentDashboard";
import { ParentSidebar } from "@/components/parent-dashboard/ParentSidebar";
import OverviewSection from "@/components/parent-dashboard/OverviewSection";
import ChildrenSection from "@/components/parent-dashboard/ChildrenSection";
import FeesSection from "@/components/parent-dashboard/FeesSection";
import ReceiptsSection from "@/components/parent-dashboard/ReceiptsSection";
import PerformanceSection from "@/components/parent-dashboard/PerformanceSection";
import SettingsSection from "@/components/parent-dashboard/SettingsSection";
import { useState, useEffect } from "react";

export default function ParentDashboard({ schoolCode, parentId }: { schoolCode: string; parentId?: string }) {
  console.log("HI-TECH-SCHOOL-SYSTEM parent dashboard file loaded!");
  const dashboard = useParentDashboard(schoolCode, parentId);
  const { activeTab, setActiveTab, parent, avatarUploading, avatarError, avatarUrl, handleAvatarChange, handleLogout } = dashboard;

  // LIFTED STATE: selectedId for child selection
  const [selectedId, setSelectedId] = useState(dashboard.students?.[0]?.id || "");

  useEffect(() => {
    if (selectedId) {
      dashboard.refreshPayments(selectedId);
    }
  }, [selectedId]);

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewSection {...dashboard} schoolCode={schoolCode} selectedId={selectedId} setSelectedId={setSelectedId} onAvatarChange={handleAvatarChange} avatarUploading={avatarUploading} avatarError={avatarError} avatarUrl={avatarUrl} />;
      case "children":
        return <ChildrenSection {...dashboard} />;
      case "fees":
        return <FeesSection
          schoolCode={schoolCode}
          students={dashboard.students}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          payments={dashboard.payments}
          loadingPayments={dashboard.loadingPayments}
          paymentsError={dashboard.paymentsError}
          refreshPayments={dashboard.refreshPayments}
        />;
      case "receipts":
        return <ReceiptsSection
          students={dashboard.students}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          schoolCode={schoolCode}
          payments={dashboard.payments}
          loadingPayments={dashboard.loadingPayments}
          paymentsError={dashboard.paymentsError}
          refreshPayments={dashboard.refreshPayments}
        />;
      case "performance":
        return <PerformanceSection {...dashboard} />;
      case "settings":
        return <SettingsSection {...dashboard} />;
      default:
        return <OverviewSection {...dashboard} schoolCode={schoolCode} selectedId={selectedId} setSelectedId={setSelectedId} onAvatarChange={handleAvatarChange} avatarUploading={avatarUploading} avatarError={avatarError} avatarUrl={avatarUrl} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-cyan-900 via-cyan-800 to-blue-900">
      <ParentSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="#0891b2"
        onLogout={handleLogout}
        parent={parent}
        onAvatarChange={handleAvatarChange}
        avatarUploading={avatarUploading}
        avatarError={avatarError}
        avatarUrl={avatarUrl}
      />
      <div className="flex-1 flex flex-col min-h-screen pl-0 lg:pl-28 xl:pl-40 2xl:pl-56 bg-cyan-50/60">
        {/* Main Header */}
        <header className="w-full px-4 sm:px-8 pt-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex flex-col">
            <span className="text-cyan-600 text-xl font-semibold">{parent?.schoolName || parent?.parentName || ''}</span>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center">
          <main className="w-full max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl border-8 border-white p-10 sm:p-14 lg:p-16 pt-16 flex flex-col justify-center" style={{minHeight: '75vh'}}>
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}