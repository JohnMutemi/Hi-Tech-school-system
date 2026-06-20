import { prisma } from '@/lib/prisma';
import { GRADING_PRESETS, getPresetByKey } from '../config/gradingPresets';
import type { GradingBandInput } from '../domain/types';

export function validateBandsContiguous(bands: GradingBandInput[]): string | null {
  if (bands.length === 0) return 'At least one band is required';

  const sorted = [...bands].sort((a, b) => a.minScore - b.minScore);
  if (sorted[0].minScore !== 0) {
    return 'Bands must start at 0%';
  }
  if (sorted[sorted.length - 1].maxScore !== 100) {
    return 'Bands must end at 100%';
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i];
    const next = sorted[i + 1];
    const gap = next.minScore - current.maxScore;
    // Adjacent integer bands (e.g. 0–24 then 25–34) have gap === 1 — valid for presets.
    if (gap > 1.0001) {
      return `Gap between ${current.code} and ${next.code}`;
    }
    if (gap < -0.01) {
      return `Overlap between ${current.code} and ${next.code}`;
    }
  }

  return null;
}

export async function listScalesForSchool(schoolId: string) {
  return prisma.gradingModScale.findMany({
    where: { schoolId },
    include: { bands: { orderBy: { sortOrder: 'asc' } } },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getScaleById(scaleId: string, schoolId: string) {
  return prisma.gradingModScale.findFirst({
    where: { id: scaleId, schoolId },
    include: { bands: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function listSystemPresets() {
  return prisma.gradingModScale.findMany({
    where: { isSystemPreset: true },
    include: { bands: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { presetKey: 'asc' },
  });
}

export async function createScale(
  schoolId: string,
  data: {
    name: string;
    curriculum: string;
    level: string;
    isDefault?: boolean;
    createdBy?: string;
    bands: GradingBandInput[];
  }
) {
  const bandError = validateBandsContiguous(data.bands);
  if (bandError) {
    throw new Error(bandError);
  }

  if (data.isDefault) {
    await prisma.gradingModScale.updateMany({
      where: { schoolId, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.gradingModScale.create({
    data: {
      schoolId,
      name: data.name,
      curriculum: data.curriculum,
      level: data.level,
      isDefault: Boolean(data.isDefault),
      createdBy: data.createdBy,
      bands: {
        create: data.bands.map((band, index) => ({
          code: band.code,
          label: band.label,
          description: band.description ?? null,
          minScore: band.minScore,
          maxScore: band.maxScore,
          points: band.points ?? null,
          colorHex: band.colorHex ?? null,
          sortOrder: band.sortOrder ?? index + 1,
        })),
      },
    },
    include: { bands: { orderBy: { sortOrder: 'asc' } } },
  });
}

export async function updateScale(
  scaleId: string,
  schoolId: string,
  data: {
    name?: string;
    curriculum?: string;
    level?: string;
    isDefault?: boolean;
    bands?: GradingBandInput[];
  }
) {
  const existing = await prisma.gradingModScale.findFirst({
    where: { id: scaleId, schoolId },
    include: { classes: true },
  });

  if (!existing) {
    throw new Error('Grading scale not found');
  }

  if (data.bands) {
    const bandError = validateBandsContiguous(data.bands);
    if (bandError) {
      throw new Error(bandError);
    }
  }

  if (data.isDefault) {
    await prisma.gradingModScale.updateMany({
      where: { schoolId, isDefault: true, id: { not: scaleId } },
      data: { isDefault: false },
    });
  }

  return prisma.$transaction(async (tx) => {
    if (data.bands) {
      await tx.gradingModBand.deleteMany({ where: { scaleId } });
      await tx.gradingModBand.createMany({
        data: data.bands.map((band, index) => ({
          scaleId,
          code: band.code,
          label: band.label,
          description: band.description ?? null,
          minScore: band.minScore,
          maxScore: band.maxScore,
          points: band.points ?? null,
          colorHex: band.colorHex ?? null,
          sortOrder: band.sortOrder ?? index + 1,
        })),
      });
    }

    return tx.gradingModScale.update({
      where: { id: scaleId },
      data: {
        name: data.name,
        curriculum: data.curriculum,
        level: data.level,
        isDefault: data.isDefault,
      },
      include: { bands: { orderBy: { sortOrder: 'asc' } } },
    });
  });
}

export async function deleteScale(scaleId: string, schoolId: string) {
  const existing = await prisma.gradingModScale.findFirst({
    where: { id: scaleId, schoolId },
    include: {
      classes: { select: { id: true } },
      bands: {
        select: {
          id: true,
          scores: { select: { id: true }, take: 1 },
        },
      },
    },
  });

  if (!existing) {
    throw new Error('Grading scale not found');
  }

  if (existing.classes.length > 0) {
    throw new Error('Cannot delete scale referenced by classes');
  }

  const hasScores = existing.bands.some((band) => band.scores.length > 0);
  if (hasScores) {
    throw new Error('Cannot delete scale referenced by scores');
  }

  await prisma.gradingModScale.delete({ where: { id: scaleId } });
}

export async function cloneScale(
  scaleId: string,
  schoolId: string,
  createdBy?: string,
  overrides?: { name?: string; isDefault?: boolean }
) {
  const source = await prisma.gradingModScale.findFirst({
    where: {
      OR: [
        { id: scaleId, schoolId },
        { id: scaleId, isSystemPreset: true },
      ],
    },
    include: { bands: { orderBy: { sortOrder: 'asc' } } },
  });

  if (!source) {
    throw new Error('Source grading scale not found');
  }

  return createScale(schoolId, {
    name: overrides?.name ?? `${source.name} (Copy)`,
    curriculum: source.curriculum,
    level: source.level,
    isDefault: overrides?.isDefault,
    createdBy,
    bands: source.bands.map((band) => ({
      code: band.code,
      label: band.label,
      description: band.description,
      minScore: band.minScore,
      maxScore: band.maxScore,
      points: band.points,
      colorHex: band.colorHex,
      sortOrder: band.sortOrder,
    })),
  });
}

export async function setDefaultScale(scaleId: string, schoolId: string) {
  const scale = await prisma.gradingModScale.findFirst({
    where: { id: scaleId, schoolId },
  });
  if (!scale) {
    throw new Error('Grading scale not found');
  }

  await prisma.$transaction([
    prisma.gradingModScale.updateMany({
      where: { schoolId, isDefault: true },
      data: { isDefault: false },
    }),
    prisma.gradingModScale.update({
      where: { id: scaleId },
      data: { isDefault: true },
    }),
  ]);

  return getScaleById(scaleId, schoolId);
}

export async function seedSystemPresets() {
  for (const preset of GRADING_PRESETS) {
    const existing = await prisma.gradingModScale.findFirst({
      where: { isSystemPreset: true, presetKey: preset.presetKey },
    });

    if (existing) {
      continue;
    }

    await prisma.gradingModScale.create({
      data: {
        schoolId: null,
        name: preset.name,
        curriculum: preset.curriculum,
        level: preset.level,
        isSystemPreset: true,
        presetKey: preset.presetKey,
        bands: {
          create: preset.bands.map((band, index) => ({
            code: band.code,
            label: band.label,
            minScore: band.min,
            maxScore: band.max,
            points: band.points,
            colorHex: band.color,
            sortOrder: index + 1,
          })),
        },
      },
    });
  }
}

export function getPresetDefinitions() {
  return GRADING_PRESETS.map((preset) => ({
    presetKey: preset.presetKey,
    name: preset.name,
    curriculum: preset.curriculum,
    level: preset.level,
    bandCount: preset.bands.length,
    bands: preset.bands,
  }));
}

export function getPresetDefinition(presetKey: string) {
  const preset = getPresetByKey(presetKey);
  if (!preset) return null;
  return {
    presetKey: preset.presetKey,
    name: preset.name,
    curriculum: preset.curriculum,
    level: preset.level,
    bands: preset.bands,
  };
}

export async function clonePresetByKey(
  presetKey: string,
  schoolId: string,
  createdBy?: string,
  overrides?: { name?: string; isDefault?: boolean }
) {
  const seeded = await prisma.gradingModScale.findFirst({
    where: { isSystemPreset: true, presetKey },
    include: { bands: { orderBy: { sortOrder: 'asc' } } },
  });
  if (seeded) {
    return cloneScale(seeded.id, schoolId, createdBy, overrides);
  }

  const preset = getPresetByKey(presetKey);
  if (!preset) {
    throw new Error('Preset not found');
  }

  return createScale(schoolId, {
    name: overrides?.name ?? preset.name,
    curriculum: preset.curriculum,
    level: preset.level,
    isDefault: overrides?.isDefault,
    createdBy,
    bands: preset.bands.map((band, index) => ({
      code: band.code,
      label: band.label,
      minScore: band.min,
      maxScore: band.max,
      points: band.points,
      colorHex: band.color,
      sortOrder: index + 1,
    })),
  });
}

/** UI-ready preset list: DB seeded rows first, then code definitions without DB rows. */
export async function listCloneablePresets() {
  const [seeded, definitions] = await Promise.all([
    listSystemPresets(),
    Promise.resolve(getPresetDefinitions()),
  ]);

  const seededKeys = new Set(
    seeded.map((row) => row.presetKey).filter((key): key is string => Boolean(key))
  );

  const virtualPresets = definitions
    .filter((def) => !seededKeys.has(def.presetKey))
    .map((def) => ({
      id: `preset:${def.presetKey}`,
      presetKey: def.presetKey,
      name: def.name,
      curriculum: def.curriculum,
      level: def.level,
      isSystemPreset: true,
      isVirtual: true,
      bands: def.bands.map((band, index) => ({
        code: band.code,
        label: band.label,
        minScore: band.min,
        maxScore: band.max,
        points: band.points,
        colorHex: band.color,
        sortOrder: index + 1,
      })),
    }));

  return [...seeded, ...virtualPresets];
}
