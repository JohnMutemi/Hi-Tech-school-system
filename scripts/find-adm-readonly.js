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
    if (v.startsWith('DATABASE_URL=')) v = v.slice('DATABASE_URL='.length);
    return v;
  }
  return process.env.DATABASE_URL;
}

(async () => {
  const adm = process.argv[2] || '1170';
  const client = new Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const r = await client.query(
    `SELECT s."admissionNumber", u.name, sc.code, sc.name AS school_name,
            g.name AS grade_name, c.name AS class_name
     FROM "Student" s
     JOIN "User" u ON u.id = s."userId"
     JOIN "School" sc ON sc.id = s."schoolId"
     LEFT JOIN "Class" c ON c.id = s."classId"
     LEFT JOIN "Grade" g ON g.id = c."gradeId"
     WHERE s."admissionNumber" = $1`,
    [adm]
  );
  console.log('matches', r.rows.length);
  console.log(r.rows);
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
