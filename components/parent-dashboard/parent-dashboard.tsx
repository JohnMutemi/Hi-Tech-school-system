"use client";

import { useParentDashboard } from "@/components/parent-dashboard/useParentDashboard";
import { ParentSidebar } from "@/components/parent-dashboard/ParentSidebar";
import StickyHeader from "@/components/parent-dashboard/StickyHeader";
import OverviewSection from "@/components/parent-dashboard/OverviewSection";
import ChildrenSection from "@/components/parent-dashboard/ChildrenSection";
import FeesManagement from "@/components/parent-dashboard/FeesManagement";
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
        return <FeesManagement 
          students={dashboard.students}
          schoolCode={schoolCode}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
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
    <div className="flex min-h-screen bg-gradient-to-br from-emerald-900 via-slate-800 to-emerald-800 relative">
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #059669 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, #6ee7b7 0%, transparent 70%)`,
          backgroundSize: '400px 400px, 300px 300px, 500px 500px'
        }}></div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-20 h-20 bg-emerald-400/10 rounded-full blur-xl"></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-emerald-300/8 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-emerald-500/6 rounded-full blur-xl"></div>
      </div>
      
      <ParentSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        colorTheme="#10b981"
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
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-6 lg:p-10 min-h-[calc(100vh-200px)] relative z-10">
              {/* Content Header */}
              <div className="mb-8 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full"></div>
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