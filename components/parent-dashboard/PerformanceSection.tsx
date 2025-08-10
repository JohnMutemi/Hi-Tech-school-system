import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart2, TrendingUp, Award, Target } from "lucide-react";

export default function PerformanceSection(props: any) {
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
          <div className="bg-white/70 rounded-lg p-8 border border-cyan-100">
            <div className="text-center py-12">
              <div className="flex justify-center space-x-4 mb-6">
                <TrendingUp className="w-12 h-12 text-gray-300" />
                <BarChart2 className="w-12 h-12 text-gray-300" />
                <Award className="w-12 h-12 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium text-lg">Academic Performance Dashboard</p>
              <p className="text-gray-400 text-sm mt-2 max-w-md mx-auto">
                Student grades, progress reports, and performance analytics will be available here soon.
              </p>
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-blue-700 font-semibold text-sm">Grades</p>
                  <p className="text-blue-600 text-xs">Coming Soon</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
                  <TrendingUp className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                  <p className="text-indigo-700 font-semibold text-sm">Progress</p>
                  <p className="text-indigo-600 text-xs">Coming Soon</p>
                </div>
                <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100">
                  <Award className="w-8 h-8 text-cyan-500 mx-auto mb-2" />
                  <p className="text-cyan-700 font-semibold text-sm">Awards</p>
                  <p className="text-cyan-600 text-xs">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 