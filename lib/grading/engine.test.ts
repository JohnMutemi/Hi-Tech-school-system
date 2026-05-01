import { strict as assert } from "node:assert";
import { computeAutoGrade, resolveGradeBand } from "@/lib/grading/engine";
import { DEFAULT_SCALE_BANDS } from "@/lib/grading/defaults";

function runEngineTests() {
  const topBand = resolveGradeBand(85, DEFAULT_SCALE_BANDS);
  assert.equal(topBand?.letter, "A");

  const midBand = resolveGradeBand(62, DEFAULT_SCALE_BANDS);
  assert.equal(midBand?.letter, "C");

  const lowBand = resolveGradeBand(20, DEFAULT_SCALE_BANDS);
  assert.equal(lowBand?.letter, "F");

  const computed = computeAutoGrade({
    totalWeightedScore: 1.62,
    totalWeight: 2,
    criteria: {
      passMark: 50,
      scaleBands: DEFAULT_SCALE_BANDS,
    },
  });
  assert.equal(computed.percentage, 81);
  assert.equal(computed.letterGrade, "A");
  assert.equal(computed.passStatus, true);
}

runEngineTests();
