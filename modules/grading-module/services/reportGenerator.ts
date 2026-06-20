import { prisma } from '@/lib/prisma';

export async function buildReportCardData(studentId: string, termId: string, schoolId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    include: {
      user: { select: { name: true } },
      class: { select: { name: true } },
    },
  });

  if (!student) {
    throw new Error('Student not found');
  }

  const term = await prisma.gradingModTerm.findFirst({
    where: { id: termId, academicYear: { schoolId } },
    include: { academicYear: true },
  });

  if (!term) {
    throw new Error('Term not found');
  }

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true, code: true, motto: true, principalName: true },
  });

  const [subjectResults, overallResult, comments] = await Promise.all([
    prisma.gradingModSubjectResult.findMany({
      where: { studentId, termId },
      include: {
        subject: true,
        band: true,
      },
      orderBy: { subject: { name: 'asc' } },
    }),
    prisma.gradingModOverallResult.findFirst({
      where: { studentId, termId },
      include: { meanBand: true, class: true },
    }),
    prisma.gradingModReportCard.findFirst({
      where: { studentId, termId, schoolId },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    }),
  ]);

  return {
    school,
    student: {
      id: student.id,
      name: student.user.name,
      admissionNumber: student.admissionNumber,
      className: student.class?.name ?? overallResult?.class?.name ?? '',
    },
    term: {
      id: term.id,
      name: term.name,
      academicYear: term.academicYear.name,
    },
    subjectResults: subjectResults.map((sr) => ({
      subjectName: sr.subject.name,
      weightedScore: sr.weightedScore,
      points: sr.points,
      band: sr.band
        ? { code: sr.band.code, label: sr.band.label, colorHex: sr.band.colorHex }
        : null,
    })),
    overall: overallResult
      ? {
          meanPoints: overallResult.meanPoints,
          totalPoints: overallResult.totalPoints,
          classPosition: overallResult.classPosition,
          classSize: overallResult.classSize,
          meanBand: overallResult.meanBand
            ? {
                code: overallResult.meanBand.code,
                label: overallResult.meanBand.label,
              }
            : null,
        }
      : null,
    comments: comments?.comments ?? [],
  };
}

export async function generateReportCardRecord(
  studentId: string,
  termId: string,
  schoolId: string,
  publishedBy?: string
) {
  const existing = await prisma.gradingModReportCard.findFirst({
    where: { studentId, termId, schoolId },
  });

  if (existing) {
    return prisma.gradingModReportCard.update({
      where: { id: existing.id },
      data: { generatedAt: new Date() },
      include: { comments: true },
    });
  }

  return prisma.gradingModReportCard.create({
    data: {
      schoolId,
      studentId,
      termId,
      publishedBy: publishedBy ?? null,
    },
    include: { comments: true },
  });
}

export async function generateBatchReportCards(
  classId: string,
  termId: string,
  schoolId: string,
  publishedBy?: string
) {
  const gradingClass = await prisma.gradingModClass.findFirst({
    where: { id: classId, schoolId },
    select: { legacyClassId: true },
  });

  if (!gradingClass) {
    throw new Error('Class not found');
  }

  const rosterClassId = gradingClass.legacyClassId ?? classId;
  const students = await prisma.student.findMany({
    where: { classId: rosterClassId, schoolId, isActive: true },
    select: { id: true },
  });

  const reports = [];
  for (const student of students) {
    const report = await generateReportCardRecord(student.id, termId, schoolId, publishedBy);
    reports.push(report);
  }

  return reports;
}

export async function renderReportCardPdf(
  studentId: string,
  termId: string,
  schoolId: string
): Promise<Buffer> {
  const data = await buildReportCardData(studentId, termId, schoolId);
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFontSize(16);
  pdf.text(data.school?.name ?? 'School Report Card', pageWidth / 2, 18, { align: 'center' });

  pdf.setFontSize(10);
  if (data.school?.motto) {
    pdf.text(data.school.motto, pageWidth / 2, 24, { align: 'center' });
  }

  pdf.setFontSize(12);
  pdf.text('ACADEMIC REPORT CARD', pageWidth / 2, 32, { align: 'center' });

  pdf.setFontSize(10);
  let y = 42;
  pdf.text(`Student: ${data.student.name}`, 14, y);
  y += 6;
  pdf.text(`Admission No: ${data.student.admissionNumber}`, 14, y);
  y += 6;
  pdf.text(`Class: ${data.student.className}`, 14, y);
  y += 6;
  pdf.text(`${data.term.academicYear} — ${data.term.name}`, 14, y);
  y += 10;

  const tableBody = data.subjectResults.map((sr) => [
    sr.subjectName,
    sr.weightedScore != null ? `${sr.weightedScore}%` : '-',
    sr.band?.code ?? '-',
    sr.points != null ? String(sr.points) : '-',
  ]);

  autoTable(pdf, {
    startY: y,
    head: [['Subject', 'Score', 'Band', 'Points']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
    styles: { fontSize: 9 },
  });

  const finalY = (pdf as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40;

  if (data.overall) {
    pdf.setFontSize(10);
    pdf.text(
      `Overall: ${data.overall.meanBand?.code ?? 'N/A'} | Total Points: ${data.overall.totalPoints ?? '-'} | Mean: ${data.overall.meanPoints ?? '-'}`,
      14,
      finalY + 10
    );
    if (data.overall.classPosition != null && data.overall.classSize != null) {
      pdf.text(
        `Class Position: ${data.overall.classPosition} out of ${data.overall.classSize}`,
        14,
        finalY + 16
      );
    }
  }

  if (data.comments.length > 0) {
    let commentY = finalY + 26;
    pdf.setFontSize(11);
    pdf.text('Comments', 14, commentY);
    commentY += 6;
    pdf.setFontSize(9);
    for (const comment of data.comments) {
      pdf.text(`${comment.role}: ${comment.comment}`, 14, commentY, { maxWidth: pageWidth - 28 });
      commentY += 8;
    }
  }

  pdf.setFontSize(8);
  pdf.text(`Generated ${new Date().toLocaleDateString('en-KE')}`, 14, 285);

  return Buffer.from(pdf.output('arraybuffer'));
}

export async function addReportComment(
  reportCardId: string,
  schoolId: string,
  data: { role: string; comment: string; authorId?: string }
) {
  const report = await prisma.gradingModReportCard.findFirst({
    where: { id: reportCardId, schoolId },
  });
  if (!report) {
    throw new Error('Report card not found');
  }

  return prisma.gradingModReportComment.create({
    data: {
      reportCardId,
      role: data.role,
      comment: data.comment,
      authorId: data.authorId,
    },
  });
}

export async function publishReportCard(reportCardId: string, schoolId: string, publishedBy: string) {
  const report = await prisma.gradingModReportCard.findFirst({
    where: { id: reportCardId, schoolId },
  });
  if (!report) {
    throw new Error('Report card not found');
  }

  return prisma.gradingModReportCard.update({
    where: { id: reportCardId },
    data: { publishedAt: new Date(), publishedBy },
  });
}

export async function listStudentReports(studentId: string, schoolId: string) {
  return prisma.gradingModReportCard.findMany({
    where: { studentId, schoolId },
    include: {
      term: { include: { academicYear: true } },
      comments: true,
    },
    orderBy: { generatedAt: 'desc' },
  });
}
