# School Public Website — Technical Specification

## Overview

Per-school **public marketing websites** (inspired by [UoN](https://www.uonbi.ac.ke/), [KU](https://www.ku.ac.ke/), [Kabianga](https://www.kabianga.ac.ke/)) sit alongside existing **private portals** (`/schools/{code}`). Staff routes are never advertised on the public site; only a discrete **Staff login** link routes to the correct portal based on `packageType`.

## Goals

| Goal | Description |
|------|-------------|
| Public site | Hero, about, programmes, admissions, contact — per school |
| Templates | 4 layout personalities selectable at school creation |
| Palettes | Predefined color sets → `School.colorTheme` + dashboard cascade |
| Seeding | Default section content per template on school create |
| Content editor | School admin edits sections without rebuilding layout |
| Package awareness | `full` → admin portal; `finance_only` → finance login |
| Profile persistence | Motto, principal, description, etc. stored on `School` |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Platform (/)          Hi-Tech product marketing            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Public site (/site/{code})   No auth, template + sections  │
│  Staff login → /schools/{code} or /schools/{code}/finance   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Private portal (/schools/{code}/…)   JWT / session auth  │
│  full: admin tabs | finance_only: finance module only       │
└─────────────────────────────────────────────────────────────┘
```

## Data model

### `School` (extended fields)

| Field | Type | Purpose |
|-------|------|---------|
| `motto` | `String?` | Tagline |
| `principalName` | `String?` | Leadership |
| `establishedYear` | `Int?` | Founded year |
| `description` | `String?` | About summary |
| `websiteUrl` | `String?` | Optional external URL |
| `websiteTemplateSlug` | `String` | `classic` \| `modern` \| `compact` \| `minimal` |
| `colorPaletteSlug` | `String?` | Palette id → primary hex |
| `publicWebsiteEnabled` | `Boolean` | Toggle public site |

### `SchoolWebsiteSection`

| Field | Type | Purpose |
|-------|------|---------|
| `schoolId` | FK | Owner |
| `sectionKey` | `String` | `hero`, `about`, `programmes`, `admissions`, `news`, `contact` |
| `title` | `String?` | Section heading |
| `content` | `Json` | Structured blocks (headline, body, bullets, CTAs) |
| `isVisible` | `Boolean` | Show/hide on public site |
| `sortOrder` | `Int` | Order within template |

Unique: `(schoolId, sectionKey)`.

### Code-defined catalogs (no DB)

- `lib/school-website/templates.ts` — template metadata + preview hints
- `lib/school-website/palettes.ts` — named palettes (primary hex)
- `lib/school-website/default-sections.ts` — seed content per template

## Templates

| Slug | Inspiration | Layout traits |
|------|-------------|---------------|
| `classic` | UoN | Top nav, wide hero, news strip, multi-column footer |
| `modern` | KU | Full-bleed hero, card grid, strong CTAs |
| `compact` | Mid-size college | Dense header, sidebar-friendly sections |
| `minimal` | Kabianga | Simple nav, admissions + contact focus |

All templates render the **same section keys**; only layout/components differ.

## Color palettes

| Slug | Name | Primary |
|------|------|---------|
| `ocean` | Ocean Teal | `#0d9488` |
| `amber` | Amber Gold | `#d97706` |
| `royal` | Royal Blue | `#1d4ed8` |
| `forest` | Forest Green | `#15803d` |
| `crimson` | Crimson | `#b91c1c` |
| `slate` | Slate Professional | `#475569` |

Selected palette sets `School.colorTheme` at create/update; `getSchoolThemeTokens()` applies to portal + public CSS variables.

## Routes

| Route | Auth | Purpose |
|-------|------|---------|
| `GET /site/[schoolCode]` | Public | Render school website |
| `GET /api/site/[schoolCode]` | Public | JSON payload for site |
| `GET /api/website/templates` | Public | Template catalog |
| `GET /api/website/palettes` | Public | Palette catalog |
| `GET /api/schools/[code]/website` | Admin | Sections + settings |
| `PUT /api/schools/[code]/website` | Admin | Update sections/settings |

## School creation flow

1. Superadmin fills basic/contact/details.
2. **Branding tab:** pick template (with live preview), palette dropdown, logo, color override optional.
3. `POST /api/schools` persists fields + runs `SchoolWebsiteSeedingService`.
4. Response includes `publicSiteUrl`: `/site/{code}`.

## Admin content editor

- New sidebar tab: **Public Website** (`website`).
- Edit section titles, body text, bullet lists, visibility.
- Link to open live public site.
- Uses `PUT /api/schools/[code]/website` with `requireSchoolAccess`.

## Private route isolation

Public layout **must not** import portal sidebar or expose:

- Student/staff management URLs
- API keys or admin paths in HTML

Staff login href:

- `packageType === 'finance_only'` → `/schools/{code}/finance/login`
- else → `/schools/{code}`

## PR breakdown (implementation order)

### PR 1 — Foundation
- Prisma migration + `SchoolWebsiteSection`
- `lib/school-website/*` catalogs and types
- `SchoolWebsiteSeedingService`
- Seed script hook in `prisma/seed.ts` (catalog docs only)

### PR 2 — APIs & persistence
- Extend `POST/GET` school APIs with profile + website fields
- Public `GET /api/site/[schoolCode]`
- Admin website `GET/PUT`
- Allow `school_admin` on school `PUT` for profile/branding

### PR 3 — Public UI
- `app/site/[schoolCode]/` layout + page
- Four template components + shared sections
- CSS variables from `colorTheme`

### PR 4 — Superadmin UX
- Template picker + preview in `add-school-form.tsx`
- Palette select; pass `websiteTemplateSlug`, `colorPaletteSlug` on create

### PR 5 — School admin UX
- `WebsiteContentSection` + sidebar tab
- Wire `school-setup-dashboard`

### PR 6 — Hardening
- Delete cascade for `SchoolWebsiteSection`
- `publicWebsiteEnabled` guard on public routes
- Update GET list/transform for superadmin schools table

## Section content schema (JSON)

```typescript
type SectionContent = {
  headline?: string;
  subheadline?: string;
  body?: string;
  bullets?: string[];
  ctaLabel?: string;
  ctaHref?: string;
  imageAlt?: string;
  items?: { title: string; description?: string }[];
};
```

## Implemented enhancements (follow-up)

- **Richer editor:** Programme and news cards (add/edit/remove); hero/admissions CTAs; bullets on about/admissions/contact.
- **Finance-only schools:** Bursar/finance portal includes **Public Website** tab (`showWebsiteEditor` when `mode === 'finance'`).
- **API guard:** `requireWebsiteEditorAccess` — roles: `super_admin`, `school_admin`, `bursar`.

## Custom domains

See [CUSTOM_DOMAINS.md](./CUSTOM_DOMAINS.md) for DNS, env vars, and `School.customDomain`.

## Future (out of scope)
- CMS media library / page builder
- Blog with DB posts
- Multi-language

## Testing checklist

- [ ] Create school with each template → sections seeded
- [ ] Public site loads at `/site/{code}`
- [ ] Palette changes dashboard accent
- [ ] `finance_only` staff login → finance login
- [ ] `full` staff login → admin portal
- [ ] Admin can edit sections; changes reflect publicly
- [ ] `publicWebsiteEnabled=false` → 404 or disabled message
- [ ] School delete removes website sections
