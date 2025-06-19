"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ParentsListPage({ params }: { params: { schoolCode: string } }) {
  const { schoolCode } = params;
  const [parents, setParents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Simulate fetching parents from students in localStorage
    const schools = JSON.parse(localStorage.getItem("schools-data") || "{}");
    const school = schools[schoolCode?.toLowerCase()];
    if (!school || !school.students) return;
    // Group by parent phone/email
    const parentMap: Record<string, any> = {};
    school.students.forEach((student: any) => {
      const key = student.parentPhone + (student.parentEmail || "");
      if (!parentMap[key]) {
        parentMap[key] = {
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          students: [],
        };
      }
      parentMap[key].students.push({ name: student.name, admissionNumber: student.admissionNumber });
    });
    setParents(Object.values(parentMap));
  }, [schoolCode]);

  const filteredParents = parents.filter((p) =>
    (p.parentName || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.parentPhone || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.parentEmail || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <Card className="w-full max-w-5xl rounded-2xl shadow-2xl bg-white/95 p-10 flex flex-col items-center">
        <CardHeader>
          <CardTitle className="text-3xl font-extrabold text-blue-800 mb-6 text-center">Parents List</CardTitle>
        </CardHeader>
        <CardContent className="w-full">
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <Input
              placeholder="Search by parent name, phone, or email"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border">Parent Name</th>
                  <th className="px-4 py-2 border">Phone</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">Linked Student(s)</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredParents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">No parents found</td>
                  </tr>
                ) : (
                  filteredParents.map((parent, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 border font-semibold">{parent.parentName}</td>
                      <td className="px-4 py-2 border">{parent.parentPhone}</td>
                      <td className="px-4 py-2 border">{parent.parentEmail || <span className="text-gray-400">-</span>}</td>
                      <td className="px-4 py-2 border">
                        {parent.students.map((s: any) => (
                          <div key={s.admissionNumber} className="mb-1">
                            {s.name} <span className="text-xs text-gray-500">({s.admissionNumber})</span>
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-2 border text-center">
                        <Button size="sm" variant="outline">View</Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 