"use client";

import PromotionsSection from "@/components/school-portal/PromotionsSection";

export default function TestPromotionPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bulk Promotion System Test
        </h1>
        <p className="text-gray-600">
          Testing the 4-step promotion workflow with sample school data
        </p>
      </div>
      
      <PromotionsSection schoolCode="TEST001" />
    </div>
  );
} 