"use client";

import React, { useState } from 'react';
import { EnhancedReceipt } from '@/components/ui/enhanced-receipt';
import { Button } from '@/components/ui/button';

export default function TestEnhancedReceipt() {
  const [showReceipt, setShowReceipt] = useState(false);

  const sampleReceiptData = {
    receiptNumber: "RCP-1755259422860-B61XST",
    paymentId: "e894cee4-f4f1-4a23-bfbe-26cb98964166",
    studentId: "student-123",
    schoolCode: "mal9148",
    amount: 8000,
    paymentMethod: "MANUAL",
    feeType: "School Fees",
    term: "Term 1",
    academicYear: "2025",
    reference: "PAY-1755259415611-c9lbkzb3z",
    phoneNumber: "254700000000",
    transactionId: "TXN-123456789",
    status: "PENDING",
    issuedAt: new Date("2025-08-15T15:03:00"),
    issuedBy: "Bursar",
    schoolName: "Malioni Primary",
    studentName: "Quis quaerat dolorem",
    admissionNumber: "Est cum quo tempore",
    parentName: "Ipsum laudantium o",
    currency: "KES",
    termOutstandingBefore: 11000,
    termOutstandingAfter: 3000,
    academicYearOutstandingBefore: 27000,
    academicYearOutstandingAfter: 19000,
    carryForward: 0
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Enhanced Receipt Test</h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates the new enhanced receipt component with beautiful styling, 
            curled edges, and consistent formatting across all download formats (A3, A4, A5).
          </p>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-700">Sample Receipt Data:</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm text-gray-700 overflow-x-auto">
                {JSON.stringify(sampleReceiptData, null, 2)}
              </pre>
            </div>
            
            <Button 
              onClick={() => setShowReceipt(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
            >
              View Enhanced Receipt
            </Button>
          </div>
        </div>

        {showReceipt && (
          <EnhancedReceipt
            receiptData={sampleReceiptData}
            onClose={() => setShowReceipt(false)}
            showActions={true}
          />
        )}
      </div>
    </div>
  );
}
