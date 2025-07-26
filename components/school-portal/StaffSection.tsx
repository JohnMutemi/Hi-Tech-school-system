import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Eye, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRef, useState ,useEffect} from "react";
import { CheckCircle, XCircle } from "lucide-react";

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
              <td className="border px-2 py-1">{item.teacher}</td>
              <td className="border px-2 py-1 text-green-700">Success</td>
              <td className="border px-2 py-1"></td>
            </tr>
          ))}
          {errors.map((item, i) => (
            <tr key={`error-${i}`}>
              <td className="border px-2 py-1">{item.teacher}</td>
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
              ...errors.map(e => [e.teacher, e.error])
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

function ImportTeachersButton({ schoolCode, onSuccess }: { schoolCode: string; onSuccess?: (data: any) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  // Remove result and showResult state

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/schools/${schoolCode}/teachers/import`, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (onSuccess) onSuccess(data);
    alert(data.success ? "Import successful!" : "Import failed.");
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => fileInput.current?.click()}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md h-10 font-medium shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors text-sm"
        style={{ minWidth: 120 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Import Teachers
      </button>
      <input
        type="file"
        accept=".xlsx,.csv"
        ref={fileInput}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}

export default function StaffSection({ schoolCode, colorTheme, toast }: any) {
  // State for teachers and bursars
  const [teachers, setTeachers] = useState<any[]>([]);
  const [bursars, setBursars] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<{ staff: string }>({ staff: "list" });
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [newTeacher, setNewTeacher] = useState<any>({});
  const [newBursar, setNewBursar] = useState<any>({});
  const [showTeacherCredentials, setShowTeacherCredentials] = useState(false);
  const [lastTeacherCredentials, setLastTeacherCredentials] = useState<any>(null);
  const [showBursarCredentials, setShowBursarCredentials] = useState(false);
  const [lastBursarCredentials, setLastBursarCredentials] = useState<any>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showBursarModal, setShowBursarModal] = useState(false);
  const [importedTeachers, setImportedTeachers] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<{ created?: any[]; errors?: any[] } | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);

  // Fetch teachers and bursars from backend
  useEffect(() => {
    async function fetchStaff() {
      try {
        const tRes = await fetch(`/api/schools/${schoolCode}/teachers`);
        if (tRes.ok) setTeachers(await tRes.json());
        const bRes = await fetch(`/api/schools/${schoolCode}/bursars`);
        if (bRes.ok) setBursars(await bRes.json());
      } catch (error) {
        toast && toast({ title: "Error", description: "Could not load staff.", variant: "destructive" });
      }
    }
    if (schoolCode) fetchStaff();
  }, [schoolCode, toast]);

  // Handler for import result
  const handleImportResult = (data: any) => {
    setImportResult({ created: data.created, errors: data.errors });
    setShowImportResult(true);
    if (Array.isArray(data.created)) {
      // Optionally, fetch teachers from backend instead
      setImportedTeachers(data.created.map((t: any) => ({
        name: t.teacher,
        email: t.email || '',
        phone: t.phone || '',
        qualification: t.qualification || '',
        dateJoined: t.dateJoined || '',
        status: 'Active',
      })));
    }
  };

  // Combine imported and fetched teachers for display
  const allTeachers = [...importedTeachers, ...teachers];

  // Teacher CRUD handlers
  const createTeacher = async (teacherData: any) => {
    if (!teacherData.name || !teacherData.email) {
      toast && toast({ title: "Validation Error", description: "Name and Email are required.", variant: "destructive" });
      return false;
    }
    const tempPassword = "teacher123";
    try {
      const response = await fetch(`/api/schools/${schoolCode}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...teacherData, tempPassword }),
      });
      if (!response.ok) throw new Error("Failed to create teacher");
      const newTeacher = await response.json();
      setTeachers([...teachers, newTeacher]);
      setNewTeacher({});
      setViewMode({ staff: "list" });
      setLastTeacherCredentials({ email: newTeacher.email, tempPassword });
      setShowTeacherCredentials(true);
      toast && toast({ title: "Success!", description: "Teacher added successfully!" });
      return true;
    } catch (error: any) {
      toast && toast({ title: "Error", description: error.message || "Failed to create teacher.", variant: "destructive" });
      return false;
    }
  };
  const updateTeacher = async (updatedTeacher: any) => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/teachers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTeacher),
      });
      if (!response.ok) throw new Error("Failed to update teacher");
      const returnedTeacher = await response.json();
      setTeachers(teachers.map((t) => (t.id === returnedTeacher.id ? returnedTeacher : t)));
      setEditingItem(null);
      setViewMode({ staff: "list" });
      toast && toast({ title: "Success!", description: "Teacher updated successfully!" });
    } catch (error) {
      toast && toast({ title: "Error", description: "Failed to update teacher.", variant: "destructive" });
    }
  };
  const deleteTeacher = async (id: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/teachers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete teacher");
      setTeachers(teachers.filter((t) => t.id !== id));
      toast && toast({ title: "Success!", description: "Teacher deleted successfully!" });
    } catch (error) {
      toast && toast({ title: "Error", description: "Failed to delete teacher.", variant: "destructive" });
    }
  };

  // Bursar CRUD handlers
  const createBursar = async (bursarData: any) => {
    if (!bursarData.name || !bursarData.email) {
      toast && toast({ title: "Validation Error", description: "Name and Email are required.", variant: "destructive" });
      return false;
    }
    const tempPassword = "bursar123";
    try {
      const response = await fetch(`/api/schools/${schoolCode}/bursars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...bursarData, tempPassword }),
      });
      if (!response.ok) throw new Error("Failed to create bursar");
      const newBursar = await response.json();
      setBursars([...bursars, newBursar]);
      setNewBursar({});
      setViewMode({ staff: "list" });
      setLastBursarCredentials({ email: newBursar.email, tempPassword });
      setShowBursarCredentials(true);
      toast && toast({ title: "Success!", description: "Bursar added successfully!" });
      return true;
    } catch (error: any) {
      toast && toast({ title: "Error", description: error.message || "Failed to create bursar.", variant: "destructive" });
      return false;
    }
  };
  const updateBursar = async (updatedBursar: any) => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/bursars`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBursar),
      });
      if (!response.ok) throw new Error("Failed to update bursar");
      const returnedBursar = await response.json();
      setBursars(bursars.map((b) => (b.id === returnedBursar.id ? returnedBursar : b)));
      setEditingItem(null);
      setViewMode({ staff: "list" });
      toast && toast({ title: "Success!", description: "Bursar updated successfully!" });
    } catch (error) {
      toast && toast({ title: "Error", description: "Failed to update bursar.", variant: "destructive" });
    }
  };
  const deleteBursar = async (id: string) => {
    try {
      const response = await fetch(`/api/schools/${schoolCode}/bursars`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("Failed to delete bursar");
      setBursars(bursars.filter((b) => b.id !== id));
      toast && toast({ title: "Success!", description: "Bursar deleted successfully!" });
    } catch (error) {
      toast && toast({ title: "Error", description: "Failed to delete bursar.", variant: "destructive" });
    }
  };

  // TeacherForm and BursarForm components
  const TeacherForm = ({ teacher, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState<any>(teacher || newTeacher);
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (teacher) {
        onSave(formData);
      } else {
        const success = await createTeacher(formData);
        if (success) setFormData({});
      }
    };
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {teacher ? "Edit Teacher" : "Add New Teacher"}
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Teacher Name" required />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" value={formData.email || ""} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="teacher@school.edu" required />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={formData.phone || ""} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+254 700 000 000" />
              </div>
              <div className="space-y-2">
                <Label>Qualification</Label>
                <Input value={formData.qualification || ""} onChange={e => setFormData({ ...formData, qualification: e.target.value })} placeholder="e.g., Bachelor of Education" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date Joined</Label>
              <Input type="date" value={formData.dateJoined || ""} onChange={e => setFormData({ ...formData, dateJoined: e.target.value })} />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" style={{ backgroundColor: colorTheme }}> {teacher ? "Update Teacher" : "Add Teacher"} </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };
  const BursarForm = ({ bursar, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState<any>(bursar || newBursar);
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (bursar) {
        onSave(formData);
      } else {
        const success = await createBursar(formData);
        if (success) setFormData({});
      }
    };
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {bursar ? "Edit Bursar" : "Add New Bursar"}
            <Button variant="outline" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input value={formData.name || ""} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Bursar Name" required />
              </div>
              <div className="space-y-2">
                <Label>Email Address *</Label>
                <Input type="email" value={formData.email || ""} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="bursar@school.edu" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={formData.phone || ""} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+254 700 000 000" />
            </div>
            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
              <Button type="submit" style={{ backgroundColor: colorTheme }}> {bursar ? "Update Bursar" : "Add Bursar"} </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  };

  const handleAddTeacher = () => {
    setNewTeacher({});
    setEditingItem(null);
    setShowTeacherModal(true);
  };
  const handleEditTeacher = (teacher: any) => {
    setEditingItem(teacher);
    setShowTeacherModal(true);
  };
  const handleAddBursar = () => {
    setNewBursar({});
    setEditingItem(null);
    setShowBursarModal(true);
  };
  const handleEditBursar = (bursar: any) => {
    setEditingItem(bursar);
    setShowBursarModal(true);
  };

  // Main staff section UI
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Teachers</span>
            <div className="flex gap-2">
              <ImportTeachersButton schoolCode={schoolCode} onSuccess={handleImportResult} />
              <Button onClick={handleAddTeacher} style={{ backgroundColor: colorTheme }}>+ Add Teacher</Button>
            </div>
          </CardTitle>
          <CardDescription>Manage your school's teaching staff</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTeachers.map((teacher, idx) => (
                <TableRow key={teacher.id || teacher.email || idx}>
                  <TableCell>{teacher.name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.phone}</TableCell>
                  <TableCell>{teacher.qualification}</TableCell>
                  <TableCell>{teacher.dateJoined ? new Date(teacher.dateJoined).toLocaleDateString() : ''}</TableCell>
                  <TableCell>{teacher.status || 'Active'}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => setViewingItem(teacher)}>View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bursars Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Bursars ({bursars.length})
            <Button onClick={handleAddBursar} style={{ backgroundColor: colorTheme }}>
              <Plus className="w-4 h-4 mr-2" /> Add Bursar
            </Button>
          </CardTitle>
          <CardDescription>Manage your school's financial staff</CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode.staff === "bursar-form" ? (
            <BursarForm onSave={createBursar} onCancel={() => setViewMode({ staff: "list" })} />
          ) : editingItem ? (
            <BursarForm bursar={editingItem} onSave={updateBursar} onCancel={() => { setEditingItem(null); setViewMode({ staff: "list" }); }} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bursars.map((bursar) => (
                    <TableRow key={bursar.id}>
                      <TableCell className="font-medium">{bursar.name}</TableCell>
                      <TableCell>{bursar.email}</TableCell>
                      <TableCell>{bursar.phone || "-"}</TableCell>
                      <TableCell><Badge variant="default">Active</Badge></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setViewingItem(bursar)}><Eye className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEditBursar(bursar)}><Edit className="w-4 h-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Bursar</AlertDialogTitle>
                                <AlertDialogDescription>Are you sure you want to delete {bursar.name}? This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteBursar(bursar.id)}>Delete</AlertDialogAction>
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

      {/* Teacher Credentials Modal */}
      <Dialog open={showTeacherCredentials} onOpenChange={setShowTeacherCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Credentials</DialogTitle>
            <DialogDescription>Share these credentials with the teacher. They will use them to log in for the first time.</DialogDescription>
          </DialogHeader>
          {lastTeacherCredentials && (
            <div className="space-y-2">
              <div><strong>Email:</strong> {lastTeacherCredentials.email}</div>
              <div><strong>Temporary Password:</strong> {lastTeacherCredentials.tempPassword}</div>
            </div>
          )}
          <Button onClick={() => setShowTeacherCredentials(false)} className="mt-4">Close</Button>
        </DialogContent>
      </Dialog>

      {/* Bursar Credentials Modal */}
      <Dialog open={showBursarCredentials} onOpenChange={setShowBursarCredentials}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bursar Login Credentials</DialogTitle>
            <DialogDescription>Share these credentials with the bursar for their first login.<br /><span className="text-blue-700 font-semibold">Default password for all new bursars is <b>bursar123</b>.</span></DialogDescription>
          </DialogHeader>
          {lastBursarCredentials && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center"><strong>Email:</strong><span className="font-mono">{lastBursarCredentials.email}</span></div>
                <div className="flex justify-between items-center"><strong>Password:</strong><span className="font-mono text-blue-700">{lastBursarCredentials.tempPassword}</span></div>
              </div>
              <Button onClick={() => setShowBursarCredentials(false)} className="mt-4">Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Teacher Modal */}
      <Dialog open={showTeacherModal} onOpenChange={setShowTeacherModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Teacher" : "Add Teacher"}</DialogTitle>
            <DialogDescription>Fill in all required fields for the teacher.</DialogDescription>
          </DialogHeader>
          <TeacherForm teacher={editingItem} onSave={updateTeacher} onCancel={() => setShowTeacherModal(false)} />
        </DialogContent>
      </Dialog>

      {/* Bursar Modal */}
      <Dialog open={showBursarModal} onOpenChange={setShowBursarModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Bursar" : "Add Bursar"}</DialogTitle>
            <DialogDescription>Fill in all required fields for the bursar.</DialogDescription>
          </DialogHeader>
          <BursarForm bursar={editingItem} onSave={updateBursar} onCancel={() => setShowBursarModal(false)} />
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={!!viewingItem} onOpenChange={() => setViewingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
          </DialogHeader>
          <div>
            <div><strong>Name:</strong> {viewingItem?.name}</div>
            <div><strong>Email:</strong> {viewingItem?.email}</div>
            <div><strong>Phone:</strong> {viewingItem?.phone}</div>
            <div><strong>Qualification:</strong> {viewingItem?.qualification}</div>
            <div><strong>Date Joined:</strong> {viewingItem?.dateJoined ? new Date(viewingItem.dateJoined).toLocaleDateString() : ''}</div>
            <div className="mt-4 p-2 bg-blue-50 rounded">
              <div><strong>Login Email:</strong> {viewingItem?.email}</div>
              <div><strong>Default Password:</strong> <span className="font-mono">teacher123</span></div>
              <a
                href={`/schools/${schoolCode}/teachers/login`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white rounded"
              >
                Go to Teacher Login
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 