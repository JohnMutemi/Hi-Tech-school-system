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
        console.log("Overview feeData", data);
      } catch {
        setFeeData(null);
      }
      setLoading(false);
    }
    fetchFeeData();
  }, [schoolCode, selectedStudent, selectedId]);

  const numChildren = students.length;

  return (
    <div className="space-y-8">
      {/* Parent Profile Card */}
      <Card className="bg-gradient-to-br from-teal-50 to-emerald-50 border-emerald-200 mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-emerald-800">
            <Users className="w-6 h-6" />
            {`Welcome, ${parent?.name || parent?.parentName || 'Parent'}!`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-4 border-emerald-200 shadow-lg rounded-full">
                <img src={parent?.avatarUrl || avatarUrl || "/placeholder-user.jpg"} alt={parent?.parentName} className="rounded-full w-full h-full object-cover" />
                <div className="bg-emerald-600 text-white text-xl font-semibold flex items-center justify-center w-full h-full rounded-full">
                  {parent?.parentName?.charAt(0) || "P"}
                </div>
                {onAvatarChange && (
                  <label
                    className="absolute bottom-1 right-1 bg-emerald-600 text-white rounded-full p-1.5 cursor-pointer shadow-md group-hover:scale-110 transition"
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
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-full">
                    <span className="text-emerald-600 text-xs font-bold">Uploading...</span>
                  </div>
                )}
              </Avatar>
              {avatarError && (
                <div className="absolute left-0 right-0 -bottom-6 text-xs text-red-600 text-center">
                  {avatarError}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Name:</span>
                  <span className="ml-2 text-gray-900">{parent?.name || parent?.parentName || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Phone:</span>
                  <span className="ml-2 text-gray-900">{parent?.phone || parent?.parentPhone || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <span className="ml-2 text-gray-900">{parent?.email || parent?.parentEmail || "N/A"}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Children:</span>
                  <span className="ml-2 text-gray-900">{numChildren}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Structure Section (consistent with FeesSection) */}
      <Card className="bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200 shadow">
        <CardHeader>
          <CardTitle className="text-blue-800 text-lg">Fee Structure</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Select Child Dropdown here */}
          {students.length > 0 && (
            <div className="w-full sm:w-64 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
              <select
                className="w-full p-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
              >
                <option value="">-- Select --</option>
                {students.map((child: any) => (
                  <option key={child.id} value={child.id}>
                    {child.name || child.user?.name || child.id}
                  </option>
                ))}
              </select>
            </div>
          )}
          {/* Require selection before loading fee structure */}
          {!selectedId ? (
            <div className="text-blue-700 font-semibold">Please select a child to view the fee structure.</div>
          ) : loading ? (
            <div className="flex items-center gap-2 text-blue-600">
              <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>
              Loading fee structure...
            </div>
          ) : feeData && feeData.termBalances && feeData.termBalances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border rounded-xl bg-white">
                <thead>
                  <tr className="bg-blue-100">
                    <th className="px-2 py-1 text-left text-blue-800">Term</th>
                    <th className="px-2 py-1 text-left text-blue-800">Year</th>
                    <th className="px-2 py-1 text-left text-blue-800">Fee Amount</th>
                    <th className="px-2 py-1 text-left text-blue-800">Outstanding</th>
                    <th className="px-2 py-1 text-left text-blue-800">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {feeData.termBalances.map((term: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="px-2 py-1">{term.term || "-"}</td>
                      <td className="px-2 py-1">{term.year || "-"}</td>
                      <td className="px-2 py-1">Ksh {Number(term.totalAmount).toLocaleString()}</td>
                      <td className="px-2 py-1">Ksh {Number(term.balance).toLocaleString()}</td>
                      <td className="px-2 py-1">{Number(term.balance) > 0 ? <Badge variant="destructive">Pending</Badge> : <Badge variant="default">Cleared</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-gray-500">No fee structure found for this student.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 