# NOORÉ Categories + Courier Contracts Upgrade

## What this adds
- Admin > Categories: unlimited main categories and sub-categories using a parent/child tree.
- Product creation/editing loads active main categories and matching sub-categories from the database.
- Admin > Couriers: save contracted courier company profiles once (account/contract/contact/pickup/API profile fields).
- Order Management: select a saved courier company; its company name and contract profile are loaded automatically.
- Existing manual courier/tracking fields remain available.
- No fake catalog, customer, order, or courier data is created.

## Database
The Prisma schema adds `Category` and `CourierCompany`, and adds optional `courierCompanyId` to `Order`.

Run once after copying the patch into the real repo:

```bash
npx prisma db push
npx prisma generate
```

Then build:

```bash
npm run build
```

## Important
The courier profile stores the contract/account information so the admin does not retype it for every order. The patch does **not** claim to submit shipments to a carrier API automatically unless a real carrier API integration is configured. `apiBaseUrl`, `apiKey`, and `apiSecret` are reserved for that integration.
