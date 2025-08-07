"use client";

import { DownloadStudentsExcel, DownloadStudentsCard } from "@/components/DownloadStudentsExcel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemoExcelPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">📊 Excel Download Demo</h1>
          <p className="text-gray-600 mt-2">
            Download sample student data in Excel format with 30 complete student records.
          </p>
        </div>

        <div className="grid gap-8">
          {/* Quick Download Button */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Download</CardTitle>
              <CardDescription>
                Click the button below to immediately download the Excel file with sample student data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <DownloadStudentsExcel />
                <DownloadStudentsExcel 
                  buttonText="Download as CSV Format" 
                  filename="students_data.csv"
                  variant="outline"
                />
                <DownloadStudentsExcel 
                  buttonText="Custom Filename" 
                  filename="school_roster_2024.xlsx"
                  variant="secondary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Card */}
          <DownloadStudentsCard />

          {/* File Information */}
          <Card>
            <CardHeader>
              <CardTitle>📋 File Contents</CardTitle>
              <CardDescription>
                The Excel file contains the following data structure:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border border-gray-200 px-4 py-2 text-left">Column</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                      <th className="border border-gray-200 px-4 py-2 text-left">Example</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">Name</td>
                      <td className="border border-gray-200 px-4 py-2">Student full name</td>
                      <td className="border border-gray-200 px-4 py-2">Ethan Kipkorir</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-mono">Admission Number</td>
                      <td className="border border-gray-200 px-4 py-2">Unique student ID</td>
                      <td className="border border-gray-200 px-4 py-2">ADM101</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">Email</td>
                      <td className="border border-gray-200 px-4 py-2">Student email address</td>
                      <td className="border border-gray-200 px-4 py-2">ethan.kipkorir@school.com</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-mono">Date of Birth</td>
                      <td className="border border-gray-200 px-4 py-2">Birth date (YYYY-MM-DD)</td>
                      <td className="border border-gray-200 px-4 py-2">2013-02-17</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">Gender</td>
                      <td className="border border-gray-200 px-4 py-2">Male/Female</td>
                      <td className="border border-gray-200 px-4 py-2">Male</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-mono">Address</td>
                      <td className="border border-gray-200 px-4 py-2">Home address</td>
                      <td className="border border-gray-200 px-4 py-2">42 Main St</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">Parent Name</td>
                      <td className="border border-gray-200 px-4 py-2">Guardian/parent name</td>
                      <td className="border border-gray-200 px-4 py-2">Mercy Kipkorir</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-mono">Parent Email</td>
                      <td className="border border-gray-200 px-4 py-2">Guardian contact email</td>
                      <td className="border border-gray-200 px-4 py-2">mercy.kipkorir@email.com</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">Parent Phone</td>
                      <td className="border border-gray-200 px-4 py-2">Guardian contact number</td>
                      <td className="border border-gray-200 px-4 py-2">254711223344</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-mono">Class</td>
                      <td className="border border-gray-200 px-4 py-2">Current grade/class</td>
                      <td className="border border-gray-200 px-4 py-2">Grade 1A</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-200 px-4 py-2 font-mono">Status</td>
                      <td className="border border-gray-200 px-4 py-2">Enrollment status</td>
                      <td className="border border-gray-200 px-4 py-2">active</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border border-gray-200 px-4 py-2 font-mono">Notes</td>
                      <td className="border border-gray-200 px-4 py-2">Additional information</td>
                      <td className="border border-gray-200 px-4 py-2">New student</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>📊 Data Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">30</div>
                  <div className="text-sm text-blue-800">Total Students</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">5</div>
                  <div className="text-sm text-green-800">Grade Levels</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">12</div>
                  <div className="text-sm text-purple-800">Data Fields</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">100%</div>
                  <div className="text-sm text-orange-800">Active Status</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}