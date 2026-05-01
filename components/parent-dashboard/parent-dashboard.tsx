"use client";

import { useParentDashboard } from "@/components/parent-dashboard/useParentDashboard";
import { ParentSidebar } from "@/components/parent-dashboard/ParentSidebar";
import StickyHeader from "@/components/parent-dashboard/StickyHeader";
import OverviewSection from "@/components/parent-dashboard/OverviewSection";
import ChildrenSection from "@/components/parent-dashboard/ChildrenSection";
import FeesManagement from "@/components/parent-dashboard/FeesManagement";
import ReceiptsSection from "@/components/parent-dashboard/ReceiptsSection";
import PerformanceSection from "@/components/parent-dashboard/PerformanceSection";
import SettingsSection from "@/components/parent-dashboard/SettingsSection";
import { useState, useEffect, useMemo } from "react";
import {
  portalAccentHex,
  portalGlassPanel,
} from "@/components/layout/portal-glass-styles";

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

  const accent = useMemo(
    () => portalAccentHex(dashboard.schoolColorTheme, "#10b981"),
    [dashboard.schoolColorTheme]
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewSection {...dashboard} schoolCode={schoolCode} selectedId={selectedId} setSelectedId={setSelectedId} onAvatarChange={handleAvatarChange} avatarUploading={avatarUploading} avatarError={avatarError} avatarUrl={avatarUrl} />;
      case "children":
        return <ChildrenSection {...dashboard} />;
      case "fees":
        return (
          <FeesManagement
            students={dashboard.students}
            schoolCode={schoolCode}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
            schoolCurrentAcademicYear={dashboard.currentAcademicYear?.name}
          />
        );
      case "receipts":
        return <ReceiptsSection 
          receipts={dashboard.receipts}
          students={dashboard.students}
          schoolCode={schoolCode}
          loading={dashboard.loadingReceipts}
          error={dashboard.receiptsError}
          refreshReceipts={dashboard.fetchAllReceipts}
        />;
      case "performance":
        return <PerformanceSection {...dashboard} schoolCode={schoolCode} />;
      case "settings":
        return <SettingsSection {...dashboard} />;
      default:
        return <OverviewSection {...dashboard} schoolCode={schoolCode} selectedId={selectedId} setSelectedId={setSelectedId} onAvatarChange={handleAvatarChange} avatarUploading={avatarUploading} avatarError={avatarError} avatarUrl={avatarUrl} />;
    }
  };

  return (
    <div
      className="flex min-h-screen relative text-slate-100"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 55%, #0f172a) 0%, #0f172a 45%, color-mix(in srgb, ${accent} 40%, #020617) 100%)`,
      }}
    >
      {/* Enhanced Background Pattern (school accent from database) */}
      <div className="absolute inset-0 opacity-[0.12]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, ${accent} 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, ${accent} 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, ${accent} 0%, transparent 70%)`,
            backgroundSize: "400px 400px, 300px 300px, 500px 500px",
          }}
        />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-20 left-10 w-20 h-20 rounded-full blur-xl opacity-30"
          style={{ backgroundColor: accent }}
        />
        <div
          className="absolute top-40 right-20 w-32 h-32 rounded-full blur-2xl opacity-25"
          style={{ backgroundColor: accent }}
        />
        <div
          className="absolute bottom-20 left-1/4 w-24 h-24 rounded-full blur-xl opacity-20"
          style={{ backgroundColor: accent }}
        />
      </div>

      <ParentSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme={accent}
        onLogout={handleLogout}
        parent={parent}
        onAvatarChange={handleAvatarChange}
        avatarUploading={avatarUploading}
        avatarError={avatarError}
        avatarUrl={avatarUrl}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen lg:ml-64 relative overflow-y-auto">
        {/* Sticky Header Component */}
        <StickyHeader parent={parent} />

        {/* Main Content with Glass Effect */}
        <div className="flex-1 p-4 lg:p-8 space-y-6">
          <main className="w-full max-w-7xl mx-auto">
            {/* Glass Container */}
            <div
              className={`${portalGlassPanel} p-6 lg:p-10 min-h-[calc(100vh-200px)] relative z-10`}
            >
              {/* Content Header */}
              <div className="mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div
                    className="w-1 h-8 rounded-full"
                    style={{
                      background: `linear-gradient(to bottom, ${accent}, color-mix(in srgb, ${accent} 60%, #000))`,
                    }}
                  />
                  <h2 className="text-white text-xl lg:text-2xl font-semibold capitalize">
                    {activeTab === 'fees' ? 'Fee Management' : 
                     activeTab === 'children' ? 'My Children' :
                     activeTab === 'performance' ? 'Academic Performance' :
                     activeTab === 'settings' ? 'Account Settings' :
                     'Dashboard Overview'}
                  </h2>
                </div>
              </div>
              
              {/* Content Area with Enhanced Styling */}
              <div className="text-slate-100">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}