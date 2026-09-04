# NOORÉ — Admin Intelligence & Launch Operations Upgrade

Included in this release:

- Admin command center with live 30-day revenue, orders, AOV, units, customers, delivered orders, pending COD, low stock, abandoned carts and wishlist/search activity.
- Expanded analytics with best sellers, search demand/no-result signals, order pipeline and CSV exports.
- Customer account 2.0: active order count, lifetime spend, quick shopping/tracking actions.
- Abandoned carts operational view.
- Order tracking endpoint at `/api/orders/track` with order number + email verification.
- Order-status email notifications when Resend is configured; order creation confirmation is also supported.
- Inventory movement ledger with manual adjustment API, sale/cancellation/reopen logging, history page and CSV export.
- Real search-event analytics (query + result count) for merchandising decisions.
- Security response headers in `next.config.js`.
- Existing SEO/sitemap/robots and product structured data preserved.
- COD ONLY. No online payment methods were added.

## Database migration

This release adds `SearchEvent` and `InventoryMovement` tables.

After extracting the release, run:

```powershell
npx prisma migrate deploy
npx prisma generate
npx tsc --noEmit
npm run build
```

If your local database has migration history that does not include the new migration, use the migration deployment command against the same DATABASE_URL used by the project. Do not commit `.env` files.

## Git

```powershell
git add .
git commit -m "Add NOORE admin intelligence and launch operations"
git push origin main
```

## QA

1. `/admin` — metrics load and links work.
2. `/admin/analytics` — best sellers/search/order pipeline and CSV exports.
3. `/admin/abandoned-carts` — carts older than two hours with items.
4. `/admin/inventory` + `/admin/inventory/history` — adjust stock and verify ledger.
5. Place a COD order — stock decreases and an inventory movement is recorded.
6. Cancel a non-cancelled order — stock is restored and movement is recorded.
7. Reopen a cancelled order — stock is decremented again only when available.
8. `/order-tracking` — order number/email lookup works.
9. Customer `/account` — lifetime spend and active order metrics.
10. Search — queries appear in Admin Intelligence after use.
11. Confirm all payment UI remains COD-only.
