"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet } from "lucide-react";
import { downloadStudentsExcel, sampleStudentData } from "@/lib/excel-utils";

interface DownloadStudentsExcelProps {
  students?: any[];
  filename?: string;
  buttonText?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function DownloadStudentsExcel({
  students = sampleStudentData,
  filename = "students_data.xlsx",
  buttonText = "Download Excel",
  variant = "default",
  size = "default",
  className = ""
}: DownloadStudentsExcelProps) {
  
  const handleDownload = () => {
    try {
      downloadStudentsExcel(students, filename);
    } catch (error) {
      console.error("Failed to download Excel file:", error);
      alert("Failed to download Excel file. Please try again.");
    }
  };

  return (
    <Button
      onClick={handleDownload}
      variant={variant}
      size={size}
      className={className}
    >
      <FileSpreadsheet className="w-4 h-4 mr-2" />
      {buttonText}
    </Button>
  );
}

// Alternative component with more customization options
export function DownloadStudentsCard() {
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <FileSpreadsheet className="w-8 h-8 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900">Student Data Export</h3>
          <p className="text-sm text-gray-500 mt-1">
            Download sample student data with 30 records across grades 1A-5A. 
            Includes complete information: names, admission numbers, emails, dates of birth, 
            gender, addresses, parent information, classes, status, and notes.
          </p>
          <div className="mt-4">
            <DownloadStudentsExcel 
              buttonText="Download Sample Data"
              variant="outline"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>File format:</strong> Microsoft Excel (.xlsx)</p>
          <p><strong>Records:</strong> 30 student entries</p>
          <p><strong>Columns:</strong> 12 data fields per student</p>
        </div>
      </div>
    </div>
  );
}