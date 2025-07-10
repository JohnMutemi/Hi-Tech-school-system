"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Calendar,
  BookOpen,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  terms: Term[];
}

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
}

export default function AcademicCalendarPage() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [showEditTermModal, setShowEditTermModal] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingTerm, setEditingTerm] = useState<Term | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });
  const [termFormData, setTermFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const response = await fetch("/api/academic-years");
      if (response.ok) {
        const data = await response.json();
        setAcademicYears(data);
      } else {
        toast.error("Failed to fetch academic years");
      }
    } catch (error) {
      toast.error("Error fetching academic years");
    } finally {
      setLoading(false);
    }
  };

  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/academic-years", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Academic year added successfully");
        setShowAddModal(false);
        setFormData({ name: "", startDate: "", endDate: "" });
        fetchAcademicYears();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add academic year");
      }
    } catch (error) {
      toast.error("Error adding academic year");
    }
  };

  const handleEditYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingYear) return;

    try {
      const response = await fetch(`/api/academic-years/${editingYear.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Academic year updated successfully");
        setShowEditModal(false);
        setEditingYear(null);
        setFormData({ name: "", startDate: "", endDate: "" });
        fetchAcademicYears();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update academic year");
      }
    } catch (error) {
      toast.error("Error updating academic year");
    }
  };

  const handleDeleteYear = async (yearId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this academic year? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/academic-years/${yearId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Academic year deleted successfully");
        fetchAcademicYears();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete academic year");
      }
    } catch (error) {
      toast.error("Error deleting academic year");
    }
  };

  const handleSetCurrent = async (yearId: string) => {
    try {
      const response = await fetch("/api/academic-years/current", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ academicYearId: yearId }),
      });

      if (response.ok) {
        toast.success("Current academic year updated successfully");
        fetchAcademicYears();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to set current academic year");
      }
    } catch (error) {
      toast.error("Error setting current academic year");
    }
  };

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/terms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...termFormData,
          academicYearId: selectedYearId,
        }),
      });

      if (response.ok) {
        toast.success("Term added successfully");
        setShowAddTermModal(false);
        setTermFormData({ name: "", startDate: "", endDate: "" });
        setSelectedYearId("");
        fetchAcademicYears();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to add term");
      }
    } catch (error) {
      toast.error("Error adding term");
    }
  };

  const handleEditTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTerm) return;

    try {
      const response = await fetch(`/api/terms/${editingTerm.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(termFormData),
      });

      if (response.ok) {
        toast.success("Term updated successfully");
        setShowEditTermModal(false);
        setEditingTerm(null);
        setTermFormData({ name: "", startDate: "", endDate: "" });
        fetchAcademicYears();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update term");
      }
    } catch (error) {
      toast.error("Error updating term");
    }
  };

  const handleDeleteTerm = async (termId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this term? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/terms/${termId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Term deleted successfully");
        fetchAcademicYears();
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete term");
      }
    } catch (error) {
      toast.error("Error deleting term");
    }
  };

  const openEditModal = (year: AcademicYear) => {
    setEditingYear(year);
    setFormData({
      name: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
    });
    setShowEditModal(true);
  };

  const openAddTermModal = (yearId: string) => {
    setSelectedYearId(yearId);
    setShowAddTermModal(true);
  };

  const openEditTermModal = (term: Term) => {
    setEditingTerm(term);
    setTermFormData({
      name: term.name,
      startDate: term.startDate,
      endDate: term.endDate,
    });
    setShowEditTermModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Academic Calendar
          </h1>
          <p className="text-gray-600 mt-2">Manage academic years and terms</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Academic Year
        </Button>
      </div>

      <div className="grid gap-6">
        {academicYears.map((year) => (
          <Card key={year.id} className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-xl">{year.name}</CardTitle>
                    <p className="text-sm text-gray-600">
                      {formatDate(year.startDate)} - {formatDate(year.endDate)}
                    </p>
                  </div>
                  {year.isCurrent && (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      Current Year
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(year)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetCurrent(year.id)}
                    disabled={year.isCurrent}
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-3 w-3" />
                    Set Current
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteYear(year.id)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Terms ({year.terms.length})
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openAddTermModal(year.id)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Term
                </Button>
              </div>
              {year.terms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {year.terms.map((term) => (
                    <div
                      key={term.id}
                      className="bg-gray-50 p-3 rounded-lg relative group"
                    >
                      <div className="font-medium text-sm">{term.name}</div>
                      <div className="text-xs text-gray-600">
                        {formatDate(term.startDate)} -{" "}
                        {formatDate(term.endDate)}
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTermModal(term)}
                            className="h-6 w-6 p-0"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTerm(term.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No terms added yet
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Academic Year Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Academic Year</h2>
            <form onSubmit={handleAddYear}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: "", startDate: "", endDate: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Year</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Academic Year Modal */}
      {showEditModal && editingYear && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Academic Year</h2>
            <form onSubmit={handleEditYear}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Year Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingYear(null);
                    setFormData({ name: "", startDate: "", endDate: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Year</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Term Modal */}
      {showAddTermModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Term</h2>
            <form onSubmit={handleAddTerm}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term Name
                  </label>
                  <input
                    type="text"
                    value={termFormData.name}
                    onChange={(e) =>
                      setTermFormData({ ...termFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., First Term"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={termFormData.startDate}
                    onChange={(e) =>
                      setTermFormData({
                        ...termFormData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={termFormData.endDate}
                    onChange={(e) =>
                      setTermFormData({
                        ...termFormData,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddTermModal(false);
                    setTermFormData({ name: "", startDate: "", endDate: "" });
                    setSelectedYearId("");
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Term</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Term Modal */}
      {showEditTermModal && editingTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Term</h2>
            <form onSubmit={handleEditTerm}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Term Name
                  </label>
                  <input
                    type="text"
                    value={termFormData.name}
                    onChange={(e) =>
                      setTermFormData({ ...termFormData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., First Term"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={termFormData.startDate}
                    onChange={(e) =>
                      setTermFormData({
                        ...termFormData,
                        startDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={termFormData.endDate}
                    onChange={(e) =>
                      setTermFormData({
                        ...termFormData,
                        endDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditTermModal(false);
                    setEditingTerm(null);
                    setTermFormData({ name: "", startDate: "", endDate: "" });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Term</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
