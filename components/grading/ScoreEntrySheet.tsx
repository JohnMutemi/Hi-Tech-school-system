'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GradingRosterPanel } from '@/components/grading/GradingRosterPanel';

type StructureData = {
  classes: Array<{
    id: string;
    name: string;
    legacyClassId?: string | null;
    legacyClass?: { id: string; name: string } | null;
  }>;
  subjects: Array<{ id: string; name: string; code: string }>;
  terms: Array<{ id: string; name: string; academicYear?: { name: string } }>;
  assessmentTypes: Array<{ id: string; name: string; weight: number }>;
};

type BandDef = {
  id: string;
  code: string;
  label: string;
  colorHex?: string | null;
  minScore: number;
  maxScore: number;
};

type ScoreRow = {
  studentId: string;
  name: string;
  admissionNumber: string;
  rawScore: number | null;
  percentage: number | null;
  band: { code: string; label: string; colorHex?: string | null } | null;
  remarks: string;
};

function scoreToBand(percentage: number, bands: BandDef[]): BandDef | null {
  if (!bands.length) return null;
  const sorted = [...bands].sort((a, b) => b.minScore - a.minScore);
  return (
    sorted.find((band) => percentage >= band.minScore && percentage <= band.maxScore) ??
    sorted[sorted.length - 1]
  );
}

type ScoreEntrySheetProps = {
  schoolCode: string;
  colorTheme?: string;
  onWorkflowChange?: () => void;
};

export function ScoreEntrySheet({
  schoolCode,
  colorTheme = '#2563eb',
  onWorkflowChange,
}: ScoreEntrySheetProps) {
  const { toast } = useToast();
  const [structure, setStructure] = useState<StructureData | null>(null);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [termId, setTermId] = useState('');
  const [assessmentTypeId, setAssessmentTypeId] = useState('');
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
  const [rows, setRows] = useState<ScoreRow[]>([]);
  const [bands, setBands] = useState<BandDef[]>([]);
  const [maxScore, setMaxScore] = useState('100');
  const [newAssessmentName, setNewAssessmentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const apiBase = `/api/grading/${encodeURIComponent(schoolCode)}`;

  useEffect(() => {
    (async () => {
      const res = await fetch(`${apiBase}/structure`, { credentials: 'include' });
      if (res.ok) {
        const payload = await res.json();
        setStructure(payload.data);
      }
    })();
  }, [apiBase]);

  useEffect(() => {
    if (!classId || !subjectId || !termId) {
      setAssessments([]);
      return;
    }
    const url = new URL(`${apiBase}/assessments`, window.location.origin);
    url.searchParams.set('classId', classId);
    url.searchParams.set('subjectId', subjectId);
    url.searchParams.set('termId', termId);
    fetch(url.toString(), { credentials: 'include' })
      .then((r) => r.json())
      .then((p) => setAssessments(p.data ?? []));
  }, [apiBase, classId, subjectId, termId]);

  useEffect(() => {
    if (!selectedAssessmentId) {
      setRows([]);
      setBands([]);
      return;
    }
    setLoading(true);
    fetch(`${apiBase}/assessments/${selectedAssessmentId}/scores`, { credentials: 'include' })
      .then((r) => r.json())
      .then((p) => {
        setRows(p.data?.students ?? []);
        setBands(p.data?.bands ?? []);
        if (p.data?.assessment?.maxScore) {
          setMaxScore(String(p.data.assessment.maxScore));
        }
      })
      .finally(() => setLoading(false));
  }, [apiBase, selectedAssessmentId]);

  const selectedAssessment = useMemo(
    () => assessments.find((a) => a.id === selectedAssessmentId),
    [assessments, selectedAssessmentId]
  );

  const updateRow = (studentId: string, field: 'rawScore' | 'remarks', value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        if (field === 'remarks') return { ...row, remarks: value };
        const raw = value === '' ? null : Number(value);
        const max = Number(maxScore) || 100;
        const percentage = raw != null && max > 0 ? Math.round((raw / max) * 10000) / 100 : null;
        const bandMatch = percentage != null ? scoreToBand(percentage, bands) : null;
        const band = bandMatch
          ? { code: bandMatch.code, label: bandMatch.label, colorHex: bandMatch.colorHex }
          : null;
        return { ...row, rawScore: raw, percentage, band };
      })
    );
  };

  const createAssessment = async () => {
    if (!classId || !subjectId || !termId || !assessmentTypeId || !newAssessmentName.trim()) {
      toast({ title: 'Missing fields', description: 'Fill class, subject, term, type, and name.', variant: 'destructive' });
      return;
    }
    const res = await fetch(`${apiBase}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        classId,
        subjectId,
        termId,
        assessmentTypeId,
        name: newAssessmentName.trim(),
        maxScore: Number(maxScore) || 100,
      }),
    });
    const payload = await res.json();
    if (!res.ok) {
      toast({ title: 'Error', description: payload.error, variant: 'destructive' });
      return;
    }
    setAssessments((prev) => [payload.data, ...prev]);
    setSelectedAssessmentId(payload.data.id);
    setNewAssessmentName('');
    toast({ title: 'Assessment created' });
  };

  const importCsv = async (file: File) => {
    if (!selectedAssessmentId) return;
    setImporting(true);
    try {
      const csv = await file.text();
      const res = await fetch(`${apiBase}/assessments/${selectedAssessmentId}/scores/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csv }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Import failed');
      setRows(payload.data?.students ?? rows);
      setBands(payload.data?.bands ?? bands);
      const unmatched = Array.isArray(payload.unmatched) ? payload.unmatched.length : 0;
      toast({
        title: 'CSV imported',
        description: `${payload.imported ?? 0} scores imported${unmatched ? ` (${unmatched} unmatched)` : ''}.`,
      });
      onWorkflowChange?.();
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const saveScores = async () => {
    if (!selectedAssessmentId) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/assessments/${selectedAssessmentId}/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          scores: rows.map((r) => ({
            studentId: r.studentId,
            rawScore: r.rawScore,
            remarks: r.remarks,
          })),
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Save failed');
      setRows(payload.data?.students ?? rows);
      toast({ title: 'Scores saved', description: `${payload.count ?? rows.length} entries updated.` });
      onWorkflowChange?.();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100" style={{ borderLeftWidth: 4, borderLeftColor: colorTheme }}>
          <CardTitle>Score Entry</CardTitle>
          <CardDescription>Spreadsheet-style mark entry with live band preview</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {(structure?.classes ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {(structure?.subjects ?? []).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Term</Label>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger><SelectValue placeholder="Select term" /></SelectTrigger>
              <SelectContent>
                {(structure?.terms ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.academicYear?.name ? `${t.academicYear.name} — ` : ''}{t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Assessment</Label>
            <Select value={selectedAssessmentId} onValueChange={setSelectedAssessmentId}>
              <SelectTrigger><SelectValue placeholder="Select assessment" /></SelectTrigger>
              <SelectContent>
                {assessments.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New assessment</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <Label>Name</Label>
            <Input value={newAssessmentName} onChange={(e) => setNewAssessmentName(e.target.value)} placeholder="End of Term Exam" />
          </div>
          <div className="w-28">
            <Label>Max score</Label>
            <Input value={maxScore} onChange={(e) => setMaxScore(e.target.value)} />
          </div>
          <div className="min-w-[160px]">
            <Label>Type</Label>
            <Select value={assessmentTypeId} onValueChange={setAssessmentTypeId}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {(structure?.assessmentTypes ?? []).map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={createAssessment} style={{ backgroundColor: colorTheme }}>
            Create
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {selectedAssessment ? selectedAssessment.name : 'Score sheet'}
            </CardTitle>
            <CardDescription>
              {selectedAssessment ? `Max: ${selectedAssessment.maxScore ?? maxScore}` : 'Select an assessment'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              disabled={!selectedAssessmentId || importing}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importCsv(file);
                e.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={!selectedAssessmentId || importing}
              onClick={() => csvInputRef.current?.click()}
            >
              {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Import CSV
            </Button>
            <Button
              onClick={saveScores}
              disabled={!selectedAssessmentId || saving}
              style={{ backgroundColor: colorTheme }}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save scores
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" style={{ color: colorTheme }} /></div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Adm No</TableHead>
                    <TableHead className="w-28">Score</TableHead>
                    <TableHead className="w-24">%</TableHead>
                    <TableHead className="w-24">Band</TableHead>
                    <TableHead>Remarks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-slate-500">
                        {selectedAssessmentId
                          ? 'No students in this class roster — add learners below, then enter scores and save.'
                          : 'Select an assessment to load the score sheet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row.studentId}>
                        <TableCell className="font-medium">{row.name}</TableCell>
                        <TableCell>{row.admissionNumber}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={Number(maxScore)}
                            value={row.rawScore ?? ''}
                            onChange={(e) => updateRow(row.studentId, 'rawScore', e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>{row.percentage != null ? `${row.percentage}%` : '—'}</TableCell>
                        <TableCell>
                          {row.band ? (
                            <Badge style={{ backgroundColor: row.band.colorHex ?? '#64748b' }}>{row.band.code}</Badge>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.remarks}
                            onChange={(e) => updateRow(row.studentId, 'remarks', e.target.value)}
                            className="h-9"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedAssessmentId && rows.length === 0 ? (
        <GradingRosterPanel
          schoolCode={schoolCode}
          colorTheme={colorTheme}
          classes={structure?.classes ?? []}
          selectedClassId={classId}
          onSelectedClassChange={setClassId}
          onRosterChange={() => {
            if (selectedAssessmentId) {
              fetch(`${apiBase}/assessments/${selectedAssessmentId}/scores`, { credentials: 'include' })
                .then((r) => r.json())
                .then((p) => {
                  setRows(p.data?.students ?? []);
                  setBands(p.data?.bands ?? []);
                });
            }
            onWorkflowChange?.();
          }}
          title="Add students to this class"
          description="Score entry needs learners on the roster. Enroll them here, then return to the score sheet above."
        />
      ) : null}
    </div>
  );
}
