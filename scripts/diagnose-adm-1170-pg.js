/**
 * READ-ONLY diagnostic via pg (no Prisma generate needed).
 * Does not INSERT/UPDATE/DELETE.
 *
 * Usage: node scripts/diagnose-adm-1170-pg.js [admissionNumber]
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadDatabaseUrl() {
  const envPath = path.join(__dirname, '..', '.env');
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^DATABASE_URL\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    // Tolerate accidental double-prefix in .env
    if (v.startsWith('DATABASE_URL=')) v = v.slice('DATABASE_URL='.length);
    return v;
  }
  return process.env.DATABASE_URL;
}

async function main() {
  const adm = process.argv[2] || '1170';
  const connectionString = loadDatabaseUrl();
  if (!connectionString) {
    console.error('No DATABASE_URL');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const schools = await client.query(
      `SELECT id, code, name FROM "School"
       WHERE code ILIKE '%waita%' OR name ILIKE '%waita%'
       ORDER BY code`
    );
    console.log('=== SCHOOLS ===');
    console.log(schools.rows);

    const school = schools.rows[0];
    if (!school) {
      console.log('No Waita school');
      return;
    }
    console.log('\nUsing:', school.code, school.name);

    const studentRes = await client.query(
      `SELECT s.id, s."admissionNumber", s."feeAccommodation",
              s."currentAcademicYearId", s."currentTermId",
              s."joinedAcademicYearId", s."joinedTermId",
              u.name AS student_name,
              c.name AS class_name, c."gradeId",
              g.name AS grade_name
       FROM "Student" s
       JOIN "User" u ON u.id = s."userId"
       LEFT JOIN "Class" c ON c.id = s."classId"
       LEFT JOIN "Grade" g ON g.id = c."gradeId"
       WHERE s."schoolId" = $1 AND s."admissionNumber" = $2
       LIMIT 1`,
      [school.id, adm]
    );
    if (!studentRes.rows.length) {
      console.log('Student not found');
      return;
    }
    const student = studentRes.rows[0];
    console.log('\n=== STUDENT ===');
    console.log(student);

    const years = await client.query(
      `SELECT ay.id, ay.name, ay."isCurrent",
              COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name)
                ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL), '[]') AS terms
       FROM "AcademicYear" ay
       LEFT JOIN "Term" t ON t."academicYearId" = ay.id
       WHERE ay."schoolId" = $1
       GROUP BY ay.id
       ORDER BY ay.name DESC`,
      [school.id]
    );
    console.log('\n=== ACADEMIC YEARS ===');
    for (const y of years.rows) {
      console.log(y.name, 'current=' + y.isCurrent, 'id=' + y.id, 'terms=', y.terms);
    }

    const targetYear =
      years.rows.find((y) => y.isCurrent) ||
      years.rows.find((y) => y.id === student.currentAcademicYearId) ||
      years.rows[0];

    console.log('\nTarget year:', targetYear?.name, targetYear?.id);

    const fees = await client.query(
      `SELECT id, term, "totalAmount", "termId", "academicYearId", year,
              "feeAccommodation", "isActive"
       FROM "TermlyFeeStructure"
       WHERE "schoolId" = $1 AND "gradeId" = $2 AND "academicYearId" = $3 AND "isActive" = true
       ORDER BY term, "feeAccommodation" NULLS FIRST`,
      [school.id, student.gradeId, targetYear.id]
    );
    console.log('\n=== FEE STRUCTURES (PP1 grade + year) ===');
    console.log(fees.rows);

    console.log('\n=== TERM ID ALIGNMENT ===');
    const termList = Array.isArray(targetYear.terms)
      ? targetYear.terms
      : JSON.parse(targetYear.terms || '[]');
    for (const fs of fees.rows) {
      const byName = termList.find((t) => t.name === fs.term);
      const byId = termList.find((t) => t.id === fs.termId);
      console.log({
        feeTerm: fs.term,
        feeAmount: Number(fs.totalAmount),
        feeTermId: fs.termId,
        termTableByName: byName || null,
        idsEqual: byName ? byName.id === fs.termId : false,
        resolvedById: byId ? byId.name : 'ORPHAN_TERM_ID',
        feeAccommodation: fs.feeAccommodation,
      });
    }

    const pays = await client.query(
      `SELECT p.id, p.amount, p."paymentDate", p."createdAt", p."receiptNumber", p.description,
              p."receivedBy", p."academicYearId", p."termId",
              ay.name AS ay_name, t.name AS term_name,
              r."termOutstandingBefore", r."termOutstandingAfter",
              r."academicYearOutstandingBefore", r."academicYearOutstandingAfter"
       FROM "Payment" p
       LEFT JOIN "AcademicYear" ay ON ay.id = p."academicYearId"
       LEFT JOIN "Term" t ON t.id = p."termId"
       LEFT JOIN "Receipt" r ON r."paymentId" = p.id
       WHERE p."studentId" = $1
       ORDER BY p."paymentDate" ASC, p."createdAt" ASC`,
      [student.id]
    );
    console.log('\n=== PAYMENTS (' + pays.rows.length + ') ===');
    for (const p of pays.rows) {
      console.log({
        date: p.paymentDate?.toISOString?.()?.slice(0, 10),
        amount: Number(p.amount),
        ay: p.ay_name,
        term: p.term_name,
        termId: p.termId,
        receipt: p.receiptNumber,
        receivedBy: p.receivedBy,
        termBefore: p.termOutstandingBefore,
        termAfter: p.termOutstandingAfter,
        yearBefore: p.academicYearOutstandingBefore,
        yearAfter: p.academicYearOutstandingAfter,
        desc: p.description,
      });
    }

    // Simulate snapshot allocation for this year
    const yearPays = pays.rows.filter((p) => p.academicYearId === targetYear.id);
    const termOrder = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };

    // Prefer segmented row like resolveTermStructuresForFees
    const byTerm = new Map();
    for (const fs of fees.rows) {
      if (!fs.termId) continue;
      const list = byTerm.get(fs.term) || [];
      list.push(fs);
      byTerm.set(fs.term, list);
    }
    const picked = [];
    for (const [, list] of byTerm) {
      list.sort((a, b) => (b.feeAccommodation ? 1 : 0) - (a.feeAccommodation ? 1 : 0));
      picked.push(list[0]);
    }
    picked.sort((a, b) => (termOrder[a.term] || 0) - (termOrder[b.term] || 0));

    console.log('\n=== SIMULATED SNAPSHOT ===');
    let carryForward = 0;
    for (let i = 0; i < picked.length; i++) {
      const fs = picked[i];
      const paymentsForTerm = yearPays
        .filter((p) => p.termId === fs.termId)
        .reduce((s, p) => s + Number(p.amount), 0);
      const paymentsByName = yearPays
        .filter((p) => p.term_name === fs.term)
        .reduce((s, p) => s + Number(p.amount), 0);
      const charges = Number(fs.totalAmount);
      const baseBalance = charges - paymentsForTerm;
      let balance = baseBalance + carryForward;
      let carryToNext = 0;
      if (balance < 0) {
        carryToNext = balance;
        balance = 0;
      }
      const orphanNamePays = yearPays.filter(
        (p) => p.term_name === fs.term && p.termId !== fs.termId
      );
      console.log({
        term: fs.term,
        charges,
        paymentsMatchedByTermId: paymentsForTerm,
        paymentsMatchedByTermName: paymentsByName,
        orphanPaymentsOnTermName: orphanNamePays.map((p) => ({
          amount: Number(p.amount),
          paymentTermId: p.termId,
          feeTermId: fs.termId,
        })),
        baseBalance,
        carryForwardIn: carryForward,
        displayedBalance: Math.max(0, balance),
        wouldMatchPaymentApiLookup:
          termList.find((t) => t.name === fs.term)?.id === fs.termId,
      });
      if (i < picked.length - 1) carryForward = carryToNext;
    }

    const t1 = picked.find((f) => f.term === 'Term 1');
    const t2 = picked.find((f) => f.term === 'Term 2');
    const t3 = picked.find((f) => f.term === 'Term 3');
    const paidOn = (fs) =>
      fs
        ? yearPays
            .filter((p) => p.termId === fs.termId)
            .reduce((s, p) => s + Number(p.amount), 0)
        : 0;

    console.log('\n=== FEE-CLEAN / TERM3 CASE ===');
    console.log({
      t1Base: t1 ? Number(t1.totalAmount) - paidOn(t1) : null,
      t2Base: t2 ? Number(t2.totalAmount) - paidOn(t2) : null,
      t3Base: t3 ? Number(t3.totalAmount) - paidOn(t3) : null,
      t3FeeAmount: t3 ? Number(t3.totalAmount) : null,
      feeCleanEnteringT3:
        t1 &&
        t2 &&
        Number(t1.totalAmount) - paidOn(t1) <= 0 &&
        Number(t2.totalAmount) - paidOn(t2) <= 0,
      expectedAfter4k: t3 ? Number(t3.totalAmount) - paidOn(t3) : null,
      t3TermIdMismatch: t3
        ? termList.find((t) => t.name === 'Term 3')?.id !== t3.termId
        : null,
    });

    console.log('\n=== RECEIPT FLAGS (Term 3) ===');
    for (const p of pays.rows.filter((x) => x.term_name === 'Term 3')) {
      const before = Number(p.termOutstandingBefore ?? NaN);
      const after = Number(p.termOutstandingAfter ?? NaN);
      const amt = Number(p.amount);
      const flags = [];
      if (before === 0 && after === 0 && amt > 0) flags.push('ZERO_BEFORE_AND_AFTER');
      if (before === after && amt > 0) flags.push('UNCHANGED');
      if (Number.isFinite(before) && before < 4500 && before > 0)
        flags.push('BEFORE_LT_FULL_T3_FEE');
      console.log({ date: p.paymentDate?.toISOString?.()?.slice(0, 10), amt, before, after, flags });
    }

    console.log('\nDone (read-only).');
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
