'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type GradingRosterClass = {
  id: string;
  name: string;
  legacyClassId?: string | null;
  legacyClass?: { id: string; name: string } | null;
};

type RosterStudent = {
  id: string;
  admissionNumber: string;
  user: { name: string };
};

type GradingRosterPanelProps = {
  schoolCode: string;
  colorTheme?: string;
  classes: GradingRosterClass[];
  selectedClassId?: string;
  onSelectedClassChange?: (classId: string) => void;
  onRosterChange?: () => void;
  title?: string;
  description?: string;
};

export function GradingRosterPanel({
  schoolCode,
  colorTheme = '#2563eb',
  classes,
  selectedClassId: selectedClassIdProp,
  onSelectedClassChange,
  onRosterChange,
  title = 'Student roster',
  description = 'Add learners to the class roster before entering scores. Each grading class has a linked school roster.',
}: GradingRosterPanelProps) {
  const { toast } = useToast();
  const apiBase = `/api/grading/${encodeURIComponent(schoolCode)}`;

  const [internalClassId, setInternalClassId] = useState('');
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '',
    admissionNumber: '',
    parentName: 'Parent/Guardian',
    parentPhone: '',
  });

  const classId = selectedClassIdProp ?? internalClassId;
  const setClassId = onSelectedClassChange ?? setInternalClassId;

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === classId),
    [classes, classId]
  );

  const legacyClassId = selectedClass?.legacyClassId ?? selectedClass?.legacyClass?.id ?? '';

  const loadRoster = useCallback(async () => {
    if (!legacyClassId) {
      setStudents([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/roster?legacyClassId=${legacyClassId}`, {
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Failed to load roster');
      setStudents(payload.data?.students ?? []);
    } catch (error) {
      toast({
        title: 'Could not load roster',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [apiBase, legacyClassId, toast]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  const enrollStudent = async () => {
    if (!legacyClassId) {
      toast({
        title: 'Create a grading class first',
        description: 'A school roster class is created automatically when you add a grading class.',
        variant: 'destructive',
      });
      return;
    }
    setEnrolling(true);
    try {
      const res = await fetch(`${apiBase}/roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...newStudent, legacyClassId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Enroll failed');
      toast({ title: 'Student enrolled', description: `${newStudent.name} added to roster.` });
      setNewStudent({ name: '', admissionNumber: '', parentName: 'Parent/Guardian', parentPhone: '' });
      await loadRoster();
      onRosterChange?.();
    } catch (error) {
      toast({
        title: 'Could not enroll student',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (classes.length === 0) {
    return (
      <Card className="border-amber-200/80 bg-amber-50/40 shadow-sm">
        <CardContent className="py-6 text-sm text-amber-900">
          Add a grading class above first — a roster bucket is created automatically for grading-only schools.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs">
          <Label>Grading class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label>Full name</Label>
            <Input
              value={newStudent.name}
              onChange={(e) => setNewStudent((s) => ({ ...s, name: e.target.value }))}
            />
          </div>
          <div>
            <Label>Admission no.</Label>
            <Input
              value={newStudent.admissionNumber}
              onChange={(e) => setNewStudent((s) => ({ ...s, admissionNumber: e.target.value }))}
            />
          </div>
          <div>
            <Label>Parent name</Label>
            <Input
              value={newStudent.parentName}
              onChange={(e) => setNewStudent((s) => ({ ...s, parentName: e.target.value }))}
            />
          </div>
          <div>
            <Label>Parent phone</Label>
            <Input
              value={newStudent.parentPhone}
              onChange={(e) => setNewStudent((s) => ({ ...s, parentPhone: e.target.value }))}
            />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              onClick={enrollStudent}
              disabled={enrolling || !legacyClassId}
              style={{ backgroundColor: colorTheme }}
            >
              {enrolling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              Add student
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: colorTheme }} />
          </div>
        ) : !classId ? (
          <p className="text-center text-sm text-slate-500">Select a class to view its roster.</p>
        ) : students.length === 0 ? (
          <p className="rounded-md border border-dashed border-slate-200 py-6 text-center text-sm text-slate-500">
            No students yet — add learners above, then continue to score entry.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Admission no.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.user.name}</TableCell>
                    <TableCell>{student.admissionNumber}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
