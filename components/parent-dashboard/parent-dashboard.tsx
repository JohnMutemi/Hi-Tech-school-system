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
    <div className="flex min-h-screen bg-gradient-to-br from-cyan-900 via-cyan-800 to-blue-900">
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
      <div className="flex-1 flex flex-col min-h-screen pl-0 lg:pl-28 xl:pl-40 2xl:pl-56">
        {/* Floating Date Widget with radiant styling - Sticky */}
        <div className="fixed top-4 right-4 z-40">
          <div className="bg-gradient-to-r from-cyan-500/90 via-blue-500/90 to-purple-500/90 backdrop-blur-md rounded-xl px-6 py-3 border border-white/40 shadow-2xl transform hover:scale-105 transition-all duration-300 animate-pulse">
            <div className="text-white font-bold text-sm">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-cyan-100 text-xs mt-1 opacity-80">
              {new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area with improved spacing */}
        <main className="flex-1 p-3 sm:p-4 pt-16 overflow-y-auto">
          <div className="max-w-7xl mx-auto h-full overflow-y-auto min-h-screen">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}