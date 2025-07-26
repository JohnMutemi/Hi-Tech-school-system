import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function PerformanceSection(props: any) {
  return (
    <div className="space-y-8">
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800"><BarChart2 className="w-6 h-6 text-green-600" /> Academic Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-sm">Performance data coming soon.</div>
        </CardContent>
      </Card>
    </div>
  );
} 