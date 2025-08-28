"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Plus, Edit, Trash2, CheckCircle, Clock, Settings } from "lucide-react";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export function AcademicCalendarCrud({ schoolCode }: { schoolCode: string }) {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Academic Year modal state
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit Academic Year modal state
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    startDate: "",
    endDate: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Academic Year modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteYearId, setDeleteYearId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Set Current loading state
  const [setCurrentLoading, setSetCurrentLoading] = useState<string | null>(
    null
  );

  // Term management state
  const [termsModal, setTermsModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);
  const [terms, setTerms] = useState<any[]>([]);
  const [termsLoading, setTermsLoading] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [termForm, setTermForm] = useState({
    id: "",
    name: "",
    startDate: "",
    endDate: "",
  });
  const [termFormMode, setTermFormMode] = useState<"add" | "edit">("add");
  const [termFormLoading, setTermFormLoading] = useState(false);
  const [termFormError, setTermFormError] = useState<string | null>(null);
  const [setCurrentTermLoading, setSetCurrentTermLoading] = useState<
    string | null
  >(null);
  const [deleteTermLoading, setDeleteTermLoading] = useState<string | null>(
    null
  );
  const [deleteTermError, setDeleteTermError] = useState<string | null>(null);

  const fetchYears = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/academic-years`);
      if (!res.ok) throw new Error("Failed to fetch academic years");
      const data = await res.json();
      setYears(Array.isArray(data) ? data : (data.data && Array.isArray(data.data) ? data.data : []));
    } catch (err: any) {
      setError(err.message || "Unknown error");
      setYears([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schoolCode) fetchYears();
  }, [schoolCode]);

  // Add Academic Year
  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/academic-years`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          startDate: form.startDate,
          endDate: form.endDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add academic year");
      }
      setShowModal(false);
      setForm({ name: "", startDate: "", endDate: "" });
      fetchYears();
    } catch (err: any) {
      setFormError(err.message || "Unknown error");
    } finally {
      setFormLoading(false);
    }
  };

  // Edit Academic Year
  const openEditModal = (year: AcademicYear) => {
    setEditForm({
      id: year.id,
      name: year.name,
      startDate: year.startDate.slice(0, 10),
      endDate: year.endDate.slice(0, 10),
    });
    setEditError(null);
    setEditModal(true);
  };
  const handleEditYear = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/academic-years`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editForm.id,
          name: editForm.name,
          startDate: editForm.startDate,
          endDate: editForm.endDate,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update academic year");
      }
      setEditModal(false);
      fetchYears();
    } catch (err: any) {
      setEditError(err.message || "Unknown error");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Academic Year
  const openDeleteModal = (id: string) => {
    setDeleteYearId(id);
    setDeleteError(null);
    setDeleteModal(true);
  };
  const handleDeleteYear = async () => {
    if (!deleteYearId) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/academic-years`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteYearId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete academic year");
      }
      setDeleteModal(false);
      setDeleteYearId(null);
      fetchYears();
    } catch (err: any) {
      setDeleteError(err.message || "Unknown error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Set Current Academic Year
  const handleSetCurrent = async (id: string) => {
    setSetCurrentLoading(id);
    try {
      const res = await fetch(
        `/api/schools/${schoolCode}?action=set-current-academic-year`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ academicYearId: id }),
        }
      );
      if (!res.ok) throw new Error("Failed to set current academic year");
      fetchYears();
    } catch (err) {
      // Optionally show error
    } finally {
      setSetCurrentLoading(null);
    }
  };

  const openTermsModal = async (year: AcademicYear) => {
    setSelectedYear(year);
    setTermsModal(true);
    setTermsLoading(true);
    setTermsError(null);
    try {
      const res = await fetch(
        `/api/schools/${schoolCode}/terms?yearId=${year.id}`
      );
      if (!res.ok) throw new Error("Failed to fetch terms");
      const data = await res.json();
      setTerms(data);
    } catch (err: any) {
      setTermsError(err.message || "Unknown error");
    } finally {
      setTermsLoading(false);
    }
  };

  const handleAddOrEditTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    setTermFormLoading(true);
    setTermFormError(null);
    try {
      const url = `/api/schools/${schoolCode}/terms`;
      const method = termFormMode === "add" ? "POST" : "PUT";
      const body =
        termFormMode === "add"
          ? { ...termForm, academicYearId: selectedYear?.id }
          : { ...termForm };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save term");
      }
      // Refresh terms
      openTermsModal(selectedYear!);
      setTermForm({ id: "", name: "", startDate: "", endDate: "" });
      setTermFormMode("add");
    } catch (err: any) {
      setTermFormError(err.message || "Unknown error");
    } finally {
      setTermFormLoading(false);
    }
  };

  const openEditTerm = (term: any) => {
    setTermForm({
      id: term.id,
      name: term.name,
      startDate: term.startDate.slice(0, 10),
      endDate: term.endDate.slice(0, 10),
    });
    setTermFormMode("edit");
  };

  const handleDeleteTerm = async (id: string) => {
    setDeleteTermLoading(id);
    setDeleteTermError(null);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/terms`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete term");
      }
      openTermsModal(selectedYear!);
    } catch (err: any) {
      setDeleteTermError(err.message || "Unknown error");
    } finally {
      setDeleteTermLoading(null);
    }
  };

  const handleSetCurrentTerm = async (id: string) => {
    setSetCurrentTermLoading(id);
    try {
      const res = await fetch(
        `/api/schools/${schoolCode}?action=set-current-term`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ termId: id }),
        }
      );
      if (!res.ok) throw new Error("Failed to set current term");
      openTermsModal(selectedYear!);
    } catch (err) {
      // Optionally show error
    } finally {
      setSetCurrentTermLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 rounded-2xl bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-800">Academic Calendar</span>
                <div className="text-sm text-gray-600 font-normal">
                  {years.length} {years.length === 1 ? 'year' : 'years'} configured
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowModal(true)}
              className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200 px-6 py-2 font-medium bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Academic Year
            </Button>
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Manage academic years and terms for your school calendar
          </CardDescription>
        </CardHeader>
      
      {/* Add Academic Year Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Academic Year</DialogTitle>
            <DialogDescription>
              Create a new academic year for your school calendar
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddYear} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="year-name">Year Name</Label>
              <Input
                id="year-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. 2025"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
            {formError && <div className="text-red-600 text-sm">{formError}</div>}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                disabled={formLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={formLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {formLoading ? "Adding..." : "Add Year"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Academic Year Dialog */}
      <Dialog open={editModal} onOpenChange={setEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
            <DialogDescription>
              Update the academic year information
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditYear} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-year-name">Year Name</Label>
              <Input
                id="edit-year-name"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-start-date">Start Date</Label>
              <Input
                id="edit-start-date"
                type="date"
                value={editForm.startDate}
                onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-end-date">End Date</Label>
              <Input
                id="edit-end-date"
                type="date"
                value={editForm.endDate}
                onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                required
              />
            </div>
            {editError && <div className="text-red-600 text-sm">{editError}</div>}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditModal(false)}
                disabled={editLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={editLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Delete Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-700">
              Delete Academic Year
            </h2>
            <p className="mb-4">
              Are you sure you want to delete this academic year? This action
              cannot be undone.
            </p>
            {deleteError && (
              <div className="text-red-600 mb-2">{deleteError}</div>
            )}
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleDeleteYear}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16 px-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading academic years...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 font-medium">{error}</p>
            </div>
          ) : years.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Academic Years Yet</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Create your first academic year to start organizing your school calendar
              </p>
              <Button
                onClick={() => setShowModal(true)}
                className="rounded-xl shadow-md hover:shadow-lg transition-all duration-200 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Academic Year
              </Button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {(years || []).map((year) => (
                <div
                  key={year.id}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                    year.isCurrent
                      ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
                      : "border-gray-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${
                        year.isCurrent
                          ? "bg-gradient-to-br from-green-500 to-emerald-600"
                          : "bg-gradient-to-br from-blue-500 to-indigo-600"
                      }`}>
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-800">{year.name}</h3>
                          {year.isCurrent && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Current Year
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(year)}
                        className="rounded-lg hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openTermsModal(year)}
                        className="rounded-lg hover:bg-indigo-50"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Terms
                      </Button>
                      {!year.isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetCurrent(year.id)}
                          disabled={setCurrentLoading === year.id}
                          className="rounded-lg border-green-200 text-green-700 hover:bg-green-50"
                        >
                          {setCurrentLoading === year.id ? "Setting..." : "Set Current"}
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={year.isCurrent}
                            className="rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50"
                            title={year.isCurrent ? "Cannot delete current year" : ""}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Academic Year</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the academic year "{year.name}"? This action cannot be undone and will remove all associated terms.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteYear(year.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Year
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {termsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-4">
              Manage Terms for {selectedYear?.name}
            </h2>
            {termsLoading ? (
              <div>Loading terms...</div>
            ) : termsError ? (
              <div className="text-red-600">{termsError}</div>
            ) : (
              <>
                <form
                  onSubmit={handleAddOrEditTerm}
                  className="mb-4 flex gap-2 flex-wrap items-end"
                >
                  <input
                    type="text"
                    className="border rounded px-2 py-1"
                    placeholder="Term Name (e.g. Term 1)"
                    value={termForm.name}
                    onChange={(e) =>
                      setTermForm({ ...termForm, name: e.target.value })
                    }
                    required
                  />
                  <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={termForm.startDate}
                    onChange={(e) =>
                      setTermForm({ ...termForm, startDate: e.target.value })
                    }
                    required
                  />
                  <input
                    type="date"
                    className="border rounded px-2 py-1"
                    value={termForm.endDate}
                    onChange={(e) =>
                      setTermForm({ ...termForm, endDate: e.target.value })
                    }
                    required
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={termFormLoading}
                  >
                    {termFormMode === "add"
                      ? termFormLoading
                        ? "Adding..."
                        : "Add Term"
                      : termFormLoading
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                  {termFormMode === "edit" && (
                    <button
                      type="button"
                      className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      onClick={() => {
                        setTermForm({
                          id: "",
                          name: "",
                          startDate: "",
                          endDate: "",
                        });
                        setTermFormMode("add");
                      }}
                      disabled={termFormLoading}
                    >
                      Cancel
                    </button>
                  )}
                  {termFormError && (
                    <div className="text-red-600 ml-2">{termFormError}</div>
                  )}
                </form>
                <table className="min-w-full border mb-4">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">Term</th>
                      <th className="p-2 border">Start Date</th>
                      <th className="p-2 border">End Date</th>
                      <th className="p-2 border">Current</th>
                      <th className="p-2 border">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {terms.map((term) => (
                      <tr
                        key={term.id}
                        className={term.isCurrent ? "bg-green-50" : ""}
                      >
                        <td className="p-2 border font-semibold">
                          {term.name}
                        </td>
                        <td className="p-2 border">
                          {new Date(term.startDate).toLocaleDateString()}
                        </td>
                        <td className="p-2 border">
                          {new Date(term.endDate).toLocaleDateString()}
                        </td>
                        <td className="p-2 border text-center">
                          {term.isCurrent ? (
                            <span className="text-green-600 font-bold">
                              Yes
                            </span>
                          ) : (
                            "No"
                          )}
                        </td>
                        <td className="p-2 border space-x-2">
                          <button
                            className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 border"
                            onClick={() => openEditTerm(term)}
                          >
                            Edit
                          </button>
                          <button
                            className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 border"
                            onClick={() => handleDeleteTerm(term.id)}
                            disabled={deleteTermLoading === term.id}
                          >
                            {deleteTermLoading === term.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                          {!term.isCurrent && (
                            <button
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border"
                              onClick={() => handleSetCurrentTerm(term.id)}
                              disabled={setCurrentTermLoading === term.id}
                            >
                              {setCurrentTermLoading === term.id
                                ? "Setting..."
                                : "Set as Current"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {deleteTermError && (
                  <div className="text-red-600 mb-2">{deleteTermError}</div>
                )}
              </>
            )}
            <div className="flex justify-end mt-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setTermsModal(false);
                  setSelectedYear(null);
                  setTerms([]);
                  setTermForm({ id: "", name: "", startDate: "", endDate: "" });
                  setTermFormMode("add");
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
