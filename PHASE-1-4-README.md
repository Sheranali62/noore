# NOORE Phase 1-4 Upgrade

This is an additive upgrade for:
1. Advanced Search & Product Discovery
2. Reviews & Ratings with customer purchase verification and admin moderation
3. Customer order-status email notifications via optional Resend API
4. Admin Store Analytics

Existing Prisma models already include ProductReview, so no migration is required for these changes.

## Optional email environment variables
RESEND_API_KEY=...
EMAIL_FROM=NOORE <orders@your-domain.com>

The email endpoint is `/api/admin/notifications/order` and is protected by admin role checks.
