# NOORE Admin Order Detail Runtime Fix

The error was caused by the order detail page assuming `order.address` and several order/item fields always exist. Production data can legitimately have a missing address relation or incomplete legacy relation data, which caused the recovery boundary to display:

"Your cart and account data are kept safe while we recover the page."

This patch hardens `/admin/orders/[id]` without changing the database schema.

Replace/add:

`src/app/(admin)/admin/orders/[id]/page.tsx`

Then run:

```bash
cd D:\NOORE\noore
npm run build
git status
git add "src/app/(admin)/admin/orders/[id]/page.tsx"
git commit -m "Fix admin order detail runtime error"
git push origin main
```
