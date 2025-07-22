import React, { useState } from "react";

interface Grade {
  id: string;
  name: string;
}
interface Teacher {
  id: string;
  name: string;
}
interface ClassCreateFormProps {
  schoolCode: string;
  grades: Grade[];
  teachers: Teacher[];
  initialGradeId?: string;
  initialName?: string;
  onSuccess: (newClass: any) => void;
  onCancel: () => void;
}

export default function ClassCreateForm({
  schoolCode,
  grades,
  teachers,
  initialGradeId = "",
  initialName = "",
  onSuccess,
  onCancel,
}: ClassCreateFormProps) {
  const [name, setName] = useState(initialName);
  const [gradeId, setGradeId] = useState(initialGradeId);
  const [level, setLevel] = useState("Primary");
  const [capacity, setCapacity] = useState(30);
  const [classTeacherId, setClassTeacherId] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const res = await fetch(`/api/schools/${schoolCode}/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          gradeId,
          level,
          capacity,
          teacherId: classTeacherId || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create class");
      const newClass = await res.json();
      onSuccess(newClass);
    } catch (e: any) {
      setError(e.message || "Error creating class");
    } finally {
      setCreating(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-2">
      <div>
        <label className="block mb-1 font-medium">Class Name *</label>
        <input
          className="border px-2 py-1 w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Grade 3A"
          required
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Grade *</label>
        <select
          className="border px-2 py-1 w-full"
          value={gradeId}
          onChange={(e) => setGradeId(e.target.value)}
          required
        >
          <option value="">Select a grade</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Level *</label>
        <select
          className="border px-2 py-1 w-full"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="Primary">Primary</option>
          <option value="Secondary">Secondary</option>
          <option value="College">College</option>
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Capacity</label>
        <input
          type="number"
          className="border px-2 py-1 w-full"
          value={capacity}
          onChange={(e) => setCapacity(Number(e.target.value) || 0)}
          placeholder="30"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">Class Teacher</label>
        <select
          className="border px-2 py-1 w-full"
          value={classTeacherId}
          onChange={(e) => setClassTeacherId(e.target.value)}
        >
          <option value="">Select class teacher</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          className="px-3 py-1 rounded border"
          onClick={onCancel}
          disabled={creating}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-3 py-1 rounded"
          disabled={creating || !name.trim() || !gradeId}
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
