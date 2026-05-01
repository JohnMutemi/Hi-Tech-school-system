"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TeacherGradingTabProps = {
  schoolCode: string;
  teacher: any;
  assignedClasses: any[];
};

export default function TeacherGradingTab({
  schoolCode,
  teacher,
  assignedClasses,
}: TeacherGradingTabProps) {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [term, setTerm] = useState("Term 1");
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()));
  const [selectedAssessmentId, setSelectedAssessmentId] = useState("");
  const [scoreRows, setScoreRows] = useState<any[]>([]);
  const [newAssessmentTitle, setNewAssessmentTitle] = useState("");
  const [newAssessmentTotal, setNewAssessmentTotal] = useState("100");
  const [newAssessmentWeight, setNewAssessmentWeight] = useState("1");
  const [loadingScores, setLoadingScores] = useState(false);
  const [feedback, setFeedback] = useState("");

  const selectedAssessment = useMemo(
    () => assessments.find((item) => item.id === selectedAssessmentId),
    [assessments, selectedAssessmentId]
  );

  useEffect(() => {
    (async () => {
      const response = await fetch(`/api/schools/${encodeURIComponent(schoolCode)}/subjects`);
      if (response.ok) {
        const data = await response.json();
        setSubjects(
          (Array.isArray(data) ? data : []).filter(
            (subject: any) => !subject.teacherId || subject.teacherId === teacher?.id
          )
        );
      }
    })();
  }, [schoolCode, teacher?.id]);

  useEffect(() => {
    if (!selectedClassId || !selectedSubjectId) {
      setAssessments([]);
      return;
    }
    (async () => {
      const url = new URL(
        `/api/schools/${encodeURIComponent(schoolCode)}/teacher/grading/assessments`,
        window.location.origin
      );
      url.searchParams.set("classId", selectedClassId);
      url.searchParams.set("subjectId", selectedSubjectId);
      url.searchParams.set("term", term);
      url.searchParams.set("academicYear", academicYear);
      const response = await fetch(url.toString(), { credentials: "include" });
      if (response.ok) {
        const payload = await response.json();
        setAssessments(payload.data || []);
      }
    })();
  }, [schoolCode, selectedClassId, selectedSubjectId, term, academicYear]);

  useEffect(() => {
    if (!selectedAssessmentId) {
      setScoreRows([]);
      return;
    }
    (async () => {
      setLoadingScores(true);
      const response = await fetch(
        `/api/schools/${encodeURIComponent(
          schoolCode
        )}/teacher/grading/assessments/${selectedAssessmentId}/scores`,
        { credentials: "include" }
      );
      if (response.ok) {
        const payload = await response.json();
        setScoreRows(payload.data?.students || []);
      }
      setLoadingScores(false);
    })();
  }, [schoolCode, selectedAssessmentId]);

  const createAssessment = async () => {
    setFeedback("");
    if (!selectedClassId || !selectedSubjectId || !newAssessmentTitle.trim()) {
      setFeedback("Please select class/subject and enter assessment title.");
      return;
    }
    const response = await fetch(
      `/api/schools/${encodeURIComponent(schoolCode)}/teacher/grading/assessments`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: newAssessmentTitle.trim(),
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          term,
          academicYear,
          totalMarks: Number(newAssessmentTotal || 100),
          weight: Number(newAssessmentWeight || 1),
        }),
      }
    );
    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || "Failed to create assessment");
      return;
    }
    setNewAssessmentTitle("");
    setAssessments((prev) => [payload.data, ...prev]);
    setSelectedAssessmentId(payload.data.id);
    setFeedback("Assessment created.");
  };

  const saveScores = async () => {
    if (!selectedAssessmentId) return;
    setFeedback("");
    const response = await fetch(
      `/api/schools/${encodeURIComponent(
        schoolCode
      )}/teacher/grading/assessments/${selectedAssessmentId}/scores`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          entries: scoreRows.map((row) => ({
            studentId: row.id,
            rawScore: Number(row.rawScore || 0),
            remarks: row.remarks || "",
          })),
        }),
      }
    );
    const payload = await response.json();
    setFeedback(response.ok ? "Scores saved successfully." : payload.error || "Failed to save scores");
  };

  const runAutoGrade = async () => {
    setFeedback("");
    if (!selectedClassId || !selectedSubjectId) {
      setFeedback("Select class and subject before auto-grade.");
      return;
    }
    const response = await fetch(
      `/api/schools/${encodeURIComponent(schoolCode)}/teacher/grading/auto-grade`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          classId: selectedClassId,
          subjectId: selectedSubjectId,
          term,
          academicYear,
        }),
      }
    );
    const payload = await response.json();
    if (!response.ok) {
      setFeedback(payload.error || "Auto-grade failed");
      return;
    }
    setFeedback(`Auto-grade completed for ${payload.computedCount} students.`);
  };

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grading Workspace</CardTitle>
          <CardDescription>
            Create assessments, enter scores, and auto-grade with admin-defined criteria.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div>
            <Label>Class</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {assignedClasses.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject</Label>
            <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Term</Label>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Academic Year</Label>
            <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create Assessment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Input
            placeholder="Assessment title"
            value={newAssessmentTitle}
            onChange={(e) => setNewAssessmentTitle(e.target.value)}
          />
          <Input
            placeholder="Total marks"
            value={newAssessmentTotal}
            onChange={(e) => setNewAssessmentTotal(e.target.value)}
          />
          <Input
            placeholder="Weight"
            value={newAssessmentWeight}
            onChange={(e) => setNewAssessmentWeight(e.target.value)}
          />
          <Button onClick={createAssessment}>Create</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assessment Gradebook</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose assessment" />
            </SelectTrigger>
            <SelectContent>
              {assessments.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedAssessment ? (
            <p className="text-sm text-slate-600">
              Total Marks: {selectedAssessment.totalMarks} | Weight: {selectedAssessment.weight}
            </p>
          ) : null}

          {loadingScores ? <p>Loading scores...</p> : null}

          {scoreRows.length > 0 ? (
            <div className="space-y-2">
              {scoreRows.map((row) => (
                <div key={row.id} className="grid gap-2 md:grid-cols-4 items-center">
                  <div className="text-sm font-medium">{row.name}</div>
                  <div className="text-xs text-slate-500">{row.admissionNumber}</div>
                  <Input
                    type="number"
                    value={row.rawScore ?? ""}
                    onChange={(e) =>
                      setScoreRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id ? { ...item, rawScore: e.target.value } : item
                        )
                      )
                    }
                  />
                  <Input
                    placeholder="Remarks (optional)"
                    value={row.remarks ?? ""}
                    onChange={(e) =>
                      setScoreRows((prev) =>
                        prev.map((item) =>
                          item.id === row.id ? { ...item, remarks: e.target.value } : item
                        )
                      )
                    }
                  />
                </div>
              ))}
              <div className="flex flex-wrap gap-3 pt-3">
                <Button onClick={saveScores}>Save Scores</Button>
                <Button variant="outline" onClick={runAutoGrade}>
                  Auto Grade
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Choose an assessment to enter scores.
            </p>
          )}

          {feedback ? <p className="text-sm font-medium text-slate-700">{feedback}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
