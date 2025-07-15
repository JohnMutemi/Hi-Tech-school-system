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
import { useToast } from "@/hooks/use-toast";

export default function NextClassStep({ onNext }: { onNext: () => void }) {
  const { wizardState, setWizardState } = useContext(PromotionWizardContext);
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
  const { toast } = useToast();

  // Fetch classes, grades, and teachers on mount
  const fetchClasses = async () => {
    if (!schoolCode) return;
    const res = await fetch(`/api/schools/${schoolCode}/classes`);
    if (res.ok) {
      setClasses(await res.json());
    }
  };

  // Fetch progression rules from backend
  const fetchProgressionRules = async () => {
    if (!schoolCode) return;
    const res = await fetch(`/api/schools/${schoolCode}/progression`);
    if (res.ok) {
      const data = await res.json();
      setEditingRules(
        Array.isArray(data.progressions) ? data.progressions : []
      );
    } else {
      setEditingRules([]);
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

  // Fetch classes, grades, teachers, and progression rules on mount
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
      // Fetch progression rules
      fetchProgressionRules();
    }
    fetchData();
  }, [schoolCode]);

  // Also fetch progression rules after saving
  useEffect(() => {
    if (progressionSaved) {
      fetchProgressionRules();
    }
  }, [progressionSaved, schoolCode]);

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

  // Save progression rules from modal
  const handleSaveProgression = async () => {
    // Build progression rules from current classes/grades
    // For each class, find its next class (progression)
    const rules = [];
    // Sort grades by number for correct order
    const sortedGrades = [...grades].sort((a, b) => {
      const aNum = parseInt(a.name.replace(/\D/g, ""));
      const bNum = parseInt(b.name.replace(/\D/g, ""));
      return aNum - bNum;
    });
    for (let i = 0; i < sortedGrades.length; i++) {
      const grade = sortedGrades[i];
      const gradeClasses = classes.filter((c) => c.gradeId === grade.id);
      for (const cls of gradeClasses) {
        // Find next grade
        let toClass = "";
        if (i === sortedGrades.length - 1) {
          // Last grade, promote to ALUMNI if exists
          const alumniClass = classes.find(
            (c) => c.name.trim().toLowerCase() === "alumni"
          );
          toClass = alumniClass ? alumniClass.name : "ALUMNI";
        } else {
          // Promote to next grade, same stream
          const nextGrade = sortedGrades[i + 1];
          const streamSuffix = cls.name.replace(grade.name, "").trim();
          const nextGradeClass = classes.find(
            (c) => c.gradeId === nextGrade.id && c.name.endsWith(streamSuffix)
          );
          toClass = nextGradeClass
            ? nextGradeClass.name
            : `${nextGrade.name} ${streamSuffix}`.trim();
        }
        rules.push({
          fromClass: cls.name,
          toClass,
          order: i + 1,
        });
      }
    }
    try {
      const res = await fetch(`/api/schools/${schoolCode}/progression`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      if (!res.ok) throw new Error("Failed to save progression rules");
      setProgressionModalOpen(false);
      setProgressionSaved(true); // Show review table
      toast({
        title: "Progression rules saved!",
        description: "Class progression rules have been saved successfully.",
        variant: "success",
      });
      // Fetch and update editingRules after save
      fetchProgressionRules();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Error saving progression rules.",
        variant: "destructive",
      });
    }
  };

  // Section 2: Fetch review students after rules are saved or if progression rules exist
  useEffect(() => {
    async function fetchReview() {
      if (editingRules.length === 0) return;
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
  }, [editingRules, schoolCode]);

  // After fetching review students, attach toClass and outstandingBalance to each eligible student in wizard state
  useEffect(() => {
    if (reviewStudents.length > 0 && editingRules.length > 0) {
      setWizardState((prev: any) => {
        const studentsWithToClass = reviewStudents.map((s: any) => {
          const fromClass = s.fromClass || s.className || "";
          const progression = editingRules.find(
            (p: any) => p.fromClass === fromClass
          );
          const toClass = progression ? progression.toClass : "";
          // Preserve outstandingBalance from previous wizard state if present
          const prevStudent = prev.eligibleStudents?.find(
            (e: any) => e.id === s.id
          );
          const outstandingBalance =
            prevStudent?.outstandingBalance ??
            s.outstandingBalance ??
            s.eligibility?.summary?.outstandingBalance ??
            0;
          return { ...s, toClass, outstandingBalance };
        });
        return {
          ...prev,
          eligibleStudents: studentsWithToClass,
        };
      });
    }
  }, [reviewStudents, editingRules, setWizardState]);

  // Check if all rules are set
  const allRulesSet =
    Array.isArray(editingRules) &&
    editingRules.every((r) => r.toClass && r.toClass.trim() !== "");
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
                onSave={handleSaveProgression}
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
      {
        // Always show Section 2 for debugging
        true && (
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
                    reviewStudents.map((s: any, idx: number) => {
                      // Map each student to their next class using progression rules
                      const fromClass = s.fromClass || s.className || "";
                      const progression = editingRules.find(
                        (p: any) => p.fromClass === fromClass
                      );
                      const toClass = progression ? progression.toClass : "";
                      const status = toClass ? "OK" : "Missing";
                      return (
                        <tr key={s.id || idx}>
                          <td className="border px-2 py-1">{s.name}</td>
                          <td className="border px-2 py-1">
                            {s.admissionNumber}
                          </td>
                          <td className="border px-2 py-1">{fromClass}</td>
                          <td className="border px-2 py-1">
                            {toClass || (
                              <span className="text-red-600">Missing</span>
                            )}
                          </td>
                          <td
                            className={`border px-2 py-1 ${
                              status === "OK"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {status}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
            {/* Block Next if any student is missing a progression */}
            {reviewStudents.some((s: any) => {
              const fromClass = s.fromClass || s.className || "";
              const progression = editingRules.find(
                (p: any) => p.fromClass === fromClass
              );
              return !progression || !progression.toClass;
            }) && (
              <div className="text-red-600 mb-2">
                Some students are missing a progression rule. Please fix before
                proceeding.
              </div>
            )}
            <button
              className="bg-green-600 text-white px-4 py-2 rounded mt-4"
              onClick={onNext}
              disabled={reviewStudents.some((s: any) => {
                const fromClass = s.fromClass || s.className || "";
                const progression = editingRules.find(
                  (p: any) => p.fromClass === fromClass
                );
                return !progression || !progression.toClass;
              })}
            >
              Next
            </button>
          </div>
        )
      }
    </div>
  );
}
