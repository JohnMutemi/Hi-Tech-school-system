/**
 * READ-ONLY: Simulate fixed snapshot for adm 1170 (no writes).
 * Shows what bursar would see after code fix (before clerk cleanup).
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadDatabaseUrl() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.trim().match(/^DATABASE_URL\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    return v;
  }
  return process.env.DATABASE_URL;
}

const TERM_ORDER = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };

function paymentIsOnOrAfterJoinTerm(payment, join) {
  if (!payment.academicYearId || !payment.termId) return false;
  if (payment.academicYearId < join.academicYearId) return false;
  if (payment.academicYearId !== join.academicYearId) return true;
  if (payment.termId === join.termId) return true;
  const joinOrd = TERM_ORDER[join.termName] || 0;
  const payOrd = TERM_ORDER[payment.termName] || 0;
  if (joinOrd > 0 && payOrd > 0) return payOrd >= joinOrd;
  return true;
}

async function main() {
  const client = new Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const studentId = 'ce3109cf-a54e-4ea5-bffc-08c4e41cddef';
  const ay = 'c0b30ec7-7eca-4784-b49b-cb14798b2cce';
  const joinTermId = '1cad1ac1-5ef3-4c3f-a9e9-0dfdf671a828';

  const fees = await client.query(
    `SELECT term, "totalAmount", "termId" FROM "TermlyFeeStructure"
     WHERE "academicYearId"=$1 AND "gradeId"='07d3e7c4-bdab-4c30-b533-1d1bbc6424c5'
       AND "isActive"=true AND "feeAccommodation"='day_scholar'
     ORDER BY term`,
    [ay]
  );
  const pays = await client.query(
    `SELECT p.amount, p."termId", p."academicYearId", t.name AS "termName",
            p."receiptNumber", p."paymentDate"
     FROM "Payment" p
     LEFT JOIN "Term" t ON t.id = p."termId"
     WHERE p."studentId"=$1 AND p."academicYearId"=$2
     ORDER BY p."paymentDate", p."createdAt"`,
    [studentId, ay]
  );

  const join = { academicYearId: ay, termId: joinTermId, termName: 'Term 1' };
  const kept = pays.rows.filter((p) => paymentIsOnOrAfterJoinTerm(p, join));
  const dropped = pays.rows.filter((p) => !paymentIsOnOrAfterJoinTerm(p, join));

  console.log('=== ADM 1170 AFTER FIX (read-only simulation) ===');
  console.log('Payments kept:', kept.length, '/', pays.rows.length);
  console.log('Payments dropped:', dropped.length);

  let carry = 0;
  const picked = [...fees.rows].sort(
    (a, b) => (TERM_ORDER[a.term] || 0) - (TERM_ORDER[b.term] || 0)
  );
  for (let i = 0; i < picked.length; i++) {
    const fs = picked[i];
    const paid = kept
      .filter((p) => p.termId === fs.termId || p.termName === fs.term)
      .reduce((s, p) => s + Number(p.amount), 0);
    const base = Number(fs.totalAmount) - paid;
    let bal = base + carry;
    let carryNext = 0;
    if (bal < 0) {
      carryNext = bal;
      bal = 0;
    }
    console.log({
      term: fs.term,
      charges: Number(fs.totalAmount),
      paid,
      displayedBalance: Math.max(0, bal),
      note:
        fs.term === 'Term 3' && paid > Number(fs.totalAmount)
          ? 'OVERPAID until clerk removes duplicate debug entries'
          : undefined,
    });
    if (i < picked.length - 1) carry = carryNext;
  }

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
