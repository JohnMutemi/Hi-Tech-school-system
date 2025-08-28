import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, BookOpen, Users } from "lucide-react";
import type { Subject, SchoolClass, Grade } from "@/lib/school-storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle } from "lucide-react";
import { BulkImport } from "@/components/ui/bulk-import";

function ImportResultSummary({ result, onClose }: { result: { created?: any[]; errors?: any[] } | null, onClose?: () => void }) {
  if (!result) return null;
  const created = result.created || [];
  const errors = result.errors || [];
  return (
    <div className="border rounded-lg p-4 mt-2 bg-white shadow-sm relative">
      <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">&times;</button>
      <div className="flex items-center gap-4 mb-2">
        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
          <CheckCircle className="w-4 h-4 mr-1" /> Success: {created.length}
        </span>
        <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
          <XCircle className="w-4 h-4 mr-1" /> Errors: {errors.length}
        </span>
      </div>
      <table className="w-full text-xs border">
        <thead>
          <tr>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Error</th>
          </tr>
        </thead>
        <tbody>
          {created.map((item, i) => (
            <tr key={`created-${i}`}>
              <td className="border px-2 py-1">{item.class}</td>
              <td className="border px-2 py-1 text-green-700">Success</td>
              <td className="border px-2 py-1"></td>
            </tr>
          ))}
          {errors.map((item, i) => (
            <tr key={`error-${i}`}>
              <td className="border px-2 py-1">{item.class}</td>
              <td className="border px-2 py-1 text-red-700">Error</td>
              <td className="border px-2 py-1">{item.error}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {errors.length > 0 && (
        <button
          className="mt-2 px-3 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200"
          onClick={() => {
            const csv = [
              ["Name", "Error"],
              ...errors.map(e => [e.class, e.error])
            ].map(row => row.join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "import-errors.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download Error Report
        </button>
      )}
    </div>
  );
}

function ImportClassesButton({ schoolCode, onSuccess = () => {} }: { schoolCode: string; onSuccess?: (data: any) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ created?: any[]; errors?: any[] } | null>(null);
  const [showResult, setShowResult] = useState(true);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/schools/${schoolCode}/classes/import`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    setResult({ created: data.created, errors: data.errors });
    setShowResult(true);
    onSuccess(data);
    alert(data.success ? "Import successful!" : "Import failed.");
  };

  return (
    <div className="flex flex-col items-start">
      <button onClick={() => fileInput.current?.click()} className="px-4 py-2 bg-blue-600 text-white rounded shadow h-10 text-sm">Import Classes</button>
      <input
        type="file"
        accept=".xlsx,.csv"
        ref={fileInput}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {result && showResult && (
        <ImportResultSummary result={result} onClose={() => setShowResult(false)} />
      )}
    </div>
  );
}

interface SubjectsClassesSectionProps {
  schoolCode: string;
  colorTheme: string;
  toast: any;
}

const defaultSubject: Subject = {
  id: "",
  name: "",
  code: "",
  description: "",
  teacherId: "",
  classes: [],
};

const defaultClass: SchoolClass = {
  id: "",
  name: "",
  level: "",
  
  currentStudents: 0,
  classTeacherId: "",
  subjects: [],
};

export default function SubjectsClassesSection({ schoolCode, colorTheme, toast }: SubjectsClassesSectionProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [viewMode, setViewMode] = useState<"subjects" | "classes">("subjects");
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectForm, setSubjectForm] = useState<Subject>(defaultSubject);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [newClass, setNewClass] = useState<Partial<SchoolClass>>({});
  const [newGrade, setNewGrade] = useState<{ name: string }>({ name: "" });
  const [editingGrade, setEditingGrade] = useState<any>(null);
  const [classError, setClassError] = useState<string>("");
  const [gradeError, setGradeError] = useState<string>("");

  const [teachers, setTeachers] = useState<any[]>([]);

  // Fetch subjects, classes, and grades from backend
  useEffect(() => {
    async function fetchData() {
      try {
        const sRes = await fetch(`/api/schools/${schoolCode}/subjects`);
        if (sRes.ok) setSubjects(await sRes.json());
        const cRes = await fetch(`/api/schools/${schoolCode}/classes`);
        if (cRes.ok) setClasses(await cRes.json());
        
        // Fetch grades
        const gRes = await fetch(`/api/schools/${schoolCode}/grades`);
        console.log('Grades fetch response status:', gRes.status);
        console.log('Grades fetch response ok:', gRes.ok);
        if (gRes.ok) {
          const gradesData = await gRes.json();
          console.log('Raw grades data:', gradesData);
          const gradesArray = Array.isArray(gradesData) ? gradesData : (gradesData.data && Array.isArray(gradesData.data) ? gradesData.data : []);
          console.log('Processed grades array:', gradesArray);
          console.log('Fetched grades:', gradesArray);
          setGrades(gradesArray);
        } else {
          console.warn('Grades endpoint not available');
          console.log('Grades response text:', await gRes.text());
          setGrades([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast && toast({ title: "Error", description: "Could not load subjects/classes.", variant: "destructive" });
      }
    }
    if (schoolCode) fetchData();
  }, [schoolCode, toast]);



  // Fetch teachers from backend
  useEffect(() => {
    async function fetchTeachers() {
      try {
        const res = await fetch(`/api/schools/${schoolCode}/teachers`);
        if (res.ok) setTeachers(await res.json());
      } catch (error) {
        toast && toast({ title: "Error", description: "Could not load teachers.", variant: "destructive" });
      }
    }
    if (schoolCode) fetchTeachers();
  }, [schoolCode, toast]);

  // Subject CRUD
  const handleAddSubject = () => {
    setSubjectForm(defaultSubject);
    setEditingSubject(null);
    setShowSubjectModal(true);
  };
  const handleEditSubject = (subject: Subject) => {
    setSubjectForm(subject);
    setEditingSubject(subject);
    setShowSubjectModal(true);
  };
  const handleDeleteSubject = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/subjects`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete subject");
      setSubjects(subjects.filter((s) => s.id !== id));
      toast({ title: "Success!", description: "Subject deleted successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete subject.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!subjectForm.name || !subjectForm.code) {
      setError("Please fill in all required fields: Subject Name and Code.");
      setLoading(false);
      return;
    }
    try {
      let res, newSubject: Subject;
      if (editingSubject) {
        res = await fetch(`/api/schools/${schoolCode}/subjects`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subjectForm),
        });
        if (!res.ok) throw new Error("Failed to update subject");
        newSubject = await res.json();
        setSubjects(subjects.map((s) => (s.id === newSubject.id ? newSubject : s)));
        toast({ title: "Success!", description: "Subject updated successfully!" });
      } else {
        res = await fetch(`/api/schools/${schoolCode}/subjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subjectForm),
        });
        if (!res.ok) throw new Error("Failed to create subject");
        newSubject = await res.json();
        setSubjects([...subjects, newSubject]);
        toast({ title: "Success!", description: "Subject added successfully!" });
      }
      setSubjectForm(defaultSubject);
      setEditingSubject(null);
      setShowSubjectModal(false);
    } catch (err: any) {
      setError(err.message || "Failed to save subject");
      toast({ title: "Error", description: err.message || "Failed to save subject.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Class CRUD
  const handleAddClass = () => {
    setNewClass({
      name: "",
      level: "",
      classTeacherId: "",
      gradeId: "",
    });
    setShowClassModal(true);
    setClassError("");
  };
  const handleDeleteClass = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/classes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete class");
      setClasses(classes.filter((c) => c.id !== id));
      toast({ title: "Success!", description: "Class deleted successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete class.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassError("");
    if (!newClass.name || !newClass.gradeId) {
      setClassError("Please fill in all required fields.");
      return;
    }
    try {
      const apiData = {
        name: newClass.name,
        gradeId: newClass.gradeId,
        teacherId: newClass.classTeacherId,
      };
      const res = await fetch(`/api/schools/${schoolCode}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });
      if (!res.ok) throw new Error("Failed to create class");
      // Fetch the latest class list after adding
      const cRes = await fetch(`/api/schools/${schoolCode}/classes`);
      if (cRes.ok) setClasses(await cRes.json());
      setShowClassModal(false);
      setNewClass({});
      toast({ title: "Success!", description: "Class added successfully!" });
    } catch (err: any) {
      setClassError(err.message || "Failed to create class.");
      toast({ title: "Error", description: err.message || "Failed to create class.", variant: "destructive" });
    }
  };

  const handleDeleteGrade = async (gradeId: string) => {
    try {
      const res = await fetch(`/api/schools/${schoolCode}/grades?id=${gradeId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to delete grade");
      }
      
      // Refresh grades list
      const gRes = await fetch(`/api/schools/${schoolCode}/grades`);
      if (gRes.ok) {
        const gradesData = await gRes.json();
        const gradesArray = Array.isArray(gradesData) ? gradesData : (gradesData.data && Array.isArray(gradesData.data) ? gradesData.data : []);
        setGrades(gradesArray);
      }
      
      toast({ title: "Success!", description: "Grade deleted successfully!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete grade.", variant: "destructive" });
    }
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setGradeError("");
    if (!newGrade.name) {
      setGradeError("Please enter a grade name.");
      return;
    }
    try {
      const method = editingGrade ? "PUT" : "POST";
      const url = editingGrade 
        ? `/api/schools/${schoolCode}/grades?id=${editingGrade.id}`
        : `/api/schools/${schoolCode}/grades`;
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGrade),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${editingGrade ? 'update' : 'create'} grade`);
      }
      
      // Refresh grades list
      const gRes = await fetch(`/api/schools/${schoolCode}/grades`);
      if (gRes.ok) {
        const gradesData = await gRes.json();
        const gradesArray = Array.isArray(gradesData) ? gradesData : (gradesData.data && Array.isArray(gradesData.data) ? gradesData.data : []);
        setGrades(gradesArray);
      }
      
      setShowGradeModal(false);
      setNewGrade({ name: "" });
      setEditingGrade(null);
      toast({ title: "Success!", description: `Grade ${editingGrade ? 'updated' : 'created'} successfully!` });
    } catch (err: any) {
      setGradeError(err.message || `Failed to ${editingGrade ? 'update' : 'create'} grade.`);
      toast({ title: "Error", description: err.message || `Failed to ${editingGrade ? 'update' : 'create'} grade.`, variant: "destructive" });
    }
  };


  return (
    <div className="space-y-8">
      {/* Enhanced Toggle Section */}
      <div className="flex items-center justify-center">
        <div className="bg-gray-100 p-1 rounded-2xl shadow-inner">
          <div className="flex space-x-1">
            <Button 
              variant={viewMode === "subjects" ? "default" : "ghost"} 
              onClick={() => setViewMode("subjects")}
              className={`rounded-xl px-6 py-2 font-medium transition-all duration-200 ${
                viewMode === "subjects" 
                  ? 'shadow-md text-white' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={viewMode === "subjects" ? { backgroundColor: colorTheme } : {}}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Subjects
            </Button>
            <Button 
              variant={viewMode === "classes" ? "default" : "ghost"} 
              onClick={() => setViewMode("classes")}
              className={`rounded-xl px-6 py-2 font-medium transition-all duration-200 ${
                viewMode === "classes" 
                  ? 'shadow-md text-white' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              style={viewMode === "classes" ? { backgroundColor: colorTheme } : {}}
            >
              <Users className="w-4 h-4 mr-2" />
              Classes & Grades
            </Button>
          </div>
        </div>
      </div>

      {/* Subjects Section */}
      {viewMode === "subjects" && (
        <Card className="shadow-lg border-0 rounded-2xl bg-gradient-to-br from-white to-orange-50/30">
          <CardHeader className="border-b border-orange-100/50 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-t-2xl">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center shadow-lg">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-800">Subjects</span>
                  <div className="text-sm text-gray-600 font-normal">
                    {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} available
                  </div>
                </div>
              </div>
              <Button 
                onClick={handleAddSubject} 
                style={{ backgroundColor: colorTheme }} 
                className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Manage academic subjects and curriculum
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {subjects.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-10 h-10 text-orange-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Subjects Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start by adding subjects to your curriculum
                </p>
                <Button 
                  onClick={handleAddSubject} 
                  style={{ backgroundColor: colorTheme }}
                  className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Subject
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50/50">
                    <TableRow className="border-b border-gray-200/60 hover:bg-transparent">
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          Subject
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Code</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Description</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => (
                      <TableRow 
                        key={subject.id}
                        className="border-b border-gray-100 hover:bg-orange-50/30 transition-colors group"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                              {subject.name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{subject.name}</div>
                              <div className="text-sm text-gray-500">Subject ID: {subject.id?.slice(-6) || 'N/A'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-mono bg-blue-100 text-blue-800">
                            {subject.code || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-gray-700 max-w-xs truncate">
                            {subject.description || 'No description'}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditSubject(subject)}
                              className="rounded-lg hover:bg-blue-50 text-blue-600 opacity-75 group-hover:opacity-100 transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="rounded-lg hover:bg-red-50 text-red-600 opacity-75 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Subject?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteSubject(subject.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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
          </CardContent>
        </Card>
      )}
        {/* Subject Modal */}
        <Dialog open={showSubjectModal} onOpenChange={setShowSubjectModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add Subject"}</DialogTitle>
              <DialogDescription>Fill in all required fields for the subject.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Subject Name *</Label>
                  <Input value={subjectForm.name} onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input value={subjectForm.code} onChange={e => setSubjectForm({ ...subjectForm, code: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={subjectForm.description} onChange={e => setSubjectForm({ ...subjectForm, description: e.target.value })} />
                </div>
              </div>
              {error && <div className="text-red-600">{error}</div>}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setShowSubjectModal(false)}>Cancel</Button>
                <Button type="submit" style={{ backgroundColor: colorTheme }} disabled={loading}>{loading ? "Saving..." : editingSubject ? "Update Subject" : "Add Subject"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

      
      {/* Classes Section */}
      {viewMode === "classes" && (
        <Card className="shadow-lg border-0 rounded-2xl bg-gradient-to-br from-white to-indigo-50/30">
          <CardHeader className="border-b border-indigo-100/50 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-2xl">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold text-gray-800">Classes & Grades</span>
                  <div className="text-sm text-gray-600 font-normal">
                    {classes.length} {classes.length === 1 ? 'class' : 'classes'} configured
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <BulkImport 
                  entityType="classes" 
                  schoolCode={schoolCode} 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl border-indigo-200 hover:bg-indigo-50 transition-colors"
                />
                <Button 
                  onClick={handleAddClass} 
                  style={{ backgroundColor: colorTheme }}
                  className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Class
                </Button>
              </div>
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Manage class structures and grade levels
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {classes.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-10 h-10 text-indigo-500" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Classes Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Create classes to organize students by grade level
                </p>
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={handleAddClass} 
                    style={{ backgroundColor: colorTheme }}
                    className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Class
                  </Button>
                  <BulkImport 
                    entityType="classes" 
                    schoolCode={schoolCode} 
                    variant="outline"
                    className="rounded-xl border-indigo-200 hover:bg-indigo-50"
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
                          <Users className="w-4 h-4" />
                          Class
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Grade</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Level</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Capacity</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4">Enrolled</TableHead>
                      <TableHead className="font-semibold text-gray-700 py-4 px-6">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classes.map((cls: any) => (
                      <TableRow 
                        key={cls.id}
                        className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors group"
                      >
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                              {cls.name?.charAt(0)?.toUpperCase() || 'C'}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800">{cls.name}</div>
                              <div className="text-sm text-gray-500">Class ID: {cls.id?.slice(-6) || 'N/A'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {cls.grade?.name || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-gray-700">{cls.level || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-gray-700">{cls.capacity || 'N/A'}</div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-700">{cls.currentStudents || 0}</span>
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-indigo-500 h-2 rounded-full" 
                                style={{ 
                                  width: cls.capacity > 0 ? `${Math.min((cls.currentStudents || 0) / cls.capacity * 100, 100)}%` : '0%' 
                                }}
                              ></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => {
                                setNewClass(cls);
                                setShowClassModal(true);
                                setClassError("");
                              }}
                              className="rounded-lg hover:bg-blue-50 text-blue-600 opacity-75 group-hover:opacity-100 transition-all"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="rounded-lg hover:bg-red-50 text-red-600 opacity-75 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Class?</AlertDialogTitle>
                                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteClass(cls.id)} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
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
          </CardContent>
        </Card>
      )}
        {/* Class Modal */}
        <Dialog open={showClassModal} onOpenChange={setShowClassModal}>
          <DialogContent>
            <DialogHeader>
                <DialogTitle>{newClass && newClass.id ? "Edit Class" : "Add New Class"}</DialogTitle>
              <DialogDescription>Fill in all required fields for the class.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveClass} className="space-y-4">
              <div className="space-y-2">
                <Label>Class Name *</Label>
                <Input value={newClass.name || ""} onChange={e => setNewClass({ ...newClass, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Grade *</Label>
                <Select value={newClass.gradeId || ""} onValueChange={value => setNewClass({ ...newClass, gradeId: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {(() => {
                      console.log('Grades in dropdown:', grades);
                      console.log('Grades length:', grades?.length);
                      return (grades || []).filter(grade => grade && grade.id && grade.name && grade.id.trim() !== '').map(grade => {
                        console.log('Rendering grade:', grade);
                        return (
                          <SelectItem key={grade.id} value={grade.id}>{grade.name}</SelectItem>
                        );
                      });
                    })()}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Level *</Label>
                <Select value={newClass.level || ""} onValueChange={value => setNewClass({ ...newClass, level: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Primary">Primary</SelectItem>
                    <SelectItem value="Secondary">Secondary</SelectItem>
                    <SelectItem value="College">College</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Class Teacher</Label>
                <Select value={newClass.classTeacherId || ""} onValueChange={value => setNewClass({ ...newClass, classTeacherId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.length === 0 ? (
                      <SelectItem value="no-teachers" disabled>No teachers found</SelectItem>
                    ) : (
                                              teachers.filter(teacher => teacher && teacher.id && teacher.name && teacher.id.trim() !== '').map(teacher => (
                          <SelectItem key={teacher.id} value={teacher.id}>{teacher.name}</SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              


              {classError && <div className="text-red-600">{classError}</div>}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => setShowClassModal(false)}>Cancel</Button>
                  <Button type="submit" style={{ backgroundColor: colorTheme }}>{newClass && newClass.id ? "Update Class" : "Add Class"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Grade Modal */}
        <Dialog open={showGradeModal} onOpenChange={setShowGradeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGrade ? "Edit Grade" : "Add Custom Grade"}</DialogTitle>
              <DialogDescription>{editingGrade ? "Update the grade name." : "Create a new custom grade for your school."}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveGrade} className="space-y-4">
              <div className="space-y-2">
                <Label>Grade Name *</Label>
                <Input 
                  value={newGrade.name} 
                  onChange={e => setNewGrade({ ...newGrade, name: e.target.value })} 
                  placeholder="e.g., Grade 7, Form 1, etc."
                  required 
                />
              </div>
              {gradeError && <div className="text-red-600">{gradeError}</div>}
              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => {
                  setShowGradeModal(false);
                  setNewGrade({ name: "" });
                  setEditingGrade(null);
                }}>Cancel</Button>
                <Button type="submit" style={{ backgroundColor: colorTheme }}>
                  {editingGrade ? "Update Grade" : "Add Grade"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
    </div>
  );
} 