# NOORÉ Admin WOW UI v2

This patch is a visual/UX refresh for the admin operations and customer-facing order documents.

## Included
- Orders workspace + order management styling
- Premium invoice / packing slip
- QR code linking to the NOORÉ storefront
- Couriers workspace
- Coupons workspace
- Inventory workspace + inventory history
- Homepage Builder
- Settings workspace

## Mechanism preserved
No database schema, API route, order workflow, courier booking integration, coupon calculation, inventory calculation, homepage data model, or settings persistence is intentionally changed by this UI patch.

The invoice still reads the same order record and automatically prints. Packing mode still uses `?mode=packing`.

## Apply
Replace the matching files in your project, then run:

```powershell
cd D:\NOORE\noore
npm run build
git status

git add "src/app/(admin)/admin/orders/page.tsx" "src/components/admin/orders-management.tsx" "src/app/(admin)/admin/orders/[id]/print/page.tsx" "src/app/(admin)/admin/couriers/page.tsx" "src/app/(admin)/admin/coupons/page.tsx" "src/app/(admin)/admin/inventory/page.tsx" "src/app/(admin)/admin/inventory/history/page.tsx" "src/app/(admin)/admin/homepage/page.tsx" "src/app/(admin)/admin/settings/page.tsx" "public/noore-website-qr.png"
git commit -m "Upgrade admin operations and order documents UI"
git push origin main
```
