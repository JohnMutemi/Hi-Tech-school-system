'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Loader2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type Scale = {
  id: string;
  name: string;
  curriculum: string;
  level: string;
  isDefault: boolean;
  bands: Array<{ code: string; label: string; minScore: number; maxScore: number; colorHex?: string | null }>;
};

type PresetScale = Scale & { presetKey?: string | null; isVirtual?: boolean };

type GradingScaleManagerProps = {
  schoolCode: string;
  colorTheme?: string;
  onWorkflowChange?: () => void;
};

export function GradingScaleManager({
  schoolCode,
  colorTheme = '#2563eb',
  onWorkflowChange,
}: GradingScaleManagerProps) {
  const { toast } = useToast();
  const apiBase = `/api/grading/${encodeURIComponent(schoolCode)}`;
  const [scales, setScales] = useState<Scale[]>([]);
  const [presets, setPresets] = useState<PresetScale[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [scalesRes, presetsRes] = await Promise.all([
        fetch(`${apiBase}/grading-scales`, { credentials: 'include' }),
        fetch(`${apiBase}/grading-scales/presets`, { credentials: 'include' }),
      ]);
      const scalesPayload = await scalesRes.json();
      const presetsPayload = await presetsRes.json();
      if (scalesRes.ok) setScales(scalesPayload.data ?? []);
      if (presetsRes.ok) setPresets(presetsPayload.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    reload();
  }, [reload]);

  const clonePreset = async (preset: PresetScale) => {
    setWorkingId(preset.id);
    try {
      const presetKey =
        preset.presetKey ||
        (preset.id.startsWith('preset:') ? preset.id.replace('preset:', '') : '');
      const endpoint = presetKey
        ? `${apiBase}/grading-scales/clone-preset`
        : `${apiBase}/grading-scales/${preset.id}/clone`;
      const body = presetKey ? JSON.stringify({ presetKey }) : undefined;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: presetKey ? { 'Content-Type': 'application/json' } : undefined,
        credentials: 'include',
        body,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Clone failed');
      toast({ title: 'Scale cloned', description: 'Preset added to your school scales.' });
      await reload();
      onWorkflowChange?.();
    } catch (error) {
      toast({
        title: 'Clone failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setWorkingId(null);
    }
  };

  const setDefault = async (scaleId: string) => {
    setWorkingId(scaleId);
    try {
      const res = await fetch(`${apiBase}/grading-scales/${scaleId}/set-default`, {
        method: 'POST',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || 'Update failed');
      toast({ title: 'Default scale updated' });
      await reload();
      onWorkflowChange?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setWorkingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colorTheme }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100" style={{ borderLeftWidth: 4, borderLeftColor: colorTheme }}>
          <CardTitle>Grading Scales</CardTitle>
          <CardDescription>
            Clone CBC/CBE presets for your school and assign a default scale to grading classes.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">System presets</CardTitle>
          <CardDescription>Clone a preset to customize bands for your school.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {presets.length === 0 ? (
            <p className="text-sm text-slate-500">No presets available. Check grading API access or run <code>pnpm seed:grading-presets</code>.</p>
          ) : (
            presets.map((preset) => (
              <div key={preset.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
                <div>
                  <p className="font-medium">{preset.name}</p>
                  <p className="text-sm text-slate-500">{preset.curriculum} · {preset.level}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {preset.bands?.map((b) => (
                      <Badge key={b.code} style={{ backgroundColor: b.colorHex ?? '#64748b' }}>{b.code}</Badge>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={workingId === preset.id}
                  onClick={() => clonePreset(preset)}
                  style={{ backgroundColor: colorTheme }}
                >
                  {workingId === preset.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  Clone to school
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">School scales</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Curriculum</TableHead>
                <TableHead>Bands</TableHead>
                <TableHead className="w-32">Default</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-slate-500">
                    No school scales yet — clone a preset above.
                  </TableCell>
                </TableRow>
              ) : (
                scales.map((scale) => (
                  <TableRow key={scale.id}>
                    <TableCell className="font-medium">{scale.name}</TableCell>
                    <TableCell>{scale.curriculum}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {scale.bands?.map((b) => (
                          <Badge key={b.code} variant="outline">{b.code}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {scale.isDefault ? (
                        <Badge className="gap-1 text-white" style={{ backgroundColor: colorTheme }}>
                          <Star className="h-3 w-3" /> Default
                        </Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={workingId === scale.id}
                          onClick={() => setDefault(scale.id)}
                        >
                          Set default
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
