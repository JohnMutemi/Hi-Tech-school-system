"use client";

import AlumniSection from "@/components/school-portal/AlumniSection";

export default function TestAlumniPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Alumni Section Test
        </h1>
        <p className="text-gray-600">
          Testing the alumni section with sample school data
        </p>
      </div>
      
      <AlumniSection schoolCode="TEST001" />
    </div>
  );
} 