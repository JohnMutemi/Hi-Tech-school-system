import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, User, GraduationCap, Calendar, Mail, Phone, MapPin } from "lucide-react";

export default function ChildrenSection(props: any) {
  const { students = [], schoolCode = "" } = props;
  const [selectedId, setSelectedId] = useState(students[0]?.id || "");
  const selectedStudent = students.find((child: any) => child.id === selectedId) || students[0];

  return (
    <div className="h-full flex flex-col space-y-6">
      <Card className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="space-y-6 h-full flex flex-col p-6">
          {students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12">
              <Users className="w-16 h-16 text-slate-400 mb-4" />
              <p className="text-white font-medium text-lg">No children found</p>
              <p className="text-slate-300 text-sm mt-2">Please contact the school administration to register your children.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6">
              {/* Enhanced Child Selection */}
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                <label className="block text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">Select Child</label>
                <select
                  className="w-full p-4 border-2 border-white/30 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-300/50 focus:border-indigo-300 bg-white/10 backdrop-blur-sm text-white text-lg font-medium transition-all duration-200"
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                >
                  {students.map((child: any) => (
                    <option key={child.id} value={child.id} className="bg-slate-800 text-white">
                      {child.name || child.user?.name || child.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Enhanced Student Details */}
              {selectedStudent && (
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-xl border border-white/30 overflow-hidden shadow-xl">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center ring-2 ring-white/30">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">{selectedStudent.name || selectedStudent.user?.name || selectedStudent.id}</h3>
                        <p className="text-indigo-100">Student Information</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Academic Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-white text-lg flex items-center gap-2">
                          <GraduationCap className="w-5 h-5 text-indigo-300" />
                          Academic Details
                        </h4>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3 border border-white/20">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Class:</span>
                            <span className="text-white font-semibold">
                              {selectedStudent.className || selectedStudent.classLevel || selectedStudent.class || "Not assigned"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Admission Number:</span>
                            <span className="text-white font-semibold">
                              {selectedStudent.admissionNumber || selectedStudent.studentId || "N/A"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Academic Year:</span>
                            <span className="text-white font-semibold">
                              {selectedStudent.academicYear || new Date().getFullYear()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-white text-lg flex items-center gap-2">
                          <User className="w-5 h-5 text-indigo-300" />
                          Personal Details
                        </h4>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3 border border-white/20">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Date of Birth:</span>
                            <span className="text-white font-semibold">
                              {selectedStudent.dateOfBirth ? 
                                new Date(selectedStudent.dateOfBirth).toLocaleDateString() : 
                                "Not provided"
                              }
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Gender:</span>
                            <span className="text-white font-semibold">
                              {selectedStudent.gender || "Not specified"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-slate-300 font-medium">Status:</span>
                            <span className={`font-semibold px-3 py-1 rounded-full text-sm ${
                              selectedStudent.status === 'active' ? 'bg-green-500/80 text-white' : 'bg-slate-500/80 text-white'
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
                        <h4 className="font-semibold text-white text-lg flex items-center gap-2 mb-4">
                          <Mail className="w-5 h-5 text-indigo-300" />
                          Contact Information
                        </h4>
                        
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3 border border-white/20">
                          {selectedStudent.email && (
                            <div className="flex items-center gap-3">
                              <Mail className="w-4 h-4 text-indigo-300" />
                              <span className="text-slate-300 font-medium">Email:</span>
                              <span className="text-white">{selectedStudent.email}</span>
                            </div>
                          )}
                          
                          {selectedStudent.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-indigo-300" />
                              <span className="text-slate-300 font-medium">Phone:</span>
                              <span className="text-white">{selectedStudent.phone}</span>
                            </div>
                          )}
                          
                          {selectedStudent.address && (
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-indigo-300" />
                              <span className="text-slate-300 font-medium">Address:</span>
                              <span className="text-white">{selectedStudent.address}</span>
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