import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Users, DollarSign, Receipt, Activity, ArrowRight, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OverviewSection(props: any) {
  const { parent, students = [], setActiveTab, onAvatarChange, avatarUploading, avatarError, avatarUrl, schoolCode, selectedId, setSelectedId } = props;
  const selectedStudent = students.find((child: any) => child.id === selectedId) || students[0];
  const [feeData, setFeeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedId) return; // Only fetch if a child is selected
    async function fetchFeeData() {
      if (!selectedStudent) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/schools/${schoolCode}/students/${selectedStudent.id}/fees`);
        const data = await res.json();
        setFeeData(data);
        console.log('OverviewSection feeData', data); // <-- Debug log
      } catch {
        setFeeData(null);
      }
      setLoading(false);
    }
    fetchFeeData();
  }, [schoolCode, selectedStudent, selectedId]);

  const numChildren = students.length;

  return (
    <div className="space-y-6 h-full overflow-y-auto min-h-screen pb-8">
      {/* Compact Parent Profile Card */}
      <Card className="bg-gradient-to-br from-cyan-50/90 via-blue-50/90 to-teal-50/90 border-cyan-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-cyan-800 text-lg">
            <Users className="w-6 h-6 text-cyan-600" />
            {`Welcome, ${parent?.name || parent?.parentName || 'Parent'}!`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="relative group flex-shrink-0">
              <Avatar className="w-20 h-20 border-4 border-cyan-200 shadow-xl rounded-full">
                <img src={parent?.avatarUrl || avatarUrl || "/placeholder-user.jpg"} alt={parent?.parentName} className="rounded-full w-full h-full object-cover" />
                <div className="bg-cyan-600 text-white text-xl font-semibold flex items-center justify-center w-full h-full rounded-full">
                  {parent?.parentName?.charAt(0) || "P"}
                </div>
                {onAvatarChange && (
                  <label
                    className="absolute bottom-0 right-0 bg-cyan-600 text-white rounded-full p-1.5 cursor-pointer shadow-lg group-hover:scale-110 transition-transform duration-200"
                    title="Change profile picture"
                  >
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onAvatarChange}
                      disabled={avatarUploading}
                    />
                    <Camera className="w-3 h-3" />
                  </label>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                    <span className="text-cyan-600 text-xs font-bold">Uploading...</span>
                  </div>
                )}
              </Avatar>
              {avatarError && (
                <div className="absolute left-0 right-0 -bottom-6 text-xs text-red-600 text-center">
                  {avatarError}
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="bg-white/70 rounded-lg p-3 border border-cyan-100">
                    <span className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Full Name</span>
                    <p className="text-gray-900 text-base font-medium mt-1">{parent?.name || parent?.parentName || "N/A"}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-cyan-100">
                    <span className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Phone Number</span>
                    <p className="text-gray-900 text-base font-medium mt-1">{parent?.phone || parent?.parentPhone || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="bg-white/70 rounded-lg p-3 border border-cyan-100">
                    <span className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Email Address</span>
                    <p className="text-gray-900 text-base font-medium mt-1 break-all">{parent?.email || parent?.parentEmail || "N/A"}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3 border border-cyan-100">
                    <span className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Children Enrolled</span>
                    <p className="text-gray-900 text-base font-medium mt-1">{numChildren} {numChildren === 1 ? 'Child' : 'Children'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compact Fee Structure Section */}
      <Card className="bg-gradient-to-br from-blue-50/90 via-cyan-50/90 to-indigo-50/90 border-blue-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-blue-800 text-lg">
            <DollarSign className="w-6 h-6" />
            Fee Structure Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Compact Child Selection */}
          {students.length > 0 && (
            <div className="bg-white/70 rounded-lg p-3 border border-blue-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Select Child</label>
              <select
                className="w-full p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 bg-white text-gray-900 text-base font-medium transition-all duration-200"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">-- Select Child --</option>
                {students.map((child: any) => (
                  <option key={child.id} value={child.id}>
                    {child.name || child.user?.name || child.id}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Content Area */}
          <div className="min-h-[200px] flex flex-col justify-center">
            {!selectedId ? (
              <div className="text-center py-8">
                <DollarSign className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                <p className="text-blue-700 font-semibold text-base">Please select a child to view the fee structure.</p>
                <p className="text-blue-600 text-sm mt-1">Choose from the dropdown above to see detailed fee information.</p>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <svg className="animate-spin h-8 w-8 text-blue-600 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                </svg>
                <p className="text-blue-600 font-medium text-base">Loading fee structure...</p>
              </div>
            ) : Array.isArray(feeData) && feeData.length > 0 ? (
              <div className="bg-white rounded-lg border-2 border-blue-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold text-sm">Term</th>
                        <th className="px-4 py-3 text-left font-semibold text-sm">Academic Year</th>
                        <th className="px-4 py-3 text-left font-semibold text-sm">Fee Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-sm">Outstanding</th>
                        <th className="px-4 py-3 text-left font-semibold text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeData.map((term: any, idx: number) => (
                        <tr key={term.id || idx} className={`border-b border-blue-100 ${idx % 2 === 0 ? 'bg-blue-25' : 'bg-white'} hover:bg-blue-50 transition-colors duration-150`}>
                          <td className="px-4 py-3 font-medium text-gray-900 text-sm">{term.term || "-"}</td>
                          <td className="px-4 py-3 text-gray-700 text-sm">{term.year || "-"}</td>
                          <td className="px-4 py-3 font-semibold text-green-700 text-sm">Ksh {Number(term.totalAmount).toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-red-600 text-sm">Ksh {Number(term.balance ?? 0).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {Number(term.balance) > 0 ? 
                              <Badge variant="destructive" className="px-2 py-1 text-xs">Pending</Badge> : 
                              <Badge variant="default" className="px-2 py-1 text-xs bg-green-100 text-green-800">Cleared</Badge>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : feeData && feeData.termBalances && feeData.termBalances.length > 0 ? (
              <div className="bg-white rounded-lg border-2 border-blue-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                        <th className="px-4 py-3 text-left font-semibold text-sm">Term</th>
                        <th className="px-4 py-3 text-left font-semibold text-sm">Academic Year</th>
                        <th className="px-4 py-3 text-left font-semibold text-sm">Fee Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-sm">Outstanding</th>
                        <th className="px-4 py-3 text-left font-semibold text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeData.termBalances.map((term: any, idx: number) => (
                        <tr key={idx} className={`border-b border-blue-100 ${idx % 2 === 0 ? 'bg-blue-25' : 'bg-white'} hover:bg-blue-50 transition-colors duration-150`}>
                          <td className="px-4 py-3 font-medium text-gray-900 text-sm">{term.term || "-"}</td>
                          <td className="px-4 py-3 text-gray-700 text-sm">{term.year || "-"}</td>
                          <td className="px-4 py-3 font-semibold text-green-700 text-sm">Ksh {Number(term.totalAmount).toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-red-600 text-sm">Ksh {Number(term.balance).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            {Number(term.balance) > 0 ? 
                              <Badge variant="destructive" className="px-2 py-1 text-xs">Pending</Badge> : 
                              <Badge variant="default" className="px-2 py-1 text-xs bg-green-100 text-green-800">Cleared</Badge>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium text-base">No fee structure found for this student.</p>
                <p className="text-gray-400 text-sm mt-1">Please contact the school administration for assistance.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 