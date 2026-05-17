# Custom domains for school public websites

Each school can serve its public marketing site on its own domain (e.g. `www.bridgeacademy.ac.ke`) instead of only `/site/{schoolCode}` on the platform host.

## Environment variables

Add to `.env` (production and local):

```env
# Canonical platform URL (no trailing slash)
PLATFORM_URL=https://your-app.vercel.app
NEXT_PUBLIC_PLATFORM_URL=https://your-app.vercel.app

# Comma-separated hosts that are NOT school custom domains
PLATFORM_HOSTS=localhost,127.0.0.1,your-app.vercel.app

# DNS instructions shown in admin UI (usually same as PLATFORM_URL hostname)
PLATFORM_CNAME_TARGET=your-app.vercel.app

# Secret for middleware → internal domain lookup (generate a random string)
DOMAIN_LOOKUP_SECRET=change-me-to-a-long-random-string
```

## Configure a school domain

1. **Superadmin / school admin / finance bursar** → **Public Website** → **Custom domain**
2. Enter hostname only: `www.yourschool.ac.ke` (no `https://`)
3. Save

## DNS (registrar)

| Record | Name | Value |
|--------|------|--------|
| CNAME | `www` | `PLATFORM_CNAME_TARGET` (e.g. `cname.vercel-dns.com` or your Vercel app hostname) |
| A / ALIAS | `@` | Per your host (Vercel apex domain docs) |

Also add the domain in **Vercel** (or your host) → **Settings → Domains** so TLS/SSL is provisioned.

## Behaviour

| Request | Result |
|---------|--------|
| `https://www.school.ac.ke/` | School public website (rewritten to `/site/{code}` internally) |
| `https://www.school.ac.ke/schools/...` | Redirect to `PLATFORM_URL/schools/...` (staff portal stays on platform) |
| `https://platform.app/site/demo` | Path-based public site (unchanged) |

**Staff login** on the public site always links to `PLATFORM_URL` — private dashboards are never served on the custom domain.

## Local testing

1. Add to `C:\Windows\System32\drivers\etc\hosts` (or `/etc/hosts`):
   ```
   127.0.0.1 www.test-school.local
   ```
2. Set school's custom domain to `test-school.local` in the admin UI
3. Set `PLATFORM_HOSTS=localhost,127.0.0.1,test-school.local` — wait, test-school.local should NOT be in platform hosts
4. Visit `http://www.test-school.local:3000` (middleware uses `DOMAIN_LOOKUP_SECRET` + `PLATFORM_URL=http://localhost:3000`)

## Troubleshooting

- **Domain shows platform home, not school site** — DNS not pointing to your app, or domain not added in Vercel
- **404 on custom domain** — `customDomain` not saved, school inactive, or `DOMAIN_LOOKUP_SECRET` missing/wrong
- **SSL errors** — wait for certificate provisioning after adding domain in Vercel
