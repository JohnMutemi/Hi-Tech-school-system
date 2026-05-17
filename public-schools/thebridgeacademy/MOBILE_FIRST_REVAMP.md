# The Bridge Academy — Mobile-First Responsive Revamp

## Goal

Most visitors use phones. The site is rebuilt **mobile-first**: base styles target small screens; `sm:`, `md:`, and `lg:` layers add space and layout only when there is room.

## Design system

| Token | Mobile (default) | Tablet (`sm`+) | Desktop (`lg`+) |
|-------|------------------|----------------|-----------------|
| Section padding | `py-14` | `py-20` | `py-28` |
| Horizontal gutter | `px-4` | `px-6` | `px-8` |
| Display heading | `text-3xl` | `text-4xl` | `text-5xl` |
| Body / lead | `text-base` | `text-lg` | — |
| Touch target | min `44×44px` | — | — |
| Container max | `max-w-6xl` centered | — | — |

### Shared primitives (`src/components/site/layout.tsx`)

- **SiteContainer** — consistent horizontal padding and max width
- **SiteSection** — vertical rhythm + optional background
- **SectionHeader** — eyebrow, title, optional lead (centered or left)
- **SiteButton** — primary / secondary / ghost with full-width-on-mobile option

### Global CSS (`src/styles.css`)

- `scroll-padding-top` for fixed navbar anchor links
- `safe-area` padding for notched phones (fixed WhatsApp / scroll-top)
- `prefers-reduced-motion` slows or disables marquees
- Refined shadows, focus rings, and tap highlight

## Section checklist

| Section | Mobile priorities | Status |
|---------|-------------------|--------|
| **Navbar** | Compact header, full-screen drawer, body scroll lock, 44px taps | Done |
| **Hero** | `100dvh`, stacked CTAs, readable type, nav offset | Done |
| **About** | Single column cards, 2-col stats grid | Done |
| **Stats** | 2×2 grid, smaller counters | Done |
| **Values** | 1 column → 2 → 3 | Done |
| **Admissions** | Stacked layout, full-width buttons | Done |
| **News** | Single column cards, local images | Done |
| **Gallery** | Narrower marquee tiles, reduced motion | Done |
| **Testimonials** | Stacked quotes | Done |
| **Contact** | Map first, tap-friendly cards | Done |
| **Footer** | Stacked columns, readable links | Done |
| **WhatsApp / ScrollTop** | Safe areas, no overlap | Done |

## Files touched

- `src/styles.css` — design tokens, layout utilities, safe areas, reduced motion
- `src/components/site/layout.tsx` — `SiteContainer`, `SiteSection`, `SectionHeader`, `SiteButton`
- All section components under `src/components/site/`
- This document

## Implementation notes

- **Touch targets:** buttons and nav links use `min-h-11` (44px) where possible.
- **Hero:** `min-h-[100dvh]`, full-width CTAs on small screens, compact headline scale.
- **Gallery:** narrower cards on mobile; slower marquee animation under 640px.
- **Floating UI:** WhatsApp bottom-right; scroll-to-top sits above it on mobile (`bottom-[5.5rem]`).
- **Staff login dialog:** `w-[calc(100vw-2rem)]` on phones so it does not clip.

## Testing

1. Chrome DevTools → iPhone SE / 12 Pro / Pixel 5
2. Real device on `http://localhost:8080`
3. Check: menu, anchor scroll, form PDF link, WhatsApp, horizontal scroll (none except gallery marquee)

## Run locally

```bash
# Terminal 1 — platform (finance login proxy target)
cd Hi-Tech-school-system && npm run dev

# Terminal 2 — marketing site
cd Hi-Tech-school-system/public-schools && npm run dev
```

Open **http://localhost:8080**
