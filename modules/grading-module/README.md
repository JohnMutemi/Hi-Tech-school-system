# Grading Module (Independent)

CBC/CBE-aware academic grading module, built in parallel to the legacy MVP grading (`GradingCriteria`, `Assessment`, `StudentScore`) and isolated from the finance module.

## Isolation strategy

| Concern | Approach |
|---------|----------|
| Database | All tables prefixed `grading_mod_*` via Prisma `@@map` |
| API namespace | `/api/grading/[schoolCode]/...` (not `/api/schools/.../grading/`) |
| Package gate | `lib/grading-package-gate.ts` — allows `full` and `grading_only` |
| Student roster | `GradingModClass.legacyClassId` links to existing `Class` for testing without duplicating students |
| Legacy grading | Untouched — teacher portal routes under `/api/schools/.../teacher/grading/` remain as-is |

## Layout

```
modules/grading-module/
  config/gradingPresets.ts     # CBC + 8-4-4 built-in definitions
  domain/types.ts
  services/
    gradingEngine.ts           # score → band → weighted results → rankings
    gradingScaleService.ts     # CRUD + clone + presets
app/api/grading/[schoolCode]/  # Independent API routes
lib/grading-package-gate.ts
```

## Setup

```bash
# Apply migration (creates grading_mod_* tables only)
npx prisma migrate deploy

# Regenerate client
npx prisma generate

# Seed system presets (cloneable by schools)
pnpm seed:grading-presets
```

## Test without impacting finance or legacy grading

### 1. Unit tests (no database)

```bash
npx tsx modules/grading-module/services/gradingEngine.test.ts
```

### 2. Health check (read-only)

```bash
curl http://localhost:3000/api/grading/YOUR_SCHOOL_CODE/health
```

Expected: `{ "module": "grading", "status": "ok", "legacyGradingUntouched": true }`

### 3. API smoke test (authenticated admin)

1. Log in to school admin portal (existing auth).
2. `GET /api/grading/{schoolCode}/grading-scales/presets` — lists CBC presets.
3. `POST /api/grading/{schoolCode}/grading-scales/{presetId}/clone` — clones a system preset for your school.
4. Create module academic structure (year, term, subject, class with `legacyClassId`).
5. Enter scores via future score-entry endpoints.
6. `POST /api/grading/{schoolCode}/compute/class/{classId}/term/{termId}` — runs engine.

Finance routes (`/api/finance/...`, `/api/schools/.../payments`) are never called.

## Presets shipped

- `CBC_UPPER_PRIMARY` — EE/ME/AE/BE (4-band)
- `CBC_JUNIOR_SECONDARY` — 8-point KNEC scale
- `LEGACY_844` — A–E letter grades

Thresholds are stored in `grading_mod_bands`, never hardcoded in business logic.

## Deliverables (implemented)

| Feature | API | UI |
|---------|-----|-----|
| Score entry | `GET/POST .../assessments`, `GET/POST .../assessments/[id]/scores` | `components/grading/ScoreEntrySheet.tsx` |
| Report cards | `.../reports/preview`, `.../reports/generate`, `.../reports/[id]/pdf` | `components/grading/ReportCardViewer.tsx` |
| Rankings + Excel | `.../rankings/...`, `.../compute/...`, `.../exports/rankings|marksheet/...` | `components/grading/ClassRankingDashboard.tsx` |
| Standalone portal | `app/api/schools/[schoolCode]/grading/{login,session,logout,...}` | `app/schools/[schoolCode]/grading/` |

Portal auth mirrors the finance module: dedicated cookie (`grading-session`), forgot/reset password, and first-login password change for `grading_only` schools.

## School packages (superadmin)

| Package | Login |
|---------|-------|
| `full` | `/schools/{code}` — full admin portal |
| `finance_only` | `/schools/{code}/finance/login` — Finance Workspace |
| `grading_only` | `/schools/{code}/grading/login` — Academics & Grading Workspace |
| `finance_grading` | `/schools/{code}/modules` — module picker with both login shells |

Package logic lives in `lib/school-package.ts` and `lib/staff-portal-path.ts`.
