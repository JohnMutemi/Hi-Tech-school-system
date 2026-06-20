'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GradingRosterPanel } from '@/components/grading/GradingRosterPanel';

type AcademicStructureSetupProps = {
  schoolCode: string;
  colorTheme?: string;
  onWorkflowChange?: () => void;
};

export function AcademicStructureSetup({
  schoolCode,
  colorTheme = '#2563eb',
  onWorkflowChange,
}: AcademicStructureSetupProps) {
  const { toast } = useToast();
  const apiBase = `/api/grading/${encodeURIComponent(schoolCode)}`;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);

  const [yearName, setYearName] = useState('');
  const [termName, setTermName] = useState('');
  const [termYearId, setTermYearId] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [className, setClassName] = useState('');
  const [classGrade, setClassGrade] = useState('');
  const [classYearId, setClassYearId] = useState('');
  const [classScaleId, setClassScaleId] = useState('');
  const [classLegacyId, setClassLegacyId] = useState('');
  const [typeName, setTypeName] = useState('');
  const [typeWeight, setTypeWeight] = useState('30');

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/structure`, { credentials: 'include' });
      const payload = await res.json();
      if (res.ok) setData(payload.data);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    reload();
  }, [reload]);

  const createEntity = async (entity: string, body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entity, ...body }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Create failed');
      toast({ title: 'Created', description: `${entity} added successfully.` });
      await reload();
      onWorkflowChange?.();
      return true;
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not save',
        variant: 'destructive',
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colorTheme }} />
      </div>
    );
  }

  const academicYears = data?.academicYears ?? [];

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100" style={{ borderLeftWidth: 4, borderLeftColor: colorTheme }}>
          <CardTitle>Academic Structure</CardTitle>
          <CardDescription>
            Set up academic years, terms, subjects, classes, and assessment types before entering scores.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Academic year</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="min-w-[200px] flex-1">
              <Label>Name</Label>
              <Input value={yearName} onChange={(e) => setYearName(e.target.value)} placeholder="2026" />
            </div>
            <Button
              disabled={saving || !yearName.trim()}
              style={{ backgroundColor: colorTheme }}
              onClick={async () => {
                const ok = await createEntity('academicYear', { name: yearName, isActive: true });
                if (ok) setYearName('');
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add year
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Term</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Academic year</Label>
              <Select value={termYearId} onValueChange={setTermYearId}>
                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {(academicYears as any[]).map((y) => (
                    <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Input value={termName} onChange={(e) => setTermName(e.target.value)} placeholder="Term 1" />
              <Button
                disabled={saving || !termName.trim() || !termYearId}
                style={{ backgroundColor: colorTheme }}
                onClick={async () => {
                  const ok = await createEntity('term', { academicYearId: termYearId, name: termName });
                  if (ok) setTermName('');
                }}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <Label>Name</Label>
              <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Mathematics" />
            </div>
            <div className="w-28">
              <Label>Code</Label>
              <Input value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="MATH" />
            </div>
            <Button
              disabled={saving || !subjectName.trim() || !subjectCode.trim()}
              style={{ backgroundColor: colorTheme }}
              onClick={async () => {
                const ok = await createEntity('subject', { name: subjectName, code: subjectCode });
                if (ok) { setSubjectName(''); setSubjectCode(''); }
              }}
            >
              Add
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Assessment type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <Label>Name</Label>
              <Input value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="End of Term" />
            </div>
            <div className="w-24">
              <Label>Weight %</Label>
              <Input type="number" value={typeWeight} onChange={(e) => setTypeWeight(e.target.value)} />
            </div>
            <Button
              disabled={saving || !typeName.trim()}
              style={{ backgroundColor: colorTheme }}
              onClick={async () => {
                const ok = await createEntity('assessmentType', { name: typeName, weight: Number(typeWeight) });
                if (ok) setTypeName('');
              }}
            >
              Add
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grading class</CardTitle>
          <CardDescription>
            A school roster class is created automatically when you skip the legacy link — ideal for grading-only schools.
            Link an existing class instead if students are already onboarded in the full school portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Class name</Label>
            <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Grade 6 East" />
          </div>
          <div>
            <Label>Grade level</Label>
            <Input value={classGrade} onChange={(e) => setClassGrade(e.target.value)} placeholder="Grade 6" />
          </div>
          <div>
            <Label>Academic year</Label>
            <Select value={classYearId} onValueChange={setClassYearId}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent>
                {(academicYears as any[]).map((y) => (
                  <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Grading scale</Label>
            <Select value={classScaleId} onValueChange={setClassScaleId}>
              <SelectTrigger><SelectValue placeholder="Select scale" /></SelectTrigger>
              <SelectContent>
                {(data?.scales ?? []).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Legacy roster class (optional)</Label>
            <Select value={classLegacyId} onValueChange={setClassLegacyId}>
              <SelectTrigger><SelectValue placeholder="Auto-create roster" /></SelectTrigger>
              <SelectContent>
                {(data?.legacyClasses ?? []).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={saving || !className.trim() || !classGrade.trim()}
              style={{ backgroundColor: colorTheme }}
              onClick={async () => {
                const ok = await createEntity('class', {
                  name: className,
                  gradeLevel: classGrade,
                  academicYearId: classYearId || null,
                  gradingScaleId: classScaleId || null,
                  legacyClassId: classLegacyId || null,
                });
                if (ok) {
                  setClassName('');
                  setClassGrade('');
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add class
            </Button>
          </div>
        </CardContent>
      </Card>

      <GradingRosterPanel
        schoolCode={schoolCode}
        colorTheme={colorTheme}
        classes={data?.classes ?? []}
        onRosterChange={onWorkflowChange}
        title="Enroll students"
        description="Add learners here before score entry — especially for grading-only schools without a full admissions module."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current structure</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Classes</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Terms</TableHead>
                <TableHead>Assessment types</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="align-top">{(data?.classes ?? []).map((c: any) => c.name).join(', ') || '—'}</TableCell>
                <TableCell className="align-top">{(data?.subjects ?? []).map((s: any) => s.name).join(', ') || '—'}</TableCell>
                <TableCell className="align-top">
                  {(data?.terms ?? []).map((t: any) => `${t.academicYear?.name ?? ''} ${t.name}`).join(', ') || '—'}
                </TableCell>
                <TableCell className="align-top">{(data?.assessmentTypes ?? []).map((t: any) => t.name).join(', ') || '—'}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
