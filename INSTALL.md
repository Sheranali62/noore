# NOORE Phase 2 — Items 4–8

Copy the packaged files into the matching paths in the current NOORE project. Do not replace the entire project.

## Required database step
This phase adds `InventoryMovement` to Prisma. After copying:

    npx prisma db push
    npx prisma generate

Then verify:

    npx tsc --noEmit
    npm run build

## Mapping
- schema.prisma -> prisma/schema.prisma
- next.config.js -> next.config.js
- middleware.ts -> src/middleware.ts
- structured-data.ts -> src/lib/structured-data.ts
- product-page.tsx -> src/app/(public)/product/[slug]/page.tsx
- products-page.tsx -> src/app/(public)/products/page.tsx
- blog-page.tsx -> src/app/(public)/blog/page.tsx
- blog-detail-page.tsx -> src/app/(public)/blog/[slug]/page.tsx
- inventory-page.tsx -> src/app/(admin)/admin/inventory/page.tsx
- inventory-history-page.tsx -> src/app/(admin)/admin/inventory/history/page.tsx
- inventory-adjust-api.ts -> src/app/api/admin/inventory/adjust/route.ts
- inventory-history-api.ts -> src/app/api/admin/inventory/history/route.ts
- inventory-adjustment.tsx -> src/components/admin/inventory-adjustment.tsx

## Notes
- Existing Phase 1 search/reviews/notifications/analytics work is not included here.
- Existing customer account/cart/checkout work is not included here.
- COD remains the only checkout payment option; this phase does not add digital payments.
