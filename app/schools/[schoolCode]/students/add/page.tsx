"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AddStudentPage() {
  const router = useRouter();
  const params = useParams();
  const schoolCode = params.schoolCode as string;
  const [form, setForm] = useState({
    name: "",
    admissionNumber: "",
    email: "",
    gradeId: "",
    classId: "",
  });
  const [grades, setGrades] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchGrades() {
      setLoadingGrades(true);
      const res = await fetch(`/api/schools/${schoolCode}/grades`);
      if (res.ok) {
        setGrades(await res.json());
      }
      setLoadingGrades(false);
    }
    if (schoolCode) fetchGrades();
  }, [schoolCode]);

  useEffect(() => {
    async function fetchSections() {
      if (!form.gradeId) return;
      setLoadingSections(true);
      const res = await fetch(
        `/api/schools/${schoolCode}/classes?gradeId=${form.gradeId}`
      );
      if (res.ok) {
        setSections(await res.json());
      }
      setLoadingSections(false);
    }
    fetchSections();
  }, [form.gradeId, schoolCode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/schools/${schoolCode}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        admissionNumber: form.admissionNumber,
        email: form.email,
        classId: form.classId,
        phone: "",
      }),
    });
    if (res.ok) {
      router.push(`/schools/${schoolCode}/students`);
    } else {
      setError("Failed to add student.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Student</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />
            <Input
              name="admissionNumber"
              placeholder="Admission Number"
              value={form.admissionNumber}
              onChange={handleChange}
              required
            />
            <Input
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
            />
            <select
              name="gradeId"
              value={form.gradeId}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            >
              <option value="">Select Grade</option>
              {loadingGrades ? (
                <option>Loading...</option>
              ) : (
                grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.name}
                  </option>
                ))
              )}
            </select>
            <select
              name="classId"
              value={form.classId}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
              disabled={!form.gradeId || loadingSections}
            >
              <option value="">
                {form.gradeId
                  ? loadingSections
                    ? "Loading sections..."
                    : "Select Section/Stream"
                  : "Select Grade first"}
              </option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Adding..." : "Add Student"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
