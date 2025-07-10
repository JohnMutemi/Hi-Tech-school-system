"use client";
import React, { useEffect, useState } from "react";

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
      setYears(data);
    } catch (err: any) {
      setError(err.message || "Unknown error");
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
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">Academic Calendar Management</h1>
      <p className="text-gray-600 mb-4">
        Here you can manage academic years and terms for your school.
      </p>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => setShowModal(true)}
      >
        + Add Academic Year
      </button>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Academic Year</h2>
            <form onSubmit={handleAddYear} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Year Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. 2025"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Start Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">End Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  required
                />
              </div>
              {formError && <div className="text-red-600">{formError}</div>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowModal(false)}
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={formLoading}
                >
                  {formLoading ? "Adding..." : "Add Year"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Academic Year</h2>
            <form onSubmit={handleEditYear} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Year Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">Start Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-medium">End Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.endDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, endDate: e.target.value })
                  }
                  required
                />
              </div>
              {editError && <div className="text-red-600">{editError}</div>}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setEditModal(false)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      {loading ? (
        <div>Loading academic years...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <table className="min-w-full border mt-4">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Year</th>
              <th className="p-2 border">Start Date</th>
              <th className="p-2 border">End Date</th>
              <th className="p-2 border">Current</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {years.map((year) => (
              <tr key={year.id} className={year.isCurrent ? "bg-green-50" : ""}>
                <td className="p-2 border font-semibold">{year.name}</td>
                <td className="p-2 border">
                  {new Date(year.startDate).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  {new Date(year.endDate).toLocaleDateString()}
                </td>
                <td className="p-2 border text-center">
                  {year.isCurrent ? (
                    <span className="text-green-600 font-bold">Yes</span>
                  ) : (
                    "No"
                  )}
                </td>
                <td className="p-2 border space-x-2">
                  <button
                    className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 border"
                    onClick={() => openEditModal(year)}
                  >
                    Edit
                  </button>
                  <button
                    className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 border"
                    onClick={() => openDeleteModal(year.id)}
                    disabled={year.isCurrent}
                    title={year.isCurrent ? "Cannot delete current year" : ""}
                  >
                    Delete
                  </button>
                  {!year.isCurrent && (
                    <button
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 border"
                      onClick={() => handleSetCurrent(year.id)}
                      disabled={setCurrentLoading === year.id}
                    >
                      {setCurrentLoading === year.id
                        ? "Setting..."
                        : "Set as Current"}
                    </button>
                  )}
                  <button
                    className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 border"
                    onClick={() => openTermsModal(year)}
                  >
                    Manage Terms
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
