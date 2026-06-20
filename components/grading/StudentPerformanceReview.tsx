'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Medal, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GradingRosterPanel } from '@/components/grading/GradingRosterPanel';

type GradingClass = {
  id: string;
  name: string;
  legacyClassId?: string | null;
};

type BoardRow = {
  studentId: string;
  name: string;
  admissionNumber: string;
  classPosition: number | null;
  totalPoints: number | null;
  meanPoints: number | null;
  meanBand: { code: string; colorHex?: string | null } | null;
  subjectScores: Array<{
    subjectId: string;
    subjectName: string;
    rawScore: number | null;
  }>;
};

type StudentPerformanceReviewProps = {
  schoolCode: string;
  colorTheme?: string;
  onWorkflowChange?: () => void;
};

export function StudentPerformanceReview({
  schoolCode,
  colorTheme = '#2563eb',
  onWorkflowChange,
}: StudentPerformanceReviewProps) {
  const { toast } = useToast();
  const apiBase = `/api/grading/${encodeURIComponent(schoolCode)}`;
  const schoolsApi = `/api/schools/${encodeURIComponent(schoolCode)}`;

  const [classes, setClasses] = useState<GradingClass[]>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string; academicYear?: { name: string } }>>([]);
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [legacyClassId, setLegacyClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === classId),
    [classes, classId]
  );

  useEffect(() => {
    fetch(`${apiBase}/structure`, { credentials: 'include' })
      .then((r) => r.json())
      .then((payload) => {
        setClasses(payload.data?.classes ?? []);
        setTerms(payload.data?.terms ?? []);
      });
  }, [apiBase]);

  const loadBoard = useCallback(async () => {
    if (!classId || !termId) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/performance-review?classId=${classId}&termId=${termId}`, {
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to load board');
      setRows(payload.data?.rows ?? []);
      setSubjects(payload.data?.subjects ?? []);
      setLegacyClassId(payload.data?.legacyClassId ?? '');
    } catch (error) {
      toast({
        title: 'Could not load performance board',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [apiBase, classId, termId, toast]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const syncRosterFromCore = useCallback(async () => {
    const legacyId = selectedClass?.legacyClassId;
    if (!legacyId) {
      toast({
        title: 'Link a legacy class first',
        description: 'Academic Setup must link this grading class to a school roster class.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${schoolsApi}/students?classId=${legacyId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Could not fetch students from school roster');
      await loadBoard();
      toast({ title: 'Roster synced', description: 'Loaded students from the core school module.' });
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [loadBoard, schoolsApi, selectedClass?.legacyClassId, toast]);

  const updateScore = (studentId: string, subjectId: string, value: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.studentId !== studentId) return row;
        return {
          ...row,
          subjectScores: row.subjectScores.map((subject) =>
            subject.subjectId === subjectId
              ? { ...subject, rawScore: value === '' ? null : Number(value) }
              : subject
          ),
        };
      })
    );
  };

  const saveAndRank = async () => {
    if (!classId || !termId) return;
    const entries = rows.flatMap((row) =>
      row.subjectScores.map((subject) => ({
        studentId: row.studentId,
        subjectId: subject.subjectId,
        rawScore: subject.rawScore,
      }))
    );
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/performance-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ classId, termId, entries }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Save failed');
      setRows(payload.data?.board?.rows ?? []);
      toast({
        title: 'Scores saved & ranked',
        description: 'Marks were graded and class positions updated automatically.',
      });
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

  const medalFor = (pos: number | null) => {
    if (pos === 1) return <Medal className="h-4 w-4 text-amber-500" />;
    if (pos === 2) return <Medal className="h-4 w-4 text-slate-400" />;
    if (pos === 3) return <Medal className="h-4 w-4 text-amber-700" />;
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100" style={{ borderLeftWidth: 4, borderLeftColor: colorTheme }}>
          <CardTitle>Student Performance Review</CardTitle>
          <CardDescription>
            Review per-subject marks across all subjects and auto-rank learners. Enroll students in Step 1 or Score Entry if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4 pt-6">
          <div className="min-w-[160px]">
            <Label>Grading class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                {classes.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <Label>Term</Label>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
              <SelectContent>
                {terms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.academicYear?.name ? `${term.academicYear.name} — ` : ''}{term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" variant="outline" onClick={syncRosterFromCore} disabled={!selectedClass?.legacyClassId || loading}>
            Sync roster from school module
          </Button>
          <Button type="button" onClick={saveAndRank} disabled={saving || !classId || !termId} style={{ backgroundColor: colorTheme }}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save, grade &amp; rank
          </Button>
        </CardContent>
      </Card>

      {rows.length === 0 && classId ? (
        <GradingRosterPanel
          schoolCode={schoolCode}
          colorTheme={colorTheme}
          classes={classes}
          selectedClassId={classId}
          onSelectedClassChange={setClassId}
          onRosterChange={() => {
            void loadBoard();
            onWorkflowChange?.();
          }}
        />
      ) : null}

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Per-subject marks &amp; live ranking</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: colorTheme }} />
            </div>
          ) : !classId || !termId ? (
            <p className="py-8 text-center text-slate-500">Select a grading class and term to begin.</p>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              No students found. Sync roster from the school module or enroll a new learner above.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white">Pos</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Adm</TableHead>
                    {subjects.map((subject) => (
                      <TableHead key={subject.id}>{subject.name}</TableHead>
                    ))}
                    <TableHead>Total</TableHead>
                    <TableHead>Mean</TableHead>
                    <TableHead>Band</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.studentId} className={row.classPosition != null && row.classPosition <= 3 ? 'bg-amber-50/40' : ''}>
                      <TableCell className="sticky left-0 bg-inherit font-semibold">
                        <span className="flex items-center gap-1">
                          {medalFor(row.classPosition)}
                          {row.classPosition ?? '—'}
                        </span>
                      </TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.admissionNumber}</TableCell>
                      {row.subjectScores.map((subject) => (
                        <TableCell key={subject.subjectId}>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="h-9 w-20"
                            value={subject.rawScore ?? ''}
                            onChange={(e) => updateScore(row.studentId, subject.subjectId, e.target.value)}
                          />
                        </TableCell>
                      ))}
                      <TableCell>{row.totalPoints ?? '—'}</TableCell>
                      <TableCell>{row.meanPoints ?? '—'}</TableCell>
                      <TableCell>
                        {row.meanBand ? (
                          <Badge style={{ backgroundColor: row.meanBand.colorHex ?? '#64748b' }}>{row.meanBand.code}</Badge>
                        ) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
