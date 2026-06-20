'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ReportPreview = {
  school: { name: string } | null;
  student: { name: string; admissionNumber: string; className: string };
  term: { name: string; academicYear: string };
  subjectResults: Array<{
    subjectName: string;
    weightedScore: number | null;
    points: number | null;
    band: { code: string; label: string; colorHex?: string | null } | null;
  }>;
  overall: {
    meanPoints: number | null;
    totalPoints: number | null;
    classPosition: number | null;
    classSize: number | null;
    meanBand: { code: string; label: string } | null;
  } | null;
};

type ReportCardViewerProps = {
  schoolCode: string;
  colorTheme?: string;
  onWorkflowChange?: () => void;
};

export function ReportCardViewer({
  schoolCode,
  colorTheme = '#2563eb',
  onWorkflowChange,
}: ReportCardViewerProps) {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Array<{ id: string; name: string; legacyClassId?: string | null }>>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string; academicYear?: { name: string } }>>([]);
  const [students, setStudents] = useState<Array<{ id: string; name: string; admissionNumber: string }>>([]);
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const apiBase = `/api/grading/${encodeURIComponent(schoolCode)}`;

  useEffect(() => {
    fetch(`${apiBase}/structure`, { credentials: 'include' })
      .then((r) => r.json())
      .then((p) => {
        setClasses(p.data?.classes ?? []);
        setTerms(p.data?.terms ?? []);
      });
  }, [apiBase]);

  useEffect(() => {
    if (!classId) {
      setStudents([]);
      return;
    }
    const gradingClass = classes.find((c) => c.id === classId);
    const legacyId = gradingClass?.legacyClassId ?? classId;
    fetch(`/api/schools/${encodeURIComponent(schoolCode)}/students?classId=${legacyId}`, {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((list) => {
        const rows = Array.isArray(list) ? list : list.students ?? list.data ?? [];
        setStudents(
          rows.map((s: any) => ({
            id: s.id,
            name: s.name ?? s.user?.name ?? 'Student',
            admissionNumber: s.admissionNumber ?? '',
          }))
        );
      })
      .catch(() => setStudents([]));
  }, [classId, classes, schoolCode]);

  const loadPreview = async () => {
    if (!studentId || !termId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/reports/preview?studentId=${studentId}&termId=${termId}`,
        { credentials: 'include' }
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error);
      setPreview(payload.data);
    } catch (error) {
      toast({
        title: 'Preview failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId && termId) loadPreview();
  }, [studentId, termId]);

  const generateBatch = async () => {
    if (!classId || !termId) return;
    setGenerating(true);
    try {
      const res = await fetch(`${apiBase}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ classId, termId, computeFirst: true }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error);
      toast({ title: 'Reports generated', description: `${payload.count} report cards created.` });
      onWorkflowChange?.();
      if (studentId) await loadPreview();
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadPdf = () => {
    if (!studentId || !termId) return;
    fetch(`${apiBase}/reports/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ studentId, termId, download: true }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Download failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${studentId}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => toast({ title: 'PDF download failed', variant: 'destructive' }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100" style={{ borderLeftWidth: 4, borderLeftColor: colorTheme }}>
          <CardTitle>Report Cards</CardTitle>
          <CardDescription>Preview and download CBC-style report cards as PDF</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <Label>Class</Label>
            <Select value={classId} onValueChange={(v) => { setClassId(v); setStudentId(''); }}>
              <SelectTrigger><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <Label>Term</Label>
            <Select value={termId} onValueChange={setTermId}>
              <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
              <SelectContent>
                {terms.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.academicYear?.name ? `${t.academicYear.name} — ` : ''}{t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-[200px]">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Student" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.admissionNumber})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={generateBatch} disabled={generating || !classId || !termId}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
            Generate class batch
          </Button>
          <Button
            onClick={downloadPdf}
            disabled={!studentId || !termId}
            style={{ backgroundColor: colorTheme }}
          >
            <Download className="mr-2 h-4 w-4" /> Download PDF
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Report preview</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" style={{ color: colorTheme }} /></div>
          ) : !preview ? (
            <p className="py-8 text-center text-slate-500">Select a student to preview their report card</p>
          ) : (
            <div className="mx-auto max-w-2xl rounded-lg border bg-white p-8 shadow-sm print:shadow-none" style={{ borderTopWidth: 4, borderTopColor: colorTheme }}>
              <div className="text-center">
                <h2 className="text-xl font-bold" style={{ color: colorTheme }}>{preview.school?.name ?? 'School'}</h2>
                <p className="mt-1 text-sm uppercase tracking-wide text-slate-500">Academic Report Card</p>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
                <p><span className="text-slate-500">Student:</span> {preview.student.name}</p>
                <p><span className="text-slate-500">Adm No:</span> {preview.student.admissionNumber}</p>
                <p><span className="text-slate-500">Class:</span> {preview.student.className}</p>
                <p><span className="text-slate-500">Term:</span> {preview.term.academicYear} — {preview.term.name}</p>
              </div>
              <Table className="mt-6">
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Band</TableHead>
                    <TableHead>Points</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.subjectResults.map((sr) => (
                    <TableRow key={sr.subjectName}>
                      <TableCell>{sr.subjectName}</TableCell>
                      <TableCell>{sr.weightedScore != null ? `${sr.weightedScore}%` : '—'}</TableCell>
                      <TableCell>
                        {sr.band ? (
                          <Badge style={{ backgroundColor: sr.band.colorHex ?? '#64748b' }}>{sr.band.code}</Badge>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{sr.points ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {preview.overall ? (
                <div className="mt-6 rounded-md p-4 text-sm" style={{ backgroundColor: `${colorTheme}12` }}>
                  <p>
                    <strong>Overall band:</strong>{' '}
                    {preview.overall.meanBand ? (
                      <Badge>{preview.overall.meanBand.code}</Badge>
                    ) : '—'}
                  </p>
                  <p className="mt-1"><strong>Total points:</strong> {preview.overall.totalPoints ?? '—'}</p>
                  <p className="mt-1"><strong>Mean points:</strong> {preview.overall.meanPoints ?? '—'}</p>
                  {preview.overall.classPosition != null && preview.overall.classSize != null ? (
                    <p className="mt-1">
                      <strong>Class position:</strong> {preview.overall.classPosition} out of {preview.overall.classSize}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
