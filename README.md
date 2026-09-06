# NOORÉ — Admin Orders Runtime Fix

This patch moves the `/admin/orders` order list query behind a dedicated admin API endpoint.

Why: the production Orders page was throwing the global "Something went wrong" error. The list endpoint intentionally selects only the fields required by the Orders UI and does **not** touch the newer courier-company relation. This keeps the order list resilient while the courier-contract feature is deployed.

Files:
- `src/app/(admin)/admin/orders/page.tsx`
- `src/app/api/admin/orders/route.ts`

The patch does not change checkout or payment methods. COD remains unchanged.
