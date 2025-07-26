import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Student } from "@/lib/school-storage";
import type { Subject, Teacher } from "@/lib/school-storage";
// @ts-ignore
import * as XLSX from "xlsx";
// @ts-ignore
import Papa from "papaparse";

interface StudentsSectionProps {
  schoolCode: string;
  colorTheme: string;
  toast: any;
}

export default function StudentsSection({ schoolCode, colorTheme, toast }: StudentsSectionProps) {
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
  const [credentialsModal, setCredentialsModal] = useState<{student?: any, parent?: any} | null>(null);

  // Bulk import state
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);
  const [bulkResult, setBulkResult] = useState<{ created?: any[]; errors?: any[] } | null>(null);

  // Add Student Modal state
  const [admissionPreview, setAdmissionPreview] = useState("");

  // Compute next admission number when students change
  useEffect(() => {
    if (students.length === 0) {
      setAdmissionPreview("ADM001");
      return;
    }
    // Find the highest admission number (assume format ADM###)
    const nums = students
      .map(s => s.admissionNumber)
      .filter(Boolean)
      .map(num => parseInt(num.replace(/\D/g, ""), 10))
      .filter(n => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    const nextNum = (maxNum + 1).toString().padStart(3, "0");
    setAdmissionPreview(`ADM${nextNum}`);
  }, [students]);

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
      // Show credentials modal
      setCredentialsModal({
        student: {
          name: newStudentObj.name,
          email: newStudentObj.email,
          admissionNumber: newStudentObj.admissionNumber,
          tempPassword: newStudentObj.tempPassword || tempPassword,
        },
        parent: newStudentObj.parentPhone ? {
          name: newStudentObj.parentName,
          phone: newStudentObj.parentPhone,
          tempPassword: newStudentObj.parentTempPassword || "parent123",
        } : undefined,
      });
      toast({ title: "Success!", description: "Student added successfully!" });
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

  // Add a mapping for flexible headers
  const headerMap: Record<string, string> = {
    name: 'name',
    Name: 'name',
    admissionNumber: 'admissionNumber',
    'Admission Number': 'admissionNumber',
    email: 'email',
    Email: 'email',
    className: 'className',
    Class: 'className',
    'Class Name': 'className',
    parentName: 'parentName',
    'Parent Name': 'parentName',
    parentPhone: 'parentPhone',
    'Parent Phone': 'parentPhone',
  };

  // Bulk file handler
  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBulkError("");
    setBulkRows([]);
    setBulkSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        let rows: any[] = [];
        if (ext === "csv") {
          const parsed = Papa.parse(evt.target?.result as string, { header: true });
          rows = parsed.data;
        } else if (["xlsx", "xls"].includes(ext || "")) {
          const wb = XLSX.read(evt.target?.result, { type: "binary" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          rows = XLSX.utils.sheet_to_json(ws);
        } else {
          setBulkError("Unsupported file type");
          return;
        }
        // Map headers to internal field names
        const mappedRows = rows.map((row: any) => {
          const mapped: any = {};
          for (const key in row) {
            const mappedKey = headerMap[key] || key;
            mapped[mappedKey] = row[key];
          }
          return mapped;
        });
        // Validate rows
        const required = ["name", "admissionNumber", "email", "className", "parentName", "parentPhone"];
        const invalid = mappedRows.filter((row: any) => required.some(f => !row[f]));
        if (invalid.length > 0) {
          setBulkError(`Some rows are missing required fields: ${required.join(", ")}`);
        } else {
          setBulkRows(mappedRows);
        }
      } catch (err: any) {
        setBulkError("Failed to parse file: " + err.message);
      }
    };
    if (ext === "csv") reader.readAsText(file);
    else reader.readAsBinaryString(file);
  };

  // Bulk import submit
  const handleBulkImport = async () => {
    setBulkLoading(true);
    setBulkError("");
    setBulkSuccess(null);
    setBulkResult(null);
    if (!bulkFile) return;
    const formData = new FormData();
    formData.append("file", bulkFile);
    const res = await fetch(`/api/schools/${schoolCode}/students/import`, {
        method: "POST",
      body: formData,
      });
    const data = await res.json();
    setBulkResult({ created: data.created, errors: data.errors });
    setBulkSuccess(data.success ? `Imported ${data.created?.length || 0} students.` : null);
    setBulkLoading(false);
    setBulkRows([]);
    setBulkFile(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Students</span>
          <div className="flex gap-2">
            <Button onClick={() => setShowStudentModal(true)} style={{ backgroundColor: colorTheme }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
            <Button variant="outline" onClick={() => setBulkModalOpen(true)}>
              Import
            </Button>
          </div>
        </CardTitle>
        <CardDescription>Manage your school's student records.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Admission No.</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Parent Name</TableHead>
              <TableHead>Parent Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.admissionNumber}</TableCell>
                <TableCell>
                  {student.class?.name || classes.find((cls) => cls.id === student.className)?.name || "N/A"}
                </TableCell>
                <TableCell>{student.parentName}</TableCell>
                <TableCell>{student.parentPhone}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  {/* Edit logic can be added here */}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteStudent(student.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Add Student Modal */}
        <Dialog open={showStudentModal} onOpenChange={setShowStudentModal}>
          <DialogContent className="max-w-lg mx-auto bg-white/95 rounded-2xl shadow-2xl px-0 py-8 border-0 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center pt-6 pb-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 mb-2 shadow">
                <Plus className="w-6 h-6 text-blue-500" />
              </div>
              <DialogHeader className="w-full text-center mb-2">
                <DialogTitle className="text-lg font-bold text-gray-900">Add New Student</DialogTitle>
                <DialogDescription className="text-gray-500 text-sm">Fill in all required fields for the student.</DialogDescription>
              </DialogHeader>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await createStudent(newStudent);
              }}
              className="px-6 pb-4 pt-2 w-full max-w-md"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Student Name *</Label>
                    <Input className="h-10 text-base" value={newStudent.name || ""} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="text-sm">Admission Number</Label>
                    <Input className="h-10 text-base" value={newStudent.admissionNumber || ""} onChange={e => setNewStudent({ ...newStudent, admissionNumber: e.target.value })} />
                    {admissionPreview && (!newStudent.admissionNumber || newStudent.admissionNumber !== admissionPreview) && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span
                          className="font-mono bg-gray-100 px-2 py-1 rounded cursor-pointer hover:bg-blue-100"
                          onClick={() => setNewStudent({ ...newStudent, admissionNumber: admissionPreview })}
                          title="Click to autofill"
                        >
                          Click to use: {admissionPreview}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Class/Grade *</Label>
                    <Select
                      value={newStudent.className || ""}
                      onValueChange={value => setNewStudent({ ...newStudent, className: value })}
                      required
                    >
                      <SelectTrigger className="h-10 text-base">
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Date of Birth</Label>
                    <Input className="h-10 text-base" type="date" value={newStudent.dateOfBirth || ""} onChange={e => setNewStudent({ ...newStudent, dateOfBirth: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Gender</Label>
                    <Select
                      value={newStudent.gender as "male" | "female" | undefined}
                      onValueChange={value => setNewStudent({ ...newStudent, gender: value as "male" | "female" })}>
                      <SelectTrigger className="h-10 text-base">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Student Email *</Label>
                    <Input className="h-10 text-base" type="email" value={newStudent.email || ""} onChange={e => setNewStudent({ ...newStudent, email: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Student Phone</Label>
                    <Input className="h-10 text-base" value={newStudent.phone || ""} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })} />
                  </div>
                  <div></div>
                </div>
                <div className="border-t border-gray-200 my-3" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Parent/Guardian Name *</Label>
                    <Input className="h-10 text-base" value={newStudent.parentName || ""} onChange={e => setNewStudent({ ...newStudent, parentName: e.target.value })} required />
                  </div>
                  <div>
                    <Label className="text-sm">Parent Phone *</Label>
                    <Input className="h-10 text-base" value={newStudent.parentPhone || ""} onChange={e => setNewStudent({ ...newStudent, parentPhone: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Parent Email</Label>
                    <Input className="h-10 text-base" type="email" value={newStudent.parentEmail || ""} onChange={e => setNewStudent({ ...newStudent, parentEmail: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-sm">Home Address</Label>
                    <Textarea className="text-base" rows={2} value={newStudent.address || ""} onChange={e => setNewStudent({ ...newStudent, address: e.target.value })} />
                  </div>
                </div>
              </div>
              {studentError && <div className="text-red-600 text-xs mt-2">{studentError}</div>}
              <div className="flex flex-row justify-end gap-2 mt-6">
                <Button type="button" size="sm" variant="outline" onClick={() => setShowStudentModal(false)} className="min-w-[90px]">Cancel</Button>
                <Button type="submit" size="sm" style={{ backgroundColor: colorTheme }} className="min-w-[90px]">Add</Button>
              </div>
            </form>
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
          <DialogContent className="max-w-md bg-white/90 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle>Access Credentials</DialogTitle>
              <DialogDescription>Share these credentials with the student and parent for their first login.</DialogDescription>
            </DialogHeader>
            {credentialsModal?.student && (
              <div className="mb-4 space-y-2">
                <h4 className="font-semibold mb-1">Student</h4>
                <div className="flex items-center gap-2">
                  <label className="text-xs w-20">Email:</label>
                  <input className="font-mono border rounded px-2 py-1 w-full" value={credentialsModal.student.email} readOnly onFocus={e => e.target.select()} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs w-20">Admission #:</label>
                  <input className="font-mono border rounded px-2 py-1 w-full" value={credentialsModal.student.admissionNumber} readOnly onFocus={e => e.target.select()} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs w-20">Password:</label>
                  <input className="font-mono border rounded px-2 py-1 w-full" value={credentialsModal.student.tempPassword} readOnly onFocus={e => e.target.select()} />
                </div>
                <div className="flex gap-2 mt-2">
                  <a href={`/schools/${schoolCode}/students/login`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Go to Student Login</a>
                </div>
              </div>
            )}
            {credentialsModal?.parent && (
              <div className="mb-4 space-y-2">
                <h4 className="font-semibold mb-1">Parent</h4>
                <div className="flex items-center gap-2">
                  <label className="text-xs w-20">Phone:</label>
                  <input className="font-mono border rounded px-2 py-1 w-full" value={credentialsModal.parent.phone} readOnly onFocus={e => e.target.select()} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs w-20">Password:</label>
                  <input className="font-mono border rounded px-2 py-1 w-full" value={credentialsModal.parent.tempPassword} readOnly onFocus={e => e.target.select()} />
                </div>
                <div className="flex gap-2 mt-2">
                  <a href={`/schools/${schoolCode}/parent/login`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Go to Parent Login</a>
                </div>
              </div>
            )}
            <Button onClick={() => setCredentialsModal(null)} className="mt-4 w-full">Close</Button>
          </DialogContent>
        </Dialog>

        {/* Bulk Import Modal */}
        <Dialog open={bulkModalOpen} onOpenChange={setBulkModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Students</DialogTitle>
              <DialogDescription>Upload an Excel or CSV file with student data.</DialogDescription>
            </DialogHeader>
            <input type="file" accept=".xlsx,.csv" onChange={handleBulkFile} />
              {bulkRows.length > 0 && (
              <Button onClick={handleBulkImport} disabled={bulkLoading} className="mt-2">{bulkLoading ? "Importing..." : "Import"}</Button>
            )}
            {bulkError && <div className="text-red-600 mt-2">{bulkError}</div>}
            {bulkResult && (
              <div className="mt-2 text-sm">
                {Array.isArray(bulkResult.created) && bulkResult.created.length > 0 && (
                  <div className="text-green-700 mb-1">Created: {bulkResult.created?.map((c, i) => <span key={i}>{c.student}{i < (bulkResult.created?.length ?? 0) - 1 ? ", " : ""}</span>)}</div>
                )}
                {bulkResult.errors && bulkResult.errors.length > 0 && (
                  <div className="text-red-700">
                    Errors:
                    <ul className="list-disc ml-5">
                      {bulkResult.errors.map((err, i) => (
                        <li key={i}>{err.student}: {err.error}</li>
                      ))}
                    </ul>
                </div>
              )}
            </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}