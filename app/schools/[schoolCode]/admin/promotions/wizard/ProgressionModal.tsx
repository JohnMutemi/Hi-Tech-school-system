import React, { useState } from "react";
import ClassCreateForm from "./ClassCreateForm";

interface Grade {
  id: string;
  name: string;
  isAlumni?: boolean;
}
interface SchoolClass {
  id: string;
  name: string;
  gradeId: string;
}
interface Teacher {
  id: string;
  name: string;
}

interface ProgressionModalProps {
  grades: Grade[];
  classes: SchoolClass[];
  teachers: Teacher[];
  schoolCode: string;
  onClose: () => void;
  onClassCreated?: () => void; // callback to refresh parent data
}

// Helper to get next grade name
function getNextGradeName(
  grades: Grade[],
  currentGradeName: string
): string | null {
  const idx = grades.findIndex((g) => g.name === currentGradeName);
  if (idx === -1) return null;
  if (idx === grades.length - 1) return "ALUMNI";
  return grades[idx + 1]?.name || null;
}

export default function ProgressionModal({
  grades,
  classes,
  teachers = [], // default to empty array
  schoolCode,
  onClose,
  onClassCreated,
}: ProgressionModalProps) {
  const [createDialog, setCreateDialog] = useState<{
    open: boolean;
    gradeId: string;
    name: string;
  }>({ open: false, gradeId: "", name: "" });

  // Build all grade/class combinations
  const rows: {
    fromClass: string;
    toClass: string;
    status: string;
    action: string;
    nextGradeId: string | null;
    nextClassName: string;
  }[] = [];

  // Sort grades by name (assuming Grade 1, Grade 2, ...)
  const sortedGrades = [...grades].sort((a, b) => {
    const aNum = parseInt(a.name.replace(/\D/g, ""));
    const bNum = parseInt(b.name.replace(/\D/g, ""));
    return aNum - bNum;
  });

  for (const grade of sortedGrades) {
    // Find all classes/streams for this grade
    const gradeClasses = classes.filter((c) => c.gradeId === grade.id);
    for (const cls of gradeClasses) {
      // Detect next class name
      const nextGradeName = getNextGradeName(sortedGrades, grade.name);
      let toClass = "";
      let nextGradeId: string | null = null;
      if (nextGradeName === "ALUMNI") {
        toClass = "ALUMNI";
      } else if (nextGradeName) {
        nextGradeId = grades.find((g) => g.name === nextGradeName)?.id || null;
        // Try to find a class in the next grade with the same stream suffix (e.g., 1A -> 2A)
        const streamSuffix = cls.name.replace(grade.name, "").trim();
        const nextGradeClass = classes.find(
          (c) => c.gradeId === nextGradeId && c.name.endsWith(streamSuffix)
        );
        toClass = nextGradeClass
          ? nextGradeClass.name
          : `${nextGradeName} ${streamSuffix}`.trim();
      }
      // Check if toClass exists
      let status = "OK";
      let action = "Edit";
      if (toClass === "ALUMNI") {
        status = "ALUMNI missing";
        action = "Create";
      } else if (!classes.some((c) => c.name === toClass)) {
        status = `${toClass} missing`;
        action = "Create";
      }
      rows.push({
        fromClass: cls.name,
        toClass,
        status,
        action,
        nextGradeId,
        nextClassName: toClass,
      });
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow-lg max-w-3xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Class Progression Rules</h2>
        <button className="border px-4 py-2 rounded" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="flex justify-end mb-2">
        <button className="border px-4 py-2 rounded">Add Rule</button>
      </div>
      <table className="min-w-full border mb-2">
        <thead>
          <tr>
            <th className="border px-2 py-1">
              From <b>Class</b>
            </th>
            <th className="border px-2 py-1">
              To <b>Class</b>
            </th>
            <th className="border px-2 py-1">Status</th>
            <th className="border px-2 py-1">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.fromClass}>
              <td className="border px-2 py-1">{row.fromClass}</td>
              <td className="border px-2 py-1">{row.toClass}</td>
              <td className="border px-2 py-1">{row.status}</td>
              <td className="border px-2 py-1">
                {row.action === "Create" ? (
                  <button
                    className="underline text-blue-600 cursor-pointer"
                    onClick={() =>
                      setCreateDialog({
                        open: true,
                        gradeId: row.nextGradeId || "",
                        name: row.nextClassName,
                      })
                    }
                  >
                    Create
                  </button>
                ) : (
                  <button
                    className="underline text-gray-400 cursor-not-allowed"
                    disabled
                  >
                    Edit
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Create Class Dialog */}
      {createDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="font-bold mb-2">Create Class</h3>
            <ClassCreateForm
              schoolCode={schoolCode}
              grades={grades}
              teachers={teachers || []} // always pass an array
              initialGradeId={createDialog.gradeId}
              initialName={createDialog.name}
              onSuccess={() => {
                setCreateDialog({ open: false, gradeId: "", name: "" });
                if (onClassCreated) onClassCreated();
              }}
              onCancel={() =>
                setCreateDialog({ open: false, gradeId: "", name: "" })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
