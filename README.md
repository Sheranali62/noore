# NOORE — 7-Phase Production Master Hardening

This patch targets the current NOORE build after the existing premium storefront/admin work. It does not seed, delete, or modify product/customer/order data.

## Applied across the 7 phases
- Storefront resilience: global loading, error and 404 states.
- UX/accessibility: skip link, visible focus states, reduced-motion support and touch polish.
- Responsive search shortcut: Ctrl K on Windows/Linux, Command K on Apple devices.
- SEO: canonical metadata and dynamic robots route using `NEXT_PUBLIC_SITE_URL`.
- Sitemap resilience when the database is temporarily unavailable.
- Valid site web manifest matching the declared metadata manifest.
- Read-only `/api/health` endpoint for deployment/database checks; no secrets are returned.
- Public layout exposes the skip-link target.
- COD-only checkout behavior remains enforced.

## Apply
Copy the included `src` and `public` files over the matching files in your repository.
Delete the old `public/robots.txt` if it exists, because `src/app/robots.ts` is now the canonical dynamic robots route.

Do NOT replace `.env`, `.env.local`, `.env.production`, Prisma data, or existing catalog data.

## Verify
npm run build

Then open:
https://YOUR-DOMAIN/api/health

Healthy response should contain `"ok":true` and `"database":"connected"`.
