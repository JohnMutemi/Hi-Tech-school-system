import React, { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart2, TrendingUp, Award, Target } from "lucide-react";

export default function PerformanceSection(props: any) {
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    if (!props?.schoolCode) return;
    (async () => {
      const response = await fetch(
        `/api/schools/${encodeURIComponent(props.schoolCode)}/parents/grading/results`,
        { credentials: "include" }
      );
      if (response.ok) {
        const payload = await response.json();
        setRows(payload.data || []);
      }
    })();
  }, [props?.schoolCode]);

  const overallAverage = useMemo(() => {
    if (!rows.length) return 0;
    const sum = rows.reduce((acc, item) => acc + Number(item.average || 0), 0);
    return Math.round(sum / rows.length);
  }, [rows]);

  return (
    <div className="h-full flex flex-col space-y-8">
      <Card className="flex-1 bg-gradient-to-br from-cyan-50/90 via-blue-50/90 to-indigo-50/90 border-cyan-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-cyan-800 text-xl">
            <BarChart2 className="w-7 h-7 text-cyan-600" /> 
            Academic Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-white/70 rounded-lg p-8 border border-cyan-100 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 text-center">
                <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-blue-700 font-semibold text-sm">Children Tracked</p>
                <p className="text-blue-600 text-lg font-bold">{rows.length}</p>
              </div>
              <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 text-center">
                <TrendingUp className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-indigo-700 font-semibold text-sm">Overall Average</p>
                <p className="text-indigo-600 text-lg font-bold">{overallAverage}%</p>
              </div>
              <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100 text-center">
                <Award className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                <p className="text-cyan-700 font-semibold text-sm">Total Results</p>
                <p className="text-cyan-600 text-lg font-bold">
                  {rows.reduce((acc, item) => acc + Number(item.resultCount || 0), 0)}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {rows.length > 0 ? (
                rows.map((row) => (
                  <div key={row.studentId} className="rounded-lg border border-cyan-100 bg-white p-4">
                    <p className="font-semibold text-slate-900">{row.studentName}</p>
                    <p className="text-sm text-slate-600">
                      Average: {row.average}% | Passed: {row.passCount}/{row.resultCount}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No grading data available yet for your children.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 