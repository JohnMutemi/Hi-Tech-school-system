import { strict as assert } from 'node:assert';
import type { GradingModBand } from '@prisma/client';
import { GRADING_PRESETS } from '../config/gradingPresets';
import {
  assignCompetitionPositions,
  roundScore,
  scoreToBand,
} from './gradingEngine';
import { validateBandsContiguous } from './gradingScaleService';

function band(
  code: string,
  min: number,
  max: number,
  points: number
): GradingModBand {
  return {
    id: code,
    scaleId: 'scale-1',
    code,
    label: code,
    description: null,
    minScore: min,
    maxScore: max,
    points,
    colorHex: null,
    sortOrder: 1,
  };
}

const cbcUpperPrimary = [
  band('EE', 80, 100, 4),
  band('ME', 50, 79, 3),
  band('AE', 40, 49, 2),
  band('BE', 0, 39, 1),
];

function runGradingEngineTests() {
  assert.equal(scoreToBand(85, cbcUpperPrimary).code, 'EE');
  assert.equal(scoreToBand(80, cbcUpperPrimary).code, 'EE');
  assert.equal(scoreToBand(50, cbcUpperPrimary).code, 'ME');
  assert.equal(scoreToBand(0, cbcUpperPrimary).code, 'BE');

  const cbcJunior = [
    band('EE1', 90, 100, 8),
    band('EE2', 75, 89, 7),
    band('ME1', 65, 74, 6),
    band('ME2', 55, 64, 5),
    band('AE1', 45, 54, 4),
    band('AE2', 35, 44, 3),
    band('BE1', 25, 34, 2),
    band('BE2', 0, 24, 1),
  ];
  assert.equal(scoreToBand(90, cbcJunior).code, 'EE1');
  assert.equal(scoreToBand(24, cbcJunior).code, 'BE2');

  assert.equal(roundScore(66.666), 66.67);

  const ranked = assignCompetitionPositions([
    { studentId: 'a', totalPoints: 30 },
    { studentId: 'b', totalPoints: 30 },
    { studentId: 'c', totalPoints: 28 },
  ]);
  assert.equal(ranked[0].classPosition, 1);
  assert.equal(ranked[1].classPosition, 1);
  assert.equal(ranked[2].classPosition, 3);

  for (const preset of GRADING_PRESETS) {
    const error = validateBandsContiguous(
      preset.bands.map((band, index) => ({
        code: band.code,
        label: band.label,
        minScore: band.min,
        maxScore: band.max,
        points: band.points,
        colorHex: band.color,
        sortOrder: index + 1,
      }))
    );
    assert.equal(error, null, `${preset.presetKey} bands should be contiguous`);
  }
}

runGradingEngineTests();
