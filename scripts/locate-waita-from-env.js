/**
 * Read-only: summarize which .env DB we hit, then locate Waita + adm 1170.
 * Does not print credentials or mutate data.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function loadUrlFromFile(file) {
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, 'utf8');
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
    if (v.startsWith('DATABASE_URL=')) v = v.slice('DATABASE_URL='.length);
    return v;
  }
  return null;
}

function summarizeUrl(label, url) {
  if (!url) {
    console.log(label + ': (none)');
    return;
  }
  try {
    const normalized = url.replace(/^postgres(ql)?:/i, 'http:');
    const u = new URL(normalized);
    console.log(
      label +
        ': host=' +
        u.hostname +
        ' db=' +
        (u.pathname || '').replace(/^\//, '') +
        ' user=' +
        (u.username || '(none)') +
        ' sslmode=' +
        (u.searchParams.get('sslmode') || '(none)')
    );
  } catch (e) {
    console.log(label + ': parse_failed len=' + url.length + ' err=' + e.message);
  }
}

async function main() {
  const root = path.join(__dirname, '..');
  const envPath = path.join(root, '.env');
  const localPath = path.join(root, '.env.local');
  const prodPath = path.join(root, '.env.production');

  const fromEnv = loadUrlFromFile(envPath);
  const fromLocal = loadUrlFromFile(localPath);
  const fromProd = loadUrlFromFile(prodPath);

  console.log('=== ENV FILES ===');
  console.log('.env exists:', fs.existsSync(envPath));
  console.log('.env.local exists:', fs.existsSync(localPath));
  console.log('.env.production exists:', fs.existsSync(prodPath));
  summarizeUrl('.env DATABASE_URL', fromEnv);
  summarizeUrl('.env.local DATABASE_URL', fromLocal);
  summarizeUrl('.env.production DATABASE_URL', fromProd);

  // Prefer .env (same as diagnose scripts); note if local differs
  const url = fromEnv || fromLocal || process.env.DATABASE_URL;
  if (!url) {
    console.log('No DATABASE_URL available');
    process.exit(1);
  }
  if (fromEnv && fromLocal && fromEnv !== fromLocal) {
    console.log('NOTE: .env and .env.local DATABASE_URL differ');
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  try {
    const count = await client.query('SELECT COUNT(*)::int AS n FROM "School"');
    console.log('\n=== CONNECTED DB ===');
    console.log('school_count:', count.rows[0].n);

    const waita = await client.query(
      `SELECT id, code, name, email, "isActive"
       FROM "School"
       WHERE code ILIKE '%waita%'
          OR code ILIKE '%progressive%'
          OR name ILIKE '%waita%'
          OR name ILIKE '%progressive%'
       ORDER BY code`
    );
    console.log('waita_matches:', waita.rows.length);
    for (const row of waita.rows) {
      console.log({
        code: row.code,
        name: row.name,
        email: row.email,
        isActive: row.isActive,
        id: row.id,
      });
    }

    // Exact code from UI
    const exact = await client.query(
      `SELECT id, code, name FROM "School" WHERE lower(code) = lower($1)`,
      ['waitaprogressiveacademy']
    );
    console.log('\nexact waitaprogressiveacademy:', exact.rows);

    const adm = await client.query(
      `SELECT s."admissionNumber", u.name AS student_name, sc.code, sc.name AS school_name,
              g.name AS grade_name, c.name AS class_name, s.id AS student_id
       FROM "Student" s
       JOIN "User" u ON u.id = s."userId"
       JOIN "School" sc ON sc.id = s."schoolId"
       LEFT JOIN "Class" c ON c.id = s."classId"
       LEFT JOIN "Grade" g ON g.id = c."gradeId"
       WHERE s."admissionNumber" = $1`,
      ['1170']
    );
    console.log('\nadm_1170_matches:', adm.rows.length);
    console.log(adm.rows);

    if (exact.rows[0]) {
      const schoolId = exact.rows[0].id;
      const students = await client.query(
        `SELECT COUNT(*)::int AS n FROM "Student" WHERE "schoolId" = $1 AND "isActive" = true`,
        [schoolId]
      );
      const payments = await client.query(
        `SELECT COUNT(*)::int AS n
         FROM "Payment" p
         JOIN "Student" s ON s.id = p."studentId"
         WHERE s."schoolId" = $1`,
        [schoolId]
      );
      const fees = await client.query(
        `SELECT COUNT(*)::int AS n FROM "TermlyFeeStructure" WHERE "schoolId" = $1`,
        [schoolId]
      );
      console.log('\n=== WAITA TENANT COUNTS (read-only) ===');
      console.log({
        activeStudents: students.rows[0].n,
        payments: payments.rows[0].n,
        feeStructures: fees.rows[0].n,
      });
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
