# NOORÉ Security Stabilization Plan

**Working branch:** `security/stabilization-2026-11-25`  
**Baseline:** `main` at `3c4f88c3fb0c4d91992f857f4703a8f7099784c7`  
**Production changes:** None. This branch is isolated from production.

## Non-negotiable data-safety rules

- Do not run `prisma db push`, destructive SQL, reset, truncate, or unreviewed migrations against production.
- Do not change the production database provider or connection strings until the actual live data source is verified.
- Take and verify a restorable backup before any schema or data migration.
- Keep existing customer accounts, products, orders, addresses, inventory, and payment history.
- Test changes in an isolated preview environment first; promote only the exact tested build after approval.

## Initial findings from repository and connected infrastructure review

1. The repository's `package.json` pins Next.js at `14.1.0`; this is an old release and must be upgraded to a currently supported, security-patched version after compatibility checks.
2. Prisma schema uses PostgreSQL and reads `DATABASE_URL`. The project includes Neon driver-adapter dependencies and Neon migration workflows, while the connected Supabase project is active. The authoritative production database and each environment's actual database target must be reconciled before migration.
3. The inspected Supabase `public` tables have RLS enabled, but the policy catalog query returned zero policies. The inspected table grants include broad CRUD privileges for `anon` and `authenticated`. With no policies, RLS is default-deny for Data API row access; grants should nevertheless be narrowed to least privilege and policies added only after mapping actual app access.
4. Authentication uses Supabase password verification followed by a NextAuth JWT and a Prisma user record. The initial branch patch now re-reads the canonical Prisma role on each server-side session resolution, limits sessions to four hours, and makes the configured Super Admin email a bootstrap-only rule for newly created app users rather than re-promoting an existing account at every login. This still requires build and regression testing.
5. Admin APIs use a shared `requireAdmin` helper in inspected routes. Continue auditing every route and each HTTP method for role scope, object ownership, input validation, and rate limiting.
6. Existing Next.js headers include nosniff, frame, referrer, permissions policy and HSTS. CSP, cookie/session hardening, CSRF/origin protections and upload validation still need route-aware review.
7. GitHub `main` currently reports branch protection disabled. Configure required reviews/checks and restrict production releases after confirming repository administration permissions.
8. Supabase Security Advisor reports 30 public tables with RLS enabled but no policies, plus leaked-password protection disabled. With no Supabase JS client found in the repository, the web app appears to use Prisma for application data and Supabase Auth for credential verification; confirm no external Data API consumer before revoking broad `anon`/`authenticated` table grants. Enable leaked-password protection in Supabase Auth settings after confirming the supported setting and impact.

## Implementation sequence

### Gate 0 — Inventory and safety baseline
- Inventory all API routes, middleware, auth callbacks, database schema/migrations, scheduled jobs, storage buckets and Vercel environment targets.
- Identify the live production database by comparing Vercel production environment metadata, connection target metadata, migration history and read-only schema fingerprints.
- Verify backup and restore capability without modifying production.
- Produce a route-by-route access matrix.

### Gate 1 — Application security
- Upgrade Next.js/React and transitive dependencies using a reviewed lockfile update.
- Revalidate role and account status on each server session; use short admin sessions and reauthentication for sensitive operations.
- Apply explicit role permissions to every admin endpoint.
- Add rate limits for login, registration, password reset, coupon validation, reviews and public write endpoints.
- Add strict Zod validation, payload limits, safe error responses and origin/CSRF protections.
- Harden headers with a tested CSP and secure cookie settings; avoid breaking checkout, OAuth or image delivery.
- Review uploads, external URLs, redirects, webhook signatures and secret handling.

### Gate 2 — Database and storage security
- Map every table, view, function, trigger and storage bucket to its access requirements.
- Narrow grants and add ownership/role-based RLS policies; never apply a generic `auth.uid() = user_id` policy to unrelated tables.
- Ensure views use `security_invoker` where appropriate and review SECURITY DEFINER functions.
- Validate ownership for orders, addresses, carts, wishlists, reviews, returns and support tickets.
- Keep service-role credentials server-only.
- Add/verify backup retention, point-in-time recovery availability and a documented restore test.

### Gate 3 — Commerce integrity
- Calculate totals, discounts, shipping and taxes server-side from trusted database values.
- Make order creation and stock reservation atomic and idempotent.
- Verify payment webhooks cryptographically and make processing idempotent.
- Prevent coupon race conditions and overselling.
- Preserve immutable order item price snapshots and complete order/payment audit trails.

### Gate 4 — Quality and release controls
- Add unit, integration, authorization, ownership and checkout tests.
- Add dependency/security scanning and CI checks.
- Test preview against isolated data and integrations.
- Verify health, logs and rollback plan.
- Deploy only after explicit production release approval.

## Current status

- [x] Create isolated working branch from current `main`.
- [x] Inspect package manifest, auth implementation, admin helper, middleware, Prisma schema and connected Supabase table security metadata.
- [ ] Complete route-by-route authorization audit.
- [ ] Verify production database target and backup/restore readiness.
- [ ] Implement and test application hardening.
- [ ] Implement database least-privilege policies in a reviewed migration.
- [ ] Complete end-to-end security and commerce tests.
- [ ] Obtain approval before production promotion.

This document records an initial review, not a penetration-test certification. Findings must be revalidated against the deployed production commit and live environment before release.
