'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Medal, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type RankingRow = {
  studentId: string;
  name: string;
  admissionNumber: string;
  classPosition: number | null;
  totalPoints: number | null;
  meanPoints: number | null;
  meanBand: { code: string; colorHex?: string | null } | null;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    band: { code: string; colorHex?: string | null } | null;
  }>;
};

type ClassRankingDashboardProps = {
  schoolCode: string;
  colorTheme?: string;
  onWorkflowChange?: () => void;
};

export function ClassRankingDashboard({
  schoolCode,
  colorTheme = '#2563eb',
  onWorkflowChange,
}: ClassRankingDashboardProps) {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [terms, setTerms] = useState<Array<{ id: string; name: string; academicYear?: { name: string } }>>([]);
  const [classId, setClassId] = useState('');
  const [termId, setTermId] = useState('');
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string }>>([]);
  const [rankings, setRankings] = useState<RankingRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [computing, setComputing] = useState(false);

  const apiBase = `/api/grading/${encodeURIComponent(schoolCode)}`;

  useEffect(() => {
    fetch(`${apiBase}/structure`, { credentials: 'include' })
      .then((r) => r.json())
      .then((p) => {
        setClasses(p.data?.classes ?? []);
        setTerms(p.data?.terms ?? []);
      });
  }, [apiBase]);

  const loadRankings = async () => {
    if (!classId || !termId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${apiBase}/rankings/class/${classId}/term/${termId}?summary=1`,
        { credentials: 'include' }
      );
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error);
      setRankings(payload.data?.rankings ?? []);
      setSubjects(payload.data?.subjects ?? []);
      setSummary(payload.summary);
    } catch (error) {
      toast({
        title: 'Failed to load rankings',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId && termId) loadRankings();
  }, [classId, termId]);

  const computeResults = async () => {
    if (!classId || !termId) return;
    setComputing(true);
    try {
      const res = await fetch(`${apiBase}/compute/class/${classId}/term/${termId}`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error);
      toast({ title: 'Results computed' });
      await loadRankings();
      onWorkflowChange?.();
    } catch (error) {
      toast({
        title: 'Computation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setComputing(false);
    }
  };

  const downloadExport = (type: 'rankings' | 'marksheet') => {
    if (!classId || !termId) return;
    window.open(`${apiBase}/exports/${type}/${classId}/term/${termId}`, '_blank');
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
          <CardTitle>Class Rankings</CardTitle>
          <CardDescription>Position table with subject bands — export to Excel</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
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
          <Button
            onClick={computeResults}
            disabled={computing || !classId || !termId}
            style={{ backgroundColor: colorTheme }}
          >
            {computing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Compute
          </Button>
          <Button variant="outline" onClick={() => downloadExport('rankings')} disabled={!classId || !termId}>
            <Download className="mr-2 h-4 w-4" /> Rankings Excel
          </Button>
          <Button variant="outline" onClick={() => downloadExport('marksheet')} disabled={!classId || !termId}>
            <Download className="mr-2 h-4 w-4" /> Marksheet Excel
          </Button>
        </CardContent>
      </Card>

      {summary ? (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200/80 shadow-sm" style={{ borderTopWidth: 3, borderTopColor: colorTheme }}>
            <CardContent className="pt-6"><p className="text-sm text-slate-500">Class size</p><p className="text-2xl font-bold" style={{ color: colorTheme }}>{summary.classSize}</p></CardContent>
          </Card>
          <Card className="border-slate-200/80 shadow-sm" style={{ borderTopWidth: 3, borderTopColor: colorTheme }}>
            <CardContent className="pt-6"><p className="text-sm text-slate-500">Class mean (points)</p><p className="text-2xl font-bold" style={{ color: colorTheme }}>{summary.classMean}</p></CardContent>
          </Card>
          <Card className="border-slate-200/80 shadow-sm" style={{ borderTopWidth: 3, borderTopColor: colorTheme }}>
            <CardContent className="pt-6"><p className="text-sm text-slate-500">Band distribution</p><p className="text-sm font-medium">{Object.entries(summary.bandDistribution ?? {}).map(([k,v]) => `${k}: ${v}`).join(' · ')}</p></CardContent>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" style={{ color: colorTheme }} /></div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white">Pos</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Adm</TableHead>
                    {subjects.map((s) => (
                      <TableHead key={s.id}>{s.name}</TableHead>
                    ))}
                    <TableHead>Total</TableHead>
                    <TableHead>Mean</TableHead>
                    <TableHead>Band</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rankings.length === 0 ? (
                    <TableRow><TableCell colSpan={7 + subjects.length} className="py-8 text-center text-slate-500">No results — compute after entering scores</TableCell></TableRow>
                  ) : (
                    rankings.map((row) => (
                      <TableRow key={row.studentId} className={row.classPosition != null && row.classPosition <= 3 ? 'bg-amber-50/50' : ''}>
                        <TableCell className="sticky left-0 bg-inherit font-semibold">
                          <span className="flex items-center gap-1">
                            {medalFor(row.classPosition)}
                            {row.classPosition ?? '—'}
                          </span>
                        </TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.admissionNumber}</TableCell>
                        {subjects.map((subject) => {
                          const sr = row.subjects.find((s) => s.subjectId === subject.id);
                          return (
                            <TableCell key={subject.id}>
                              {sr?.band ? (
                                <Badge style={{ backgroundColor: sr.band.colorHex ?? '#64748b' }}>{sr.band.code}</Badge>
                              ) : '—'}
                            </TableCell>
                          );
                        })}
                        <TableCell>{row.totalPoints ?? '—'}</TableCell>
                        <TableCell>{row.meanPoints ?? '—'}</TableCell>
                        <TableCell>
                          {row.meanBand ? (
                            <Badge style={{ backgroundColor: row.meanBand.colorHex ?? '#64748b' }}>{row.meanBand.code}</Badge>
                          ) : '—'}
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
    </div>
  );
}
