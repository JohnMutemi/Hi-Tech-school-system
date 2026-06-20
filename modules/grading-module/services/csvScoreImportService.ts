import { prisma } from '@/lib/prisma';
import { upsertAssessmentScores } from './scoreEntryService';

type CsvRow = { admissionNumber: string; rawScore: number | null; remarks?: string };

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
}

export function parseScoreCsv(csvText: string): CsvRow[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  const headerCells = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
  const admIdx = headerCells.findIndex((h) =>
    ['admissionnumber', 'admno', 'admission_no', 'admission'].includes(h)
  );
  const scoreIdx = headerCells.findIndex((h) =>
    ['score', 'rawscore', 'raw_score', 'mark', 'marks'].includes(h)
  );
  const remarksIdx = headerCells.findIndex((h) => ['remarks', 'comment', 'note'].includes(h));

  const hasHeader = admIdx >= 0 && scoreIdx >= 0;
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const effectiveAdmIdx = hasHeader ? admIdx : 0;
  const effectiveScoreIdx = hasHeader ? scoreIdx : 1;
  const effectiveRemarksIdx = hasHeader ? remarksIdx : 2;

  return dataLines.map((line) => {
    const cells = parseCsvLine(line);
    const admissionNumber = cells[effectiveAdmIdx]?.trim() ?? '';
    const scoreRaw = cells[effectiveScoreIdx]?.trim() ?? '';
    const rawScore = scoreRaw === '' ? null : Number(scoreRaw);
    const remarks = effectiveRemarksIdx >= 0 ? cells[effectiveRemarksIdx]?.trim() : undefined;
    return {
      admissionNumber,
      rawScore: rawScore != null && Number.isFinite(rawScore) ? rawScore : null,
      remarks,
    };
  }).filter((row) => row.admissionNumber);
}

export async function importScoresFromCsv(
  assessmentId: string,
  schoolId: string,
  csvText: string,
  enteredBy?: string
) {
  const rows = parseScoreCsv(csvText);
  if (rows.length === 0) {
    throw new Error('No valid rows found in CSV');
  }

  const assessment = await prisma.gradingModAssessment.findFirst({
    where: { id: assessmentId, schoolId },
    include: { class: { select: { legacyClassId: true } } },
  });
  if (!assessment) throw new Error('Assessment not found');

  const rosterClassId = assessment.class.legacyClassId ?? assessment.classId;
  const students = await prisma.student.findMany({
    where: { classId: rosterClassId, schoolId, isActive: true },
    select: { id: true, admissionNumber: true },
  });

  const byAdmission = new Map(
    students.map((s) => [s.admissionNumber.trim().toLowerCase(), s.id])
  );

  const entries: Array<{ studentId: string; rawScore: number | null; remarks?: string }> = [];
  const unmatched: string[] = [];

  for (const row of rows) {
    const studentId = byAdmission.get(row.admissionNumber.toLowerCase());
    if (!studentId) {
      unmatched.push(row.admissionNumber);
      continue;
    }
    entries.push({
      studentId,
      rawScore: row.rawScore,
      remarks: row.remarks,
    });
  }

  if (entries.length === 0) {
    throw new Error(
      unmatched.length > 0
        ? `No matching students for admission numbers: ${unmatched.slice(0, 5).join(', ')}`
        : 'No scores to import'
    );
  }

  const result = await upsertAssessmentScores(assessmentId, schoolId, entries, enteredBy);
  return { ...result, imported: entries.length, unmatched };
}
