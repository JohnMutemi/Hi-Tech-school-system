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
  const client = new Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const all = await client.query(
    'SELECT code, name FROM "School" ORDER BY code'
  );
  console.log('school_count', all.rows.length);
  for (const row of all.rows) {
    console.log(`${row.code} | ${row.name}`);
  }
  const hit = await client.query(
    `SELECT code, name FROM "School"
     WHERE code ILIKE '%waita%'
        OR code ILIKE '%progressive%'
        OR code ILIKE '%showcase%'
        OR name ILIKE '%waita%'
        OR name ILIKE '%progressive%'`
  );
  console.log('---filtered---');
  console.log(hit.rows);
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
