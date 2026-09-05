/**
 * READ-ONLY diagnostic for Waita adm 1170 Term 3 fee update bug.
 * Does not create, update, or delete any records.
 */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function money(n) {
  return Number(n || 0).toLocaleString('en-KE', { maximumFractionDigits: 0 });
}

async function main() {
  const adm = process.argv[2] || '1170';

  const schools = await p.school.findMany({
    where: {
      OR: [
        { code: { contains: 'waita', mode: 'insensitive' } },
        { name: { contains: 'waita', mode: 'insensitive' } },
      ],
    },
    select: { id: true, code: true, name: true },
  });
  console.log('=== SCHOOLS ===');
  console.log(schools);

  const school =
    schools.find((s) => s.code.toLowerCase().includes('waita')) || schools[0];
  if (!school) {
    console.log('No Waita school found');
    return;
  }
  console.log('\nUsing school:', school.code, school.name);

  const student = await p.student.findFirst({
    where: { schoolId: school.id, admissionNumber: adm },
    include: {
      user: { select: { name: true } },
      class: { include: { grade: true } },
      currentAcademicYear: true,
      currentTerm: true,
    },
  });

  if (!student) {
    console.log('Student not found for adm', adm);
    return;
  }

  console.log('\n=== STUDENT ===');
  console.log({
    id: student.id,
    name: student.user?.name,
    adm: student.admissionNumber,
    grade: student.class?.grade?.name,
    className: student.class?.name,
    gradeId: student.class?.gradeId,
    feeAccommodation: student.feeAccommodation,
    currentAY: student.currentAcademicYear?.name,
    currentAYId: student.currentAcademicYearId,
    currentTerm: student.currentTerm?.name,
    currentTermId: student.currentTermId,
    joinedAYId: student.joinedAcademicYearId,
    joinedTermId: student.joinedTermId,
  });

  const years = await p.academicYear.findMany({
    where: { schoolId: school.id },
    include: { terms: { orderBy: { name: 'asc' } } },
    orderBy: { name: 'desc' },
  });
  console.log('\n=== ACADEMIC YEARS / TERMS ===');
  for (const y of years) {
    console.log(
      `${y.name} id=${y.id} current=${y.isCurrent} terms=[${y.terms
        .map((t) => `${t.name}:${t.id}`)
        .join(', ')}]`
    );
  }

  const targetYear =
    years.find((y) => y.isCurrent) ||
    years.find((y) => y.id === student.currentAcademicYearId) ||
    years[0];

  console.log('\nTarget year for analysis:', targetYear?.name, targetYear?.id);

  const feeStructures = await p.termlyFeeStructure.findMany({
    where: {
      schoolId: school.id,
      gradeId: student.class?.gradeId,
      isActive: true,
      ...(targetYear ? { academicYearId: targetYear.id } : {}),
    },
    orderBy: [{ term: 'asc' }],
  });

  console.log('\n=== FEE STRUCTURES (grade + year) ===');
  for (const fs of feeStructures) {
    console.log({
      term: fs.term,
      totalAmount: Number(fs.totalAmount),
      termId: fs.termId,
      academicYearId: fs.academicYearId,
      year: fs.year,
      feeAccommodation: fs.feeAccommodation,
      id: fs.id,
    });
  }

  // termId mismatch check
  console.log('\n=== TERM ID ALIGNMENT (fee structure termId vs Term table) ===');
  for (const fs of feeStructures) {
    const termRow = targetYear?.terms.find((t) => t.name === fs.term);
    const matchById = targetYear?.terms.find((t) => t.id === fs.termId);
    console.log({
      feeTerm: fs.term,
      feeTermId: fs.termId,
      termTableByName: termRow ? `${termRow.name}:${termRow.id}` : null,
      termTableById: matchById ? `${matchById.name}:${matchById.id}` : 'NO MATCH BY ID',
      idsEqual: termRow ? termRow.id === fs.termId : false,
    });
  }

  const payments = await p.payment.findMany({
    where: { studentId: student.id },
    include: {
      academicYear: true,
      term: true,
      receipt: true,
    },
    orderBy: { paymentDate: 'asc' },
  });

  console.log('\n=== ALL PAYMENTS (chronological) ===');
  for (const pay of payments) {
    console.log({
      date: pay.paymentDate?.toISOString?.()?.slice(0, 10),
      amount: pay.amount,
      ay: pay.academicYear?.name,
      ayId: pay.academicYearId,
      term: pay.term?.name,
      termId: pay.termId,
      receipt: pay.receiptNumber,
      desc: pay.description,
      receivedBy: pay.receivedBy,
      termBefore: pay.receipt?.termOutstandingBefore,
      termAfter: pay.receipt?.termOutstandingAfter,
      yearBefore: pay.receipt?.academicYearOutstandingBefore,
      yearAfter: pay.receipt?.academicYearOutstandingAfter,
      createdAt: pay.createdAt?.toISOString?.(),
    });
  }

  // Simulate snapshot carry-forward algorithm (read-only, in-memory)
  const termOrder = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
  const structures = [...feeStructures]
    .filter((fs) => fs.termId && fs.academicYearId)
    .sort((a, b) => (termOrder[a.term] || 0) - (termOrder[b.term] || 0));

  // Deduplicate like resolveTermStructuresForFees (prefer segmented)
  const byTerm = new Map();
  for (const fs of structures) {
    const list = byTerm.get(fs.term) || [];
    list.push(fs);
    byTerm.set(fs.term, list);
  }
  const picked = [];
  for (const [, list] of byTerm) {
    const ranked = [...list].sort(
      (a, b) => (b.feeAccommodation ? 1 : 0) - (a.feeAccommodation ? 1 : 0)
    );
    picked.push(ranked[0]);
  }
  picked.sort((a, b) => (termOrder[a.term] || 0) - (termOrder[b.term] || 0));

  const yearPayments = payments.filter(
    (pay) => pay.academicYearId === targetYear?.id
  );

  console.log('\n=== SIMULATED SNAPSHOT (carry-forward engine) ===');
  let carryForward = 0;
  for (let i = 0; i < picked.length; i++) {
    const fs = picked[i];
    const paymentsForTerm = yearPayments
      .filter((pay) => pay.termId === fs.termId)
      .reduce((s, pay) => s + pay.amount, 0);
    const charges = Number(fs.totalAmount);
    const baseBalance = charges - paymentsForTerm;
    let balance = baseBalance + carryForward;
    let carryToNext = 0;
    if (balance < 0) {
      carryToNext = balance;
      balance = 0;
    }
    console.log({
      term: fs.term,
      termId: fs.termId,
      charges,
      paymentsForTerm,
      baseBalance,
      carryForwardIn: carryForward,
      displayedBalance: Math.max(0, balance),
      carryToNext,
      paymentTermIdMatches: yearPayments
        .filter((pay) => pay.term?.name === fs.term)
        .map((pay) => ({
          amount: pay.amount,
          paymentTermId: pay.termId,
          equalsFsTermId: pay.termId === fs.termId,
        })),
    });
    if (i < picked.length - 1) carryForward = carryToNext;
  }

  // Payments tagged Term 3 whose termId does not match fee structure Term 3
  const t3Fs = picked.find((fs) => fs.term === 'Term 3');
  const t3Term = targetYear?.terms.find((t) => t.name === 'Term 3');
  console.log('\n=== TERM 3 FOCUS ===');
  console.log({
    feeStructureTerm3Id: t3Fs?.termId,
    termTableTerm3Id: t3Term?.id,
    feeAmount: t3Fs ? Number(t3Fs.totalAmount) : null,
    paymentsLabeledTerm3: yearPayments
      .filter((pay) => pay.term?.name === 'Term 3')
      .map((pay) => ({
        amount: pay.amount,
        termId: pay.termId,
        matchesFs: pay.termId === t3Fs?.termId,
        matchesTermTable: pay.termId === t3Term?.id,
        receiptTermBefore: pay.receipt?.termOutstandingBefore,
        receiptTermAfter: pay.receipt?.termOutstandingAfter,
      })),
    paymentsWithFsTerm3Id: yearPayments
      .filter((pay) => pay.termId === t3Fs?.termId)
      .map((pay) => ({ amount: pay.amount, termName: pay.term?.name })),
  });

  // Compare a "fee clean" pattern vs "had arrears" — compute if T1/T2 fully cleared
  const t1 = picked.find((fs) => fs.term === 'Term 1');
  const t2 = picked.find((fs) => fs.term === 'Term 2');
  const paid = (fs) =>
    yearPayments
      .filter((pay) => pay.termId === fs?.termId)
      .reduce((s, pay) => s + pay.amount, 0);
  const t1Bal = t1 ? Number(t1.totalAmount) - paid(t1) : null;
  const t2Bal = t2 ? Number(t2.totalAmount) - paid(t2) : null;
  const t3Bal = t3Fs ? Number(t3Fs.totalAmount) - paid(t3Fs) : null;
  console.log('\n=== FEE-CLEAN STATUS ===');
  console.log({
    term1Base: t1Bal,
    term2Base: t2Bal,
    term3Base: t3Bal,
    isFeeCleanEnteringT3: t1Bal != null && t2Bal != null && t1Bal <= 0 && t2Bal <= 0,
    expectedAfter4kOn4500: t3Fs ? Number(t3Fs.totalAmount) - paid(t3Fs) : null,
  });

  // Receipt anomalies: double-subtract pattern (after == before - amount when before already post-payment)
  console.log('\n=== RECEIPT BALANCE ANOMALIES ===');
  for (const pay of payments) {
    const r = pay.receipt;
    if (!r) continue;
    const before = Number(r.termOutstandingBefore ?? NaN);
    const after = Number(r.termOutstandingAfter ?? NaN);
    const amt = Number(pay.amount);
    const flags = [];
    if (before === 0 && after === 0 && amt > 0) flags.push('ZERO_TERM_BEFORE_AND_AFTER');
    if (before === after && amt > 0) flags.push('TERM_BALANCE_UNCHANGED');
    if (after === Math.max(0, before - amt - amt)) flags.push('POSSIBLE_DOUBLE_SUBTRACT');
    if (before < amt && after === 0 && pay.term?.name === 'Term 3')
      flags.push('BEFORE_LT_PAYMENT_ON_T3');
    if (flags.length) {
      console.log({
        date: pay.paymentDate?.toISOString?.()?.slice(0, 10),
        amount: amt,
        term: pay.term?.name,
        before,
        after,
        yearBefore: r.academicYearOutstandingBefore,
        yearAfter: r.academicYearOutstandingAfter,
        flags,
      });
    }
  }

  console.log('\nDone (read-only).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => p.$disconnect());
