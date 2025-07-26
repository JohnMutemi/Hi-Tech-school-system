"use client";

import { useParentDashboard } from "@/components/parent-dashboard/useParentDashboard";
import { ParentSidebar } from "@/components/parent-dashboard/ParentSidebar";
import OverviewSection from "@/components/parent-dashboard/OverviewSection";
import ChildrenSection from "@/components/parent-dashboard/ChildrenSection";
import FeesSection from "@/components/parent-dashboard/FeesSection";
import ReceiptsSection from "@/components/parent-dashboard/ReceiptsSection";
import PerformanceSection from "@/components/parent-dashboard/PerformanceSection";
import SettingsSection from "@/components/parent-dashboard/SettingsSection";
import { useState } from "react";

export default function ParentDashboard({ schoolCode, parentId }: { schoolCode: string; parentId?: string }) {
  console.log("HI-TECH-SCHOOL-SYSTEM parent dashboard file loaded!");
  const dashboard = useParentDashboard(schoolCode, parentId);
  const { activeTab, setActiveTab, parent, avatarUploading, avatarError, avatarUrl, handleAvatarChange, handleLogout } = dashboard;

  // LIFTED STATE: selectedId for child selection
  const [selectedId, setSelectedId] = useState(dashboard.students?.[0]?.id || "");

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewSection {...dashboard} schoolCode={schoolCode} selectedId={selectedId} setSelectedId={setSelectedId} onAvatarChange={handleAvatarChange} avatarUploading={avatarUploading} avatarError={avatarError} avatarUrl={avatarUrl} />;
      case "children":
        return <ChildrenSection {...dashboard} />;
      case "fees":
        return <FeesSection schoolCode={schoolCode} students={dashboard.students} selectedId={selectedId} setSelectedId={setSelectedId} />;
      case "receipts":
        return <ReceiptsSection
          receipts={dashboard.receipts}
          loadingReceipts={dashboard.loadingReceipts}
          receiptsError={dashboard.receiptsError}
          receiptSearch={dashboard.receiptSearch}
          setReceiptSearch={dashboard.setReceiptSearch}
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full pb-24 lg:pb-8 bg-white rounded-3xl shadow-2xl mt-2 border-8 border-white">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}