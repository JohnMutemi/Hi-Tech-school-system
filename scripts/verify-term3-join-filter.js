/**
 * Unit checks for Term 3 join-filter fix (no DB).
 * Run: node scripts/verify-term3-join-filter.js
 */
const assert = require('assert');

// Mirror of lib/fees/fee-structure-resolve.ts helpers (CJS-friendly)
const TERM_ORDER = { 'Term 1': 1, 'Term 2': 2, 'Term 3': 3 };

function termOrderIndex(termName) {
  return TERM_ORDER[String(termName ?? '').trim()] || 0;
}

function paymentIsOnOrAfterJoinTerm(payment, join) {
  if (!payment.academicYearId || !payment.termId) return false;
  if (payment.academicYearId < join.academicYearId) return false;
  if (payment.academicYearId !== join.academicYearId) return true;
  if (payment.termId === join.termId) return true;

  const joinOrd = termOrderIndex(join.termName);
  const payOrd = termOrderIndex(payment.termName ?? payment.term?.name);
  if (joinOrd > 0 && payOrd > 0) return payOrd >= joinOrd;
  return true; // fail open — never UUID `<`
}

// Waita Progressive Academy 2026 real ids
const AY = 'c0b30ec7-7eca-4784-b49b-cb14798b2cce';
const T1 = '1cad1ac1-5ef3-4c3f-a9e9-0dfdf671a828';
const T2 = 'e1495989-bbea-4193-9831-1252857a8244';
const T3 = '0cf94a66-6679-4cb0-a17a-05601eac0101';

assert.strictEqual(T3 < T1, true, 'precondition: Term3 UUID sorts before Term1');

const join = { academicYearId: AY, termId: T1, termName: 'Term 1' };

// Old buggy UUID filter would DROP Term 3
assert.strictEqual(T3 < T1, true);

// Fixed filter MUST keep Term 3 (adm 1170 case)
assert.strictEqual(
  paymentIsOnOrAfterJoinTerm(
    { academicYearId: AY, termId: T3, termName: 'Term 3' },
    join
  ),
  true,
  'Term 3 payment must be kept for Term 1 joiners'
);

assert.strictEqual(
  paymentIsOnOrAfterJoinTerm(
    { academicYearId: AY, termId: T2, termName: 'Term 2' },
    join
  ),
  true,
  'Term 2 payment must be kept'
);

assert.strictEqual(
  paymentIsOnOrAfterJoinTerm(
    { academicYearId: AY, termId: T1, termName: 'Term 1' },
    join
  ),
  true,
  'Term 1 payment must be kept'
);

// Simulate receipt before/after for fee-clean Term 3 pay of 4000 on 4000 fee
function simulateTerm3Pay({ fee = 4000, paidPrior = 0, pay = 4000, joinTerm = 'Term 1' }) {
  const kept = paymentIsOnOrAfterJoinTerm(
    { academicYearId: AY, termId: T3, termName: 'Term 3' },
    { academicYearId: AY, termId: T1, termName: joinTerm }
  );
  const before = Math.max(0, fee - paidPrior);
  const after = kept ? Math.max(0, before - pay) : before;
  return { kept, before, after };
}

const scenario = simulateTerm3Pay({});
assert.strictEqual(scenario.before, 4000);
assert.strictEqual(scenario.after, 0, 'fee-clean Term 3 full pay must clear balance');
assert.strictEqual(scenario.kept, true);

const partial = simulateTerm3Pay({ fee: 4500, pay: 4000 });
assert.strictEqual(partial.after, 500, 'partial Term 3 pay leaves remainder');

console.log('OK: Term 3 join-filter behaves like Term 1/2 for Waita UUID ordering');
console.log('  fee-clean 4000→0:', scenario);
console.log('  partial 4500-4000→500:', partial);
