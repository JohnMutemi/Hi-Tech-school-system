/**
 * READ-ONLY: Term 3 payment receipt stats for Waita (UUID join-filter hypothesis).
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

async function main() {
  const client = new Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const schoolId = '871d78ea-633c-49cb-80df-45b41402791b';
  const ay = 'c0b30ec7-7eca-4784-b49b-cb14798b2cce';
  const t3 = '0cf94a66-6679-4cb0-a17a-05601eac0101';
  const t1 = '1cad1ac1-5ef3-4c3f-a9e9-0dfdf671a828';

  console.log('UUID lexicographic: Term3 < Term1?', t3 < t1);

  const stats = await client.query(
    `SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE r."termOutstandingBefore" = r."termOutstandingAfter")::int AS term_unchanged,
      COUNT(*) FILTER (WHERE r."academicYearOutstandingBefore" = r."academicYearOutstandingAfter")::int AS year_unchanged,
      COUNT(*) FILTER (WHERE r."termOutstandingBefore" > r."termOutstandingAfter")::int AS term_reduced
     FROM "Payment" p
     JOIN "Student" s ON s.id = p."studentId"
     JOIN "Receipt" r ON r."paymentId" = p.id
     WHERE s."schoolId" = $1 AND p."academicYearId" = $2 AND p."termId" = $3`,
    [schoolId, ay, t3]
  );
  console.log('\n=== TERM 3 PAYMENT RECEIPT STATS (2026) ===');
  console.log(stats.rows[0]);

  const byJoin = await client.query(
    `SELECT
      COALESCE(jt.name, '(no join term)') AS joined_term,
      (s."joinedTermId" IS NOT NULL AND p."termId" < s."joinedTermId") AS would_drop_uuid,
      COUNT(*)::int AS n,
      COUNT(*) FILTER (WHERE r."termOutstandingBefore" = r."termOutstandingAfter")::int AS term_unchanged,
      COUNT(*) FILTER (WHERE r."termOutstandingBefore" > r."termOutstandingAfter")::int AS term_reduced
     FROM "Payment" p
     JOIN "Student" s ON s.id = p."studentId"
     JOIN "Receipt" r ON r."paymentId" = p.id
     LEFT JOIN "Term" jt ON jt.id = s."joinedTermId"
     WHERE s."schoolId" = $1 AND p."academicYearId" = $2 AND p."termId" = $3
     GROUP BY 1, 2
     ORDER BY 1, 2`,
    [schoolId, ay, t3]
  );
  console.log('\n=== BY JOIN TERM / UUID-DROP FLAG ===');
  console.log(byJoin.rows);

  const samples = await client.query(
    `SELECT s."admissionNumber", u.name, p.amount,
            r."termOutstandingBefore" AS tb, r."termOutstandingAfter" AS ta,
            r."academicYearOutstandingBefore" AS yb, r."academicYearOutstandingAfter" AS ya,
            jt.name AS joined_term,
            (s."joinedTermId" IS NOT NULL AND p."termId" < s."joinedTermId") AS would_drop_uuid
     FROM "Payment" p
     JOIN "Student" s ON s.id = p."studentId"
     JOIN "User" u ON u.id = s."userId"
     JOIN "Receipt" r ON r."paymentId" = p.id
     LEFT JOIN "Term" jt ON jt.id = s."joinedTermId"
     WHERE s."schoolId" = $1 AND p."academicYearId" = $2 AND p."termId" = $3
       AND r."termOutstandingBefore" > r."termOutstandingAfter"
     ORDER BY p."paymentDate" DESC
     LIMIT 10`,
    [schoolId, ay, t3]
  );
  console.log('\n=== SAMPLE WORKING TERM3 UPDATES ===');
  console.log(samples.rows);

  const broken = await client.query(
    `SELECT s."admissionNumber", u.name, p.amount,
            r."termOutstandingBefore" AS tb, r."termOutstandingAfter" AS ta,
            jt.name AS joined_term,
            (s."joinedTermId" IS NOT NULL AND p."termId" < s."joinedTermId") AS would_drop_uuid
     FROM "Payment" p
     JOIN "Student" s ON s.id = p."studentId"
     JOIN "User" u ON u.id = s."userId"
     JOIN "Receipt" r ON r."paymentId" = p.id
     LEFT JOIN "Term" jt ON jt.id = s."joinedTermId"
     WHERE s."schoolId" = $1 AND p."academicYearId" = $2 AND p."termId" = $3
       AND r."termOutstandingBefore" = r."termOutstandingAfter"
     ORDER BY p."paymentDate" DESC
     LIMIT 10`,
    [schoolId, ay, t3]
  );
  console.log('\n=== SAMPLE BROKEN TERM3 (unchanged) ===');
  console.log(broken.rows);

  // Simulate adm 1170 with UUID filter vs name filter
  const studentId = 'ce3109cf-a54e-4ea5-bffc-08c4e41cddef';
  const pays = await client.query(
    `SELECT p.amount, p."termId", t.name AS term_name
     FROM "Payment" p
     LEFT JOIN "Term" t ON t.id = p."termId"
     WHERE p."studentId" = $1 AND p."academicYearId" = $2`,
    [studentId, ay]
  );
  const joinTermId = t1;
  const keptUuid = pays.rows.filter((p) => !(p.termId < joinTermId));
  const keptName = pays.rows.filter((p) => {
    const order = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };
    return (order[p.term_name] || 0) >= 1;
  });
  console.log('\n=== ADM 1170 FILTER SIMULATION ===');
  console.log({
    totalPayments: pays.rows.length,
    keptByUuidCompare: keptUuid.map((p) => ({
      term: p.term_name,
      amount: Number(p.amount),
    })),
    droppedByUuidCompare: pays.rows
      .filter((p) => p.termId < joinTermId)
      .map((p) => ({ term: p.term_name, amount: Number(p.amount) })),
    keptByTermNameOrder: keptName.map((p) => ({
      term: p.term_name,
      amount: Number(p.amount),
    })),
  });

  await client.end();
  console.log('\nDone (read-only).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
