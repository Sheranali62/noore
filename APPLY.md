# NOORE Order Management 2.0

Replace these files in the project:

- `src/components/admin/orders-management.tsx`
- `src/components/admin/order-admin-form.tsx`
- `src/app/(admin)/admin/orders/[id]/page.tsx`
- `src/app/(admin)/admin/orders/[id]/print/page.tsx`

Highlights:
- Premium order operations UI
- Unsaved-change protection in the order editor
- CSV export for the currently filtered order set
- Invoice and packing-slip actions
- Packing-slip print mode without pricing/payment totals
- Existing COD-only workflow preserved
- Existing inventory/status API preserved
- No schema/database changes
