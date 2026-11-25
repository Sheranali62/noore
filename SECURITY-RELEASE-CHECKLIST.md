# NOORÉ Security Release Checklist

This checklist tracks the security hardening staged on `feature/complete-ecommerce-upgrade`. It is not a penetration-test certification.

## Implemented in the branch

- Next.js 16 / React 19 migration already present in this branch; CI validates the exact lockfile.
- NextAuth sessions are limited to four hours, roles are re-read from Prisma, deleted users are rejected, and JWTs are tied to the Prisma account update timestamp.
- Registration and password recovery enforce 12–72 character passwords with uppercase, lowercase, digits and an allowed symbol. Password recovery is server-side, verifies the Supabase recovery JWT, and invalidates existing NOORÉ JWT sessions after the Supabase password changes.
- Password reset accepts only a Supabase recovery-session JWT (not an ordinary signed-in access token), updates the password server-side, and revokes existing NOORÉ JWT sessions.
- The configured owner email can bootstrap the first `SUPER_ADMIN` only while no super administrator exists. Existing staff roles are not promoted on every login.
- Supabase credential failures fail closed in production; the legacy bcrypt fallback is development-only when Supabase Auth is not configured.
- Registration, checkout, tracking, search, coupon validation, newsletter, cart, wishlist, address changes, support messages, return requests, return evidence and administrative uploads have bounded input and/or shared database rate limits.
- Checkout recalculates prices, shipping, taxes and discounts server-side; guest orders are not attached to an existing account by email alone.
- Stock decrements use compare-and-swap checks; coupon claims are serialized; return receipt and order status transitions are protected against duplicate concurrent updates.
- Public product, cart, wishlist and customer order responses select only fields needed by the storefront/customer. Internal product cost fields are not sent to public pages.
- Customer/admin private API responses use no-store cache headers; order tracking hides address data and uses a generic verification failure.
- Admin API and server-rendered pages enforce role-specific access; customer exports and financial dashboard data are restricted to administrators.
- Image uploads validate actual file signatures and use generated storage names. CSV exports neutralize spreadsheet formula cells.
- Payment and courier webhooks require long secrets, validate payloads and protect status updates against concurrent regressions.
- Baseline security headers include HSTS, frame restrictions, object blocking, base-URI restrictions, content-type protection, referrer policy and a restrictive permissions policy.
- Vercel Firewall has an active credential-login limit of 20 attempts per client IP per minute, followed by a challenge.
- The database rate-limit cleanup is included in the daily abandoned-cart cron.

## Required before production release

- Identify the exact database host used by Vercel production `DATABASE_URL`; the encrypted value has not been read.
- Create and verify a restorable backup of that production database before applying any migrations.
- Apply the additive Supabase/Prisma migrations to the verified production database, including the shared `RateLimitBucket` table. The existing Supabase project has a matching `RateLimitBucket` table, but that alone does not prove Prisma production uses the same database.
- Give preview deployments an isolated Supabase Auth project before testing registration, password recovery or other flows that create/modify Auth users. Current preview Auth metadata points at the production Supabase Auth project.
- In Supabase Authentication → Sign In / Providers → Email, set minimum password length to 12 and require lowercase, uppercase, digits and symbols. The connected Supabase security advisor reports leaked-password protection disabled; Supabase documents that this HaveIBeenPwned check is available on Pro plans and above, so it cannot be enabled on Free.
- Configure strong random secrets (at least 32 characters) for payment/courier webhooks if those integrations are enabled.
- Verify Resend delivery, password reset, order confirmation, cron authentication, Blob uploads and webhook signatures in an isolated preview.
- GitHub Actions validation passed on code commit `fec0c9815ee6c6f96cbbff4d691523a54453b06d`: dependency install, Prisma validation/client generation, TypeScript, production dependency audit (zero vulnerabilities), ESLint and Next.js production build all succeeded.
- A fresh Vercel preview deployment is still required for runtime/browser regression tests. Vercel currently blocks new deployments on the Free-plan daily API deployment quota; do not deploy production as a workaround.
- Vercel's free-plan API deployment quota has blocked additional preview deployments. Do not deploy production as a workaround.
- Complete a full Content Security Policy asset review before adding script/style allowlists. The current policy is intentionally a safe baseline, not a complete strict CSP.
- Enable and test administrator MFA where supported by the configured Supabase Auth plan and login flow.

## Release guardrails

- No production deployment has been performed by this work.
- No production schema migration has been applied by this work.
- Do not merge or deploy until the database target, restorable backup, migration status, CI results and preview regression tests are verified.
