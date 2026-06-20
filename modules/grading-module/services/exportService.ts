import * as XLSX from 'xlsx';
import { getClassRankings } from './rankingService';

export async function exportRankingList(
  classId: string,
  termId: string,
  schoolId: string
): Promise<Buffer> {
  const data = await getClassRankings(classId, termId, schoolId);

  const headers = [
    'Position',
    'Admission No',
    'Student Name',
    ...data.subjects.map((s) => s.name),
    'Total Points',
    'Mean Points',
    'Mean Band',
  ];

  const rows = data.rankings.map((row) => {
    const subjectScores = data.subjects.map((subject) => {
      const result = row.subjects.find((s) => s.subjectId === subject.id);
      return result?.band?.code ?? (result?.weightedScore != null ? String(result.weightedScore) : '');
    });

    return [
      row.classPosition ?? '',
      row.admissionNumber,
      row.name,
      ...subjectScores,
      row.totalPoints ?? '',
      row.meanPoints ?? '',
      row.meanBand?.code ?? '',
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rankings');

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}

export async function exportClassMarksheet(
  classId: string,
  termId: string,
  schoolId: string
): Promise<Buffer> {
  const data = await getClassRankings(classId, termId, schoolId);

  const headers = [
    'Admission No',
    'Student Name',
    ...data.subjects.map((s) => `${s.name} (%)`),
    ...data.subjects.map((s) => `${s.name} (Band)`),
    'Total Points',
    'Position',
  ];

  const rows = data.rankings.map((row) => {
    const percentages = data.subjects.map((subject) => {
      const result = row.subjects.find((s) => s.subjectId === subject.id);
      return result?.weightedScore ?? '';
    });
    const bands = data.subjects.map((subject) => {
      const result = row.subjects.find((s) => s.subjectId === subject.id);
      return result?.band?.code ?? '';
    });

    return [
      row.admissionNumber,
      row.name,
      ...percentages,
      ...bands,
      row.totalPoints ?? '',
      row.classPosition ?? '',
    ];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Marksheet');

  return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
}
