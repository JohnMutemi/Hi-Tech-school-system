import React, { useEffect, useState, useContext } from "react";
import { PromotionWizardContext } from "./PromotionWizard";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import ProgressionModal from "./ProgressionModal";

export default function NextClassStep({ onNext }: { onNext: () => void }) {
  const { wizardState } = useContext(PromotionWizardContext);
  const { schoolCode } = wizardState;

  // Section 1: Progression rules
  const [classes, setClasses] = useState<any[]>([]);
  const [progressions, setProgressions] = useState<any[]>([]);
  const [editingRules, setEditingRules] = useState<any[]>([]); // [{fromClass, toClass, ...}]
  const [modalOpen, setModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [progressionSaved, setProgressionSaved] = useState(false);
  const [classToEdit, setClassToEdit] = useState<string | null>(null);
  const [progressionModalOpen, setProgressionModalOpen] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const [grades, setGrades] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Fetch classes, grades, and teachers on mount
  const fetchClasses = async () => {
    if (!schoolCode) return;
    const res = await fetch(`/api/schools/${schoolCode}/classes`);
    if (res.ok) {
      setClasses(await res.json());
    }
  };

  // Track unsaved changes
  useEffect(() => {
    setUnsaved(false);
  }, [progressionSaved]);

  // Mark as unsaved if editing
  useEffect(() => {
    if (!progressionSaved) setUnsaved(true);
  }, [editingRules]);

  // Section 2: Student review
  const [reviewStudents, setReviewStudents] = useState<any[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);

  // Fetch classes, grades, and teachers on mount
  useEffect(() => {
    async function fetchData() {
      if (!schoolCode) return;
      const [classRes, gradeRes, teacherRes] = await Promise.all([
        fetch(`/api/schools/${schoolCode}/classes`),
        fetch(`/api/schools/${schoolCode}/grades`),
        fetch(`/api/schools/${schoolCode}/teachers`),
      ]);
      if (classRes.ok) {
        const data = await classRes.json();
        setClasses(data);
      }
      if (gradeRes.ok) {
        const data = await gradeRes.json();
        setGrades(data);
      }
      if (teacherRes.ok) {
        const data = await teacherRes.json();
        setTeachers(data);
      }
      // Optionally fetch progressions if needed
    }
    fetchData();
  }, [schoolCode]);

  // Save progression rules
  async function handleSaveRules() {
    setError("");
    try {
      const res = await fetch(`/api/schools/${schoolCode}/progression`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: editingRules }),
      });
      if (!res.ok) throw new Error("Failed to save progression rules");
      setProgressionSaved(true);
    } catch (e: any) {
      setError(e.message || "Error saving rules");
    }
  }

  // Modal: create new class
  async function handleCreateClass() {
    setCreating(true);
    setError("");
    try {
      const res = await fetch(`/api/schools/${schoolCode}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newClassName }),
      });
      if (!res.ok) throw new Error("Failed to create class");
      const newClass = await res.json();
      setClasses((prev) => [...prev, newClass]);
      setModalOpen(false);
      setNewClassName("");
      if (classToEdit) {
        setEditingRules((prev) =>
          prev.map((r) =>
            r.fromClass === classToEdit ? { ...r, toClass: newClass.name } : r
          )
        );
        setClassToEdit(null);
      } else {
        // If adding a new class, add to progression rules with empty toClass
        setEditingRules((prev) => [
          ...prev,
          { fromClass: newClass.name, toClass: "", order: prev.length + 1 },
        ]);
      }
    } catch (e: any) {
      setError(e.message || "Error creating class");
    } finally {
      setCreating(false);
    }
  }

  // Section 2: Fetch review students after rules are saved
  useEffect(() => {
    async function fetchReview() {
      if (!progressionSaved) return;
      setLoadingReview(true);
      try {
        const res = await fetch(
          `/api/schools/${schoolCode}/progression/review`
        );
        if (res.ok) {
          const data = await res.json();
          setReviewStudents(data);
        } else {
          setReviewStudents([]);
        }
      } finally {
        setLoadingReview(false);
      }
    }
    fetchReview();
  }, [progressionSaved, schoolCode]);

  // Check if all rules are set
  const allRulesSet = editingRules.every(
    (r) => r.toClass && r.toClass.trim() !== ""
  );
  const allStudentsOK = reviewStudents.every((s) => s.status === "OK");

  return (
    <div>
      <h2 className="font-bold text-lg mb-4">Class Progression</h2>
      {/* Section 1: Progression Rules as Modal */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">1. Set Class Progression Rules</h3>
          <Dialog
            open={progressionModalOpen}
            onOpenChange={(open) => {
              if (!open && unsaved) {
                if (!window.confirm("You have unsaved changes. Close anyway?"))
                  return;
              }
              setProgressionModalOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => setProgressionModalOpen(true)}
              >
                Set Class Progression Rules
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl w-full">
              <ProgressionModal
                grades={grades}
                classes={classes}
                teachers={teachers || []}
                schoolCode={schoolCode || ""}
                onClose={() => setProgressionModalOpen(false)}
                onClassCreated={fetchClasses}
              />
            </DialogContent>
          </Dialog>
        </div>
        {/* Show a summary of current rules or a message if none set */}
        <div className="mb-2">
          {editingRules.length === 0 ? (
            <span className="text-gray-500">No progression rules set yet.</span>
          ) : (
            <ul className="text-sm">
              {editingRules.map((r) => (
                <li key={r.fromClass}>
                  <b>{r.fromClass}</b> →{" "}
                  {r.toClass || <span className="text-red-600">Not set</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {/* Modal for creating class */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-80">
            <h3 className="font-bold mb-2">Create Class</h3>
            <div className="mb-2">
              <label className="block mb-1">Class Name</label>
              <input
                className="border px-2 py-1 w-full"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                disabled={creating}
              />
            </div>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button
                className="px-3 py-1 rounded border"
                onClick={() => setModalOpen(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={handleCreateClass}
                disabled={creating || !newClassName.trim()}
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Section 2: Review Student Progression */}
      {progressionSaved && (
        <div>
          <h3 className="font-semibold mb-2 mt-8">
            2. Review Student Progression
          </h3>
          {loadingReview ? (
            <div>Loading...</div>
          ) : (
            <table className="min-w-full border mb-2">
              <thead>
                <tr>
                  <th className="border px-2 py-1">Name</th>
                  <th className="border px-2 py-1">Admission #</th>
                  <th className="border px-2 py-1">From Class</th>
                  <th className="border px-2 py-1">To Class</th>
                  <th className="border px-2 py-1">Status</th>
                </tr>
              </thead>
              <tbody>
                {reviewStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-2">
                      No students to review.
                    </td>
                  </tr>
                ) : (
                  reviewStudents.map((s: any) => (
                    <tr key={s.id}>
                      <td className="border px-2 py-1">{s.name}</td>
                      <td className="border px-2 py-1">{s.admissionNumber}</td>
                      <td className="border px-2 py-1">{s.fromClass}</td>
                      <td className="border px-2 py-1">{s.toClass}</td>
                      <td
                        className={`border px-2 py-1 ${
                          s.status !== "OK" ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {s.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
          <button
            className="bg-green-600 text-white px-4 py-2 rounded mt-4"
            onClick={onNext}
            disabled={!allStudentsOK}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
