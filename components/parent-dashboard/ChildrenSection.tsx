import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, User, GraduationCap, Calendar, Mail, Phone, MapPin } from "lucide-react";

export default function ChildrenSection(props: any) {
  const { students = [], schoolCode = "" } = props;
  const [selectedId, setSelectedId] = useState(students[0]?.id || "");
  const selectedStudent = students.find((child: any) => child.id === selectedId) || students[0];

  return (
    <div className="h-full flex flex-col space-y-8">
      <Card className="flex-1 bg-gradient-to-br from-blue-50/90 via-cyan-50/90 to-indigo-50/90 border-blue-200/60 shadow-lg backdrop-blur-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-blue-800 text-xl">
            <Users className="w-7 h-7 text-blue-600" /> 
            My Children
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 h-full flex flex-col">
          {students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium text-lg">No children found</p>
              <p className="text-gray-400 text-sm mt-2">Please contact the school administration to register your children.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6">
              {/* Enhanced Child Selection */}
              <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
                <label className="block text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Select Child</label>
                <select
                  className="w-full p-4 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-200 focus:border-blue-400 bg-white text-gray-900 text-lg font-medium transition-all duration-200"
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

              {/* Enhanced Student Details */}
              {selectedStudent && (
                <div className="flex-1 bg-white rounded-xl border-2 border-blue-100 overflow-hidden shadow-lg">
                  <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{selectedStudent.name || selectedStudent.user?.name || selectedStudent.id}</h3>
                        <p className="text-blue-100">Student Information</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Academic Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-blue-600" />
                          Academic Details
                        </h4>
                        
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Class:</span>
                            <span className="text-gray-900 font-semibold">
                              {selectedStudent.className || selectedStudent.classLevel || selectedStudent.class || "Not assigned"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Admission Number:</span>
                            <span className="text-gray-900 font-semibold">
                              {selectedStudent.admissionNumber || selectedStudent.studentId || "N/A"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Academic Year:</span>
                            <span className="text-gray-900 font-semibold">
                              {selectedStudent.academicYear || new Date().getFullYear()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-blue-600" />
                          Personal Details
                        </h4>
                        
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Date of Birth:</span>
                            <span className="text-gray-900 font-semibold">
                              {selectedStudent.dateOfBirth ? 
                                new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 
                                "Not provided"
                              }
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Gender:</span>
                            <span className="text-gray-900 font-semibold">
                              {selectedStudent.gender || "Not specified"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Status:</span>
                            <span className={`font-semibold px-2 py-1 rounded text-sm ${
                              selectedStudent.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedStudent.status || "Active"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    {(selectedStudent.email || selectedStudent.phone || selectedStudent.address) && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-gray-800 text-lg flex items-center gap-2 mb-4">
                          <Mail className="w-5 h-5 text-blue-600" />
                          Contact Information
                        </h4>
                        
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                          {selectedStudent.email && (
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 font-medium">Email:</span>
                              <span className="text-gray-900">{selectedStudent.email}</span>
                            </div>
                          )}
                          
                          {selectedStudent.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 font-medium">Phone:</span>
                              <span className="text-gray-900">{selectedStudent.phone}</span>
                            </div>
                          )}
                          
                          {selectedStudent.address && (
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-600 font-medium">Address:</span>
                              <span className="text-gray-900">{selectedStudent.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 