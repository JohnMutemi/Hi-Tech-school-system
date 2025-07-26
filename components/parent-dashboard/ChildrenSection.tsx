import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function ChildrenSection(props: any) {
  const { students = [] } = props;
  const [selectedId, setSelectedId] = useState(students[0]?.id || "");
  const selectedStudent = students.find((child: any) => child.id === selectedId) || students[0];

  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200 shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Users className="w-6 h-6 text-blue-600" /> My Children
          </CardTitle>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="text-gray-500 text-sm">No children found.</div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Select Dropdown */}
              <div className="w-full sm:w-64 mb-4 sm:mb-0">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Child</label>
                <select
                  className="w-full p-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-900"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                >
                  {students.map((child: any) => (
                    <option key={child.id} value={child.id}>
                      {child.name || child.user?.name || child.id}
                    </option>
                  ))}
                </select>
              </div>
              {/* Student Details */}
              {selectedStudent && (
                <div className="flex-1 bg-white rounded-xl border border-blue-100 p-6 shadow-md">
                  <div className="text-lg font-bold text-blue-800 mb-2">{selectedStudent.name || selectedStudent.user?.name || selectedStudent.id}</div>
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Class:</span> {selectedStudent.className || selectedStudent.classLevel || "-"}
                  </div>
                  {/* Add more details as needed */}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 