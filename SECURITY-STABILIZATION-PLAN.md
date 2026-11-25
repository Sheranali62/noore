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
4. Authentication uses Supabase password verification followed by a NextAuth JWT and a Prisma user record. The branch patch now re-reads the canonical Prisma role on each server-side session resolution, limits sessions to four hours, makes the configured Super Admin email a bootstrap-only rule for newly created app users, and clears the session identity if its Prisma user has been deleted. This still requires build and regression testing.
5. Admin APIs use a shared `requireAdmin` helper in inspected routes. Role restrictions are present on sampled admin inventory, coupon, category, courier, review and upload handlers. The complete route/method audit is still in progress. A sampled customer/sales CSV report route calls `requireAdmin()` without a narrower role list, which grants every staff role in `STAFF_ROLES` access to customer names/emails and order data. Define the report permission matrix and restrict this endpoint before release.
6. The guest-checkout account-linking flaw has been addressed on the working branch: unauthenticated checkout now refuses to attach an order to an existing account based on email alone, including case-insensitive matches. A customer with an existing account must sign in. Authenticated checkout also requires the submitted contact email to match the session email. Regression testing is still required.
7. Registration routes now normalize email addresses, reject malformed email/password input, require passwords of at least eight characters, and use case-insensitive existing-account checks. The credentials provider now supports bcrypt verification for legacy Prisma-registered accounts when Supabase password authentication does not succeed, preserving existing account credentials. Test registration, legacy login, Supabase login, Google OAuth, and password recovery before release; no customer passwords were migrated or reset.
8. Order tracking uses order number plus email as the lookup proof. The current sampled tracking response includes the full address and nested product/order data, and no rate limit was found in the route. Minimize the response to necessary tracking fields and rate-limit attempts before release. Order numbers now use 64 bits of cryptographically secure random material. Tracking response minimization and rate limiting remain outstanding.
9. The inspected upload endpoint checks MIME type and size, but MIME metadata alone does not prove the uploaded bytes are a safe image. Add file-signature validation and consider image re-encoding before storage.
10. The sampled order-creation transaction recalculates prices, shipping and coupon discounts from database records and checks coupon active/date/minimum rules in `calculateCouponDiscount`, which is good. However, stock is read and then decremented in separate operations without a conditional `stock >= quantity` update; concurrent orders may both pass the read and oversell. The working branch now uses conditional `updateMany` decrements with `stock >= quantity` checks for both product and variant inventory; transaction failure rolls back the order. Concurrent-checkout tests are still required.
11. Existing Next.js headers include nosniff, frame, referrer, permissions policy and HSTS. CSP, cookie/session hardening, CSRF/origin protections and comprehensive upload validation still need route-aware review.
12. GitHub `main` currently reports branch protection disabled. Configure required reviews/checks and restrict production releases after confirming repository administration permissions.
13. Supabase Security Advisor reports 30 public tables with RLS enabled but no policies, plus leaked-password protection disabled. With no Supabase JS client found in the repository, the web app appears to use Prisma for application data and Supabase Auth for credential verification; confirm no external Data API consumer before revoking broad `anon`/`authenticated` table grants. Enable leaked-password protection in Supabase Auth settings after confirming the supported setting and impact.

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
- Add rate limits for login, registration, password reset, coupon validation, reviews, order tracking and public write endpoints.
- Add strict Zod validation, payload limits, safe error responses and origin/CSRF protections.
- Harden headers with a tested CSP and secure cookie settings; avoid breaking checkout, OAuth or image delivery.
- Review uploads, external URLs, redirects, webhook signatures and secret handling.
- Resolve the registration/authentication provider mismatch and guest checkout account-linking issue before release.

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
- [x] Review a representative set of customer and admin API routes; record high-risk findings above.
- [ ] Complete route-by-route authorization audit (sampled public/admin handlers reviewed; remaining routes and methods still need inspection).
- [x] Restrict staff CSV report access and customer PII endpoint; minimize order-tracking response; harden order-number entropy.
- [ ] Add shared production rate limiting to public order tracking, coupon validation, registration, password reset and other public write endpoints.
- [x] Make inventory decrements conditional and atomic to prevent concurrent overselling on the isolated branch.
- [x] Increase order-number entropy from 32 to 64 cryptographically secure random bits.
- [ ] Verify production database target and backup/restore readiness. Vercel's production DATABASE_URL is configured as a sensitive variable and its target could not be safely established from metadata; the connected Supabase project has a RateLimitBucket table and recent migrations, but that alone does not prove it is the database used by production.
- [x] Implement initial guest-checkout account-linking protection and registration/legacy-login compatibility on the isolated branch.
- [ ] Run build, type-check and authentication/checkout regression tests.
- [ ] Implement database least-privilege policies in a reviewed migration.
- [ ] Complete end-to-end security and commerce tests.
- [ ] Obtain approval before production promotion.

This document records an initial review, not a penetration-test certification. Findings must be revalidated against the deployed production commit and live environment before release.

## Follow-up fixes (2026-11-25)

- Fixed the order-tracking client URL: the page now calls the existing `GET /api/orders` handler instead of the nonexistent `/api/orders/track` path.
- Reduced the order-tracking response to the fields rendered by the customer page (order status, total, timestamps, payment method, courier tracking, item quantities/prices, product name/images, and variant color/size). The response no longer includes the customer's address or account email.
- Restricted report exports by role: sales and customer exports are limited to `SUPER_ADMIN` and `ADMIN`; inventory exports also permit `PRODUCT_MANAGER`. Unknown report types now return HTTP 400.
- The checkout route on this branch already uses 64-bit random order-number entropy and conditional atomic stock decrements for both product and variant stock. These changes remain part of the review scope.
- Remaining release gate: add a shared, production-appropriate rate limiter to public order tracking. No reliable shared rate-limit store is currently configured in the repository; do not use a process-local in-memory limiter as a production security control. Also add automated tests for concurrent stock reservation, tracking authorization/response shape, and report role matrix.
- Validation remains pending because the Vercel preview build has been blocked by the free-plan build-rate limit. No production deployment or database schema/data change has been made.


## Additional audit updates (2026-11-25)

- The order-tracking GET handler now adds `Cache-Control: private, no-store, max-age=0` and `Pragma: no-cache` to every response, preventing intermediary/browser caching of private tracking results.
- Critical framework lifecycle finding: the app is pinned to Next.js `14.1.0`, while the official Next.js support policy lists all 14.x releases as unsupported. Plan a tested migration to a supported 16.x Active LTS release (or 15.x Maintenance LTS only as a short transition); do not perform a blind dependency bump because this codebase is on React 18 and Next 16 requires React 19 and has breaking changes.


- Restricted `GET /api/admin/customers` to `SUPER_ADMIN` and `ADMIN`; this endpoint returns customer contact and spending information.
- Restricted `GET /api/admin/homepage` to `SUPER_ADMIN`, `ADMIN`, and `CONTENT_MANAGER`, matching the write permission matrix for homepage content.
- Reviewed additional sampled handlers: courier management and order notifications are restricted to order-management roles; category/product/inventory endpoints are restricted to product-management roles; coupon management is restricted to administrators; review moderation and storefront content endpoints are restricted to content-management roles. Public review submission requires a session and a delivered purchase; address and wishlist operations are scoped to the signed-in user.
- The connected Supabase project currently exposes a `RateLimitBucket` table with `key`, `count`, `windowStart`, and `updatedAt` fields, and its bucket count is zero. However, Vercel production's database connection target is not verifiable from the available masked environment metadata. The repo's Prisma schema does not currently model this table, and the applied Supabase migration is not represented as a checked-in Prisma migration. Do not wire production rate limiting to this table until the production database target and schema parity are confirmed.
- Password recovery remains unimplemented: the UI calls `/api/auth/forgot-password`, but there is no matching route and the current Prisma schema has no one-time reset-token model or session-revocation version. A safe implementation needs a reviewed schema migration, a verified restorable backup, rate limiting, single-use hashed tokens, expiry, Resend email delivery, and invalidation of existing sessions after password change. No database changes have been applied.
- Vercel's production environment metadata shows `RESEND_API_KEY` and `EMAIL_FROM` are configured as production-only secrets, but their values were not read. Preview environment email delivery therefore needs its own safe test configuration before end-to-end testing.
