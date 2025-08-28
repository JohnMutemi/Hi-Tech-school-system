import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Eye, GraduationCap } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Student } from "@/lib/school-storage";
import type { Subject, Teacher } from "@/lib/school-storage";
import { BulkImport } from "@/components/ui/bulk-import";
import { 
  ResponsiveContainer, 
  ResponsiveGrid, 
  ResponsiveCard, 
  TouchButton, 
  ResponsiveModal,
  ResponsiveForm,
  ResponsiveFormRow,
  ResponsiveFormGroup,
  ResponsiveInput,
  ResponsiveSelect,
  ResponsiveTable,
  ResponsiveText,
  ResponsiveSpacing
} from '@/components/ui/responsive-components';
import { useResponsive } from '@/hooks/useResponsive';

interface StudentsSectionProps {
  schoolCode: string;
  colorTheme: string;
  toast: any;
}

export default function StudentsSection({ schoolCode, colorTheme, toast }: StudentsSectionProps) {
  const responsive = useResponsive();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({});
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentError, setStudentError] = useState<string>("");

  // Subject state and modal logic
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({});
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [subjectError, setSubjectError] = useState<string>("");

  // Credentials modal state
  const [credentialsModal, setCredentialsModal] = useState<{
    student?: any, 
    parent?: any, 
    importedStudents?: any[], 
    totalImported?: number
  } | null>(null);
  // View student modal state
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Bulk import state
  const [importResult, setImportResult] = useState<any>(null);

  // Add Student Modal state
  const [admissionPreview, setAdmissionPreview] = useState("");
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  // Fetch school settings and compute next admission number
  useEffect(() => {
    async function fetchSchoolSettings() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}`);
        if (res.ok) {
          const schoolData = await res.json();
          setSchoolSettings(schoolData);
          
          // Generate admission number preview based on school settings
          if (schoolData.admissionNumberAutoIncrement && schoolData.lastAdmissionNumber) {
            // Use school's last admission number and increment it
            const lastNumber = schoolData.lastAdmissionNumber;
            const match = lastNumber.match(/(\d+)(?!.*\d)/);
            if (match) {
              const number = match[1];
              const next = (parseInt(number, 10) + 1).toString().padStart(number.length, '0');
              const preview = lastNumber.replace(/(\d+)(?!.*\d)/, next);
              setAdmissionPreview(preview);
            } else {
              setAdmissionPreview(lastNumber + '1');
            }
          } else {
            // Fallback to simple increment
            if (students.length === 0) {
              setAdmissionPreview("ADM001");
              return;
            }
            const nums = students
              .map(s => s.admissionNumber)
              .filter(Boolean)
              .map(num => parseInt(num.replace(/\D/g, ""), 10))
              .filter(n => !isNaN(n));
            const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
            const nextNum = (maxNum + 1).toString().padStart(3, "0");
            setAdmissionPreview(`ADM${nextNum}`);
          }
        }
      } catch (error) {
        console.error('Failed to fetch school settings:', error);
        // Fallback to simple preview
        setAdmissionPreview("ADM001");
      }
    }
    
    if (schoolCode) {
      fetchSchoolSettings();
    }
  }, [schoolCode, students]);

  // Fetch students from backend
  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}/students`);
        if (res.ok) setStudents(await res.json());
      } catch (error) {
        toast && toast({ title: "Error", description: "Could not load students.", variant: "destructive" });
      }
    }
    if (schoolCode) fetchStudents();
  }, [schoolCode, toast]);

  // Fetch classes from backend
  useEffect(() => {
    async function fetchClasses() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}/classes`);
        if (res.ok) setClasses(await res.json());
      } catch (error) {
        toast && toast({ title: "Error", description: "Could not load classes.", variant: "destructive" });
      }
    }
    if (schoolCode) fetchClasses();
  }, [schoolCode, toast]);

  useEffect(() => {
    async function fetchSubjects() {
      const res = await fetch(`/api/schools/${schoolCode}/subjects`);
      if (res.ok) setSubjects(await res.json());
    }
    async function fetchTeachers() {
      const res = await fetch(`/api/schools/${schoolCode}/teachers`);
      if (res.ok) setTeachers(await res.json());
    }
    if (schoolCode) {
      fetchSubjects();
      fetchTeachers();
    }
  }, [schoolCode]);

  // Add Student handler
  const createStudent = async (studentData: Partial<Student>) => {
    if (
      !studentData.name ||
      !studentData.parentName ||
      !studentData.parentPhone ||
      !studentData.email ||
      !studentData.className
    ) {
      toast({
        title: "Validation Error",
        description: "Student Name, Email, Class, Parent Name, and Parent Phone are required.",
        variant: "destructive",
      });
      return false;
    }
    const tempPassword = "student123";
    const admissionNumber = studentData.admissionNumber || `ADM${Date.now()}`;
    try {
      const response = await fetch(
        `/api/schools/${schoolCode}/students`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...studentData,
            classId: studentData.className, // map className to classId
            // Optionally remove className from payload
          }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create student");
      }
      const newStudentObj = await response.json();
      setStudents([...students, newStudentObj]);
      setNewStudent({});
      setShowStudentModal(false);
      toast({ 
        title: "Success!", 
        description: "Student added successfully! Use the eye icon to view credentials." 
      });
      return true;
    } catch (error: any) {
      setStudentError(error.message || "Failed to create student.");
      toast({ title: "Error", description: error.message || "Failed to create student.", variant: "destructive" });
      return false;
    }
  };

  // Delete Student handler
  const deleteStudent = async (id: string) => {
    try {
      const response = await fetch(
        `/api/schools/${schoolCode}/students`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentId: id }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete student");
      }
      setStudents(students.filter((s) => s.id !== id));
      toast({ title: "Success!", description: "Student deleted successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete student.", variant: "destructive" });
    }
  };

  const createSubject = async () => {
    if (!newSubject.name) {
      setSubjectError("Subject Name is required.");
      return;
    }
    try {
      const response = await fetch(`/api/schools/${schoolCode}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSubject.name,
          description: newSubject.description,
          teacherId: newSubject.teacherId,
        }),
      });
      if (!response.ok) throw new Error("Failed to create subject");
      const createdSubject = await response.json();
      setSubjects([...subjects, createdSubject]);
      setNewSubject({});
      setShowSubjectModal(false);
      setSubjectError("");
      toast({ title: "Success!", description: "Subject added successfully!" });
    } catch (error: any) {
      setSubjectError(error.message || "Failed to create subject.");
      toast({ title: "Error", description: error.message || "Failed to create subject.", variant: "destructive" });
    }
  };

  // Handle import success
  const handleImportSuccess = (result: any) => {
    setImportResult(result);
    if (result.created?.length > 0) {
      // Refresh students list by refetching
      const refreshStudents = async () => {
        try {
          const res = await fetch(`/api/schools/${schoolCode}/students`);
          if (res.ok) {
            const updatedStudents = await res.json();
            setStudents(updatedStudents);
            
            // Show success toast instead of credentials modal
            toast && toast({ 
              title: "Import Successful", 
              description: `${result.created.length} students imported successfully. Use the eye icon to view their credentials.`, 
              variant: "default" 
            });
          }
        } catch (error) {
          toast && toast({ title: "Error", description: "Could not refresh students.", variant: "destructive" });
        }
      };
      refreshStudents();
    }
  };

  return (
    <Card className="shadow-lg border-0 rounded-2xl bg-gradient-to-br from-white to-purple-50/30">
      <CardHeader className="border-b border-purple-100/50 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-2xl">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-800">Students</span>
              <div className="text-sm text-gray-600 font-normal">
                {students.length} {students.length === 1 ? 'student' : 'students'} enrolled
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowStudentModal(true)} 
              style={{ backgroundColor: colorTheme }}
              className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
            <BulkImport 
              entityType="students" 
              schoolCode={schoolCode} 
              onSuccess={handleImportSuccess}
              variant="outline"
              size="sm"
              className="rounded-xl border-purple-200 hover:bg-purple-50 transition-colors"
            />
          </div>
        </CardTitle>
        <CardDescription className="text-gray-600 mt-2">
          Manage your school's student records and enrollment data
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {students.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Students Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start by adding your first student or importing multiple students at once
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => setShowStudentModal(true)} 
                style={{ backgroundColor: colorTheme }}
                className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Student
              </Button>
              <BulkImport 
                entityType="students" 
                schoolCode={schoolCode} 
                onSuccess={handleImportSuccess}
                variant="outline"
                className="rounded-xl border-purple-200 hover:bg-purple-50"
              />
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-b border-gray-200/60 hover:bg-transparent">
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Student
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Admission No.</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Class</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Parent Info</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Contact</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow 
                    key={student.id}
                    className="border-b border-gray-100 hover:bg-purple-50/30 transition-colors group"
                  >
                    <TableCell className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold shadow-md">
                          {(student.user?.name || student.name || 'S')?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800">{student.user?.name || student.name || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{student.user?.email || student.email || 'No email'}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono bg-blue-100 text-blue-800">
                        {student.admissionNumber}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                        {student.class?.name || classes.find((cls: any) => cls.id === student.classId)?.name || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <div>
                        <div className="font-medium text-gray-800">{student.parentName}</div>
                        <div className="text-sm text-gray-500">{student.parentPhone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-gray-700">{student.parentPhone}</div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewingStudent(student)}
                          title="View Details"
                          className="rounded-lg border-purple-200 hover:bg-purple-50 text-purple-600 opacity-75 group-hover:opacity-100 transition-all"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Delete Student"
                              className="rounded-lg border-red-200 hover:bg-red-50 text-red-600 opacity-75 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Student</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {student.user?.name || student.name}? This action cannot be undone and will permanently remove the student and their associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteStudent(student.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete Student
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Student Modal */}
        <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
          <DialogContent className="max-w-xl mx-auto bg-white/95 rounded-2xl shadow-2xl px-0 py-4 border-0 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center pt-3 pb-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 mb-1 shadow">
                <Plus className="w-4 h-4 text-blue-500" />
              </div>
              <DialogHeader className="w-full text-center mb-1">
                <DialogTitle className="text-base font-bold text-gray-900">Add New Student</DialogTitle>
                <DialogDescription className="text-gray-500 text-xs">Fill in all required fields for the student.</DialogDescription>
              </DialogHeader>
            </div>
            <ResponsiveForm
              onSubmit={async (e) => {
                e.preventDefault();
                await createStudent(newStudent);
              }}
              className="px-4 pb-3 pt-1 w-full max-w-xl"
            >
              <div className="space-y-3">
                {/* Student Information Section */}
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2 text-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Student Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Student Name *</Label>
                      <Input 
                        className="h-8 text-sm mt-1" 
                        value={newStudent.name || ""} 
                        onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Admission Number</Label>
                      <Input 
                        className="h-8 text-sm mt-1" 
                        value={newStudent.admissionNumber || ""} 
                        onChange={e => setNewStudent({ ...newStudent, admissionNumber: e.target.value })} 
                      />
                      {admissionPreview && (!newStudent.admissionNumber || newStudent.admissionNumber !== admissionPreview) && (
                        <div className="text-xs text-gray-500 mt-1">
                          <span
                            className="font-mono bg-blue-100 px-1 py-0.5 rounded cursor-pointer hover:bg-blue-200 text-xs"
                            onClick={() => setNewStudent({ ...newStudent, admissionNumber: admissionPreview })}
                            title="Click to autofill"
                          >
                            Click to use: {admissionPreview}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Student Email *</Label>
                      <Input 
                        className="h-8 text-sm mt-1" 
                        type="email" 
                        value={newStudent.email || ""} 
                        onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Student Phone</Label>
                      <Input 
                        className="h-8 text-sm mt-1" 
                        value={newStudent.phone || ""} 
                        onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Class *</Label>
                      <Select
                        value={newStudent.className || ""}
                        onValueChange={value => setNewStudent({ ...newStudent, className: value })}
                        required
                      >
                        <SelectTrigger className="h-8 text-sm mt-1">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.filter(cls => cls && cls.id && cls.name && cls.id.trim() !== '').map(cls => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Date of Birth</Label>
                      <Input 
                        className="h-8 text-sm mt-1" 
                        type="date" 
                        value={newStudent.dateOfBirth || ""} 
                        onChange={e => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Gender</Label>
                      <Select
                        value={newStudent.gender as "male" | "female" | undefined}
                        onValueChange={value => setNewStudent({ ...newStudent, gender: value as "male" | "female" })}>
                        <SelectTrigger className="h-8 text-sm mt-1">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Status</Label>
                      <Select
                        value={newStudent.status || "active"}
                        onValueChange={value => setNewStudent({ ...newStudent, status: value as "active" | "inactive" | "graduated" })}>
                        <SelectTrigger className="h-8 text-sm mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="graduated">Graduated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Parent Information Section */}
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2 text-sm">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Parent Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Parent Name *</Label>
                      <Input 
                        className="h-8 text-sm mt-1" 
                        value={newStudent.parentName || ""} 
                        onChange={e => setNewStudent({ ...newStudent, parentName: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Parent Phone *</Label>
                      <Input 
                        className="h-8 text-sm mt-1" 
                        value={newStudent.parentPhone || ""} 
                        onChange={e => setNewStudent({ ...newStudent, parentPhone: e.target.value })} 
                        required 
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Parent Email</Label>
                      <Input 
                        className="h-8 text-sm mt-1" 
                        type="email" 
                        value={newStudent.parentEmail || ""} 
                        onChange={e => setNewStudent({ ...newStudent, parentEmail: e.target.value })} 
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-700">Address</Label>
                      <Input 
                        className="h-8 text-sm mt-1" 
                        value={newStudent.address || ""} 
                        onChange={e => setNewStudent({ ...newStudent, address: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              {studentError && <div className="text-red-600 text-xs mt-1">{studentError}</div>}
              <div className="flex justify-end gap-2 mt-3">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowStudentModal(false)}>Cancel</Button>
                <Button type="submit" size="sm" style={{ backgroundColor: colorTheme }}>Add Student</Button>
              </div>
            </ResponsiveForm>
          </DialogContent>
        </Dialog>

        {/* Add Subject Modal */}
        <Dialog open={showSubjectModal} onOpenChange={setShowSubjectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Subject</DialogTitle>
              <DialogDescription>Fill in all required fields for the subject.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await createSubject();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Subject Name *</Label>
                <Input
                  value={newSubject.name || ""}
                  onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Assigned Teacher</Label>
                <Select
                  value={newSubject.teacherId || ""}
                  onValueChange={value => setNewSubject({ ...newSubject, teacherId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newSubject.description || ""}
                  onChange={e => setNewSubject({ ...newSubject, description: e.target.value })}
                  placeholder="Brief description of the subject"
                  rows={2}
                />
              </div>
              {subjectError && <div className="text-red-600">{subjectError}</div>}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setShowSubjectModal(false)}>Cancel</Button>
                <Button type="submit" style={{ backgroundColor: colorTheme }}>Add Subject</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Credentials Modal */}
        <Dialog open={!!credentialsModal} onOpenChange={() => setCredentialsModal(null)}>
          <DialogContent className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border-0 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Access Credentials</h2>
                <p className="text-blue-100">
                  {credentialsModal?.importedStudents 
                    ? `Share these credentials with ${credentialsModal.totalImported} imported students and their parents for their first login.`
                    : "Share these credentials with the student and parent for their first login."
                  }
                </p>
                </div>
                </div>

            {/* Content */}
            <div className="p-8">
              {/* Individual Student Credentials */}
              {credentialsModal?.student && !credentialsModal?.importedStudents && (
                <div className="space-y-6">
                  {/* Student Section */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
              </div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900">Student Login</h3>
                        <p className="text-blue-600 text-sm">Use these credentials to access student portal</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-blue-800 block mb-2">Email</label>
                        <div className="relative">
                          <input 
                            className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={credentialsModal.student.email} 
                            readOnly 
                            onFocus={e => e.target.select()} 
                          />
                          <button 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                            onClick={() => navigator.clipboard.writeText(credentialsModal.student.email)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-800 block mb-2">Admission Number</label>
                        <div className="relative">
                          <input 
                            className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={credentialsModal.student.admissionNumber} 
                            readOnly 
                            onFocus={e => e.target.select()} 
                          />
                          <button 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                            onClick={() => navigator.clipboard.writeText(credentialsModal.student.admissionNumber)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-blue-800 block mb-2">Password</label>
                        <div className="relative">
                          <input 
                            className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={credentialsModal.student.tempPassword} 
                            readOnly 
                            onFocus={e => e.target.select()} 
                          />
                          <button 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                            onClick={() => navigator.clipboard.writeText(credentialsModal.student.tempPassword)}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6">
                      <a href={`/schools/${schoolCode}/students/login`} target="_blank" rel="noopener noreferrer" 
                         className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Go to Student Login
                      </a>
                    </div>
                  </div>
                  
                  {/* Parent Section */}
            {credentialsModal?.parent && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                </div>
                        <div>
                          <h3 className="text-xl font-bold text-green-900">Parent Login</h3>
                          <p className="text-green-600 text-sm">Use these credentials to access parent portal</p>
                </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-green-800 block mb-2">Phone Number</label>
                          <div className="relative">
                            <input 
                              className="w-full px-4 py-3 bg-white border border-green-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                              value={credentialsModal.parent.phone} 
                              readOnly 
                              onFocus={e => e.target.select()} 
                            />
                            <button 
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700"
                              onClick={() => navigator.clipboard.writeText(credentialsModal.parent.phone)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-green-800 block mb-2">Password</label>
                          <div className="relative">
                            <input 
                              className="w-full px-4 py-3 bg-white border border-green-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                              value={credentialsModal.parent.tempPassword} 
                              readOnly 
                              onFocus={e => e.target.select()} 
                            />
                            <button 
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700"
                              onClick={() => navigator.clipboard.writeText(credentialsModal.parent.tempPassword)}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6">
                        <a href={`/schools/${schoolCode}/parent/login`} target="_blank" rel="noopener noreferrer" 
                           className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Go to Parent Login
                        </a>
                </div>
              </div>
            )}
                </div>
              )}
              
              {/* Bulk Imported Students Credentials */}
              {credentialsModal?.importedStudents && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-purple-900">Default Passwords</h3>
                        <p className="text-purple-600 text-sm">All imported users use these default passwords</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          </svg>
                          <span className="font-semibold text-gray-800">Students</span>
                        </div>
                        <code className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono">student123</code>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-semibold text-gray-800">Parents</span>
                        </div>
                        <code className="bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono">parent123</code>
                      </div>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {credentialsModal.importedStudents.map((credential: any, index: number) => (
                      <div key={index} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {credential.student?.name || `Student ${index + 1}`}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Student Credentials */}
                          {credential.student && (
                            <div className="space-y-3">
                              <h5 className="font-semibold text-blue-800 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                </svg>
                                Student Login
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-600 block mb-1">Email</label>
                                  <div className="relative">
                                    <input 
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                      value={credential.student.email} 
                                      readOnly 
                                      onFocus={e => e.target.select()} 
                                    />
                                    <button 
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      onClick={() => navigator.clipboard.writeText(credential.student.email)}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600 block mb-1">Admission #</label>
                                  <div className="relative">
                                    <input 
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                      value={credential.student.admissionNumber} 
                                      readOnly 
                                      onFocus={e => e.target.select()} 
                                    />
                                    <button 
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      onClick={() => navigator.clipboard.writeText(credential.student.admissionNumber)}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600 block mb-1">Password</label>
                                  <div className="relative">
                                    <input 
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                                      value={credential.student.tempPassword} 
                                      readOnly 
                                      onFocus={e => e.target.select()} 
                                    />
                                    <button 
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      onClick={() => navigator.clipboard.writeText(credential.student.tempPassword)}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Parent Credentials */}
                          {credential.parent && (
                            <div className="space-y-3">
                              <h5 className="font-semibold text-green-800 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Parent Login
                              </h5>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs font-medium text-gray-600 block mb-1">Phone</label>
                                  <div className="relative">
                                    <input 
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                      value={credential.parent.phone} 
                                      readOnly 
                                      onFocus={e => e.target.select()} 
                                    />
                                    <button 
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      onClick={() => navigator.clipboard.writeText(credential.parent.phone)}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-xs font-medium text-gray-600 block mb-1">Password</label>
                                  <div className="relative">
                                    <input 
                                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                                      value={credential.parent.tempPassword} 
                                      readOnly 
                                      onFocus={e => e.target.select()} 
                                    />
                                    <button 
                                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                      onClick={() => navigator.clipboard.writeText(credential.parent.tempPassword)}
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-4 pt-6 border-t border-gray-200">
                    <a href={`/schools/${schoolCode}/students/login`} target="_blank" rel="noopener noreferrer" 
                       className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Student Login
                    </a>
                    <a href={`/schools/${schoolCode}/parent/login`} target="_blank" rel="noopener noreferrer" 
                       className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Parent Login
                    </a>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-6">
                <Button onClick={() => setCredentialsModal(null)} className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Student Modal */}
        <Dialog open={!!viewingStudent} onOpenChange={() => setViewingStudent(null)}>
          <DialogContent className="max-w-2xl mx-auto bg-white rounded-2xl shadow-2xl border-0 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
              <div className="flex items-center justify-center mb-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-bold mb-1">Login Credentials</h2>
                <p className="text-blue-100 text-xs">Access information for student and parent portals</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {viewingStudent && (
                <div className="space-y-4">
                  {/* Student Login Credentials */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-bold text-blue-900 text-sm">Student Login</h3>
                        <p className="text-blue-600 text-xs">Access student portal</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-blue-800 block mb-1">Email</label>
                        <div className="relative">
                          <input 
                            className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={viewingStudent.email} 
                            readOnly 
                            onFocus={e => e.target.select()} 
                          />
                          <button 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                            onClick={() => navigator.clipboard.writeText(viewingStudent.email || '')}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-blue-800 block mb-1">Admission #</label>
                        <div className="relative">
                          <input 
                            className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            value={viewingStudent.admissionNumber} 
                            readOnly 
                            onFocus={e => e.target.select()} 
                          />
                          <button 
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                            onClick={() => navigator.clipboard.writeText(viewingStudent.admissionNumber)}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                                              <div>
                          <label className="text-xs font-semibold text-blue-800 block mb-1">Password</label>
                          <div className="relative">
                            <input 
                              className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                              value="student123"
                              readOnly 
                              onFocus={e => e.target.select()} 
                            />
                            <button 
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-700"
                              onClick={() => navigator.clipboard.writeText("student123")}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                    </div>
                    <div className="mt-3">
                      <a href={`/schools/${schoolCode}/students/login`} target="_blank" rel="noopener noreferrer" 
                         className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Go to Student Login
                      </a>
                    </div>
                  </div>
                  
                  {/* Parent Login Credentials */}
                  {viewingStudent.parentPhone && (
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-bold text-green-900 text-sm">Parent Login</h3>
                          <p className="text-green-600 text-xs">Access parent portal</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-green-800 block mb-1">Phone Number</label>
                          <div className="relative">
                            <input 
                              className="w-full px-3 py-2 bg-white border border-green-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                              value={viewingStudent.parentPhone} 
                              readOnly 
                              onFocus={e => e.target.select()} 
                            />
                            <button 
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700"
                              onClick={() => navigator.clipboard.writeText(viewingStudent.parentPhone)}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-green-800 block mb-1">Password</label>
                          <div className="relative">
                            <input 
                              className="w-full px-3 py-2 bg-white border border-green-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent" 
                              value="parent123"
                              readOnly 
                              onFocus={e => e.target.select()} 
                            />
                            <button 
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700"
                              onClick={() => navigator.clipboard.writeText("parent123")}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <a href={`/schools/${schoolCode}/parent/login`} target="_blank" rel="noopener noreferrer" 
                           className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Go to Parent Login
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end pt-3">
                <Button onClick={() => setViewingStudent(null)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium">
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>


      </CardContent>
    </Card>
  );
}