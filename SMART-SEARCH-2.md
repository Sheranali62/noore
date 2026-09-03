# NOORÉ Smart Search 2.0

This upgrade adds a natural-language search layer to the existing global search.

## Included
- Natural search terms across product name, SKU, category, subcategory, collection, fabric, type and tags.
- Smart detection for gender, common colors, sizes, sale and stock availability.
- Budget parsing such as `under 5000`, `over 10000`, and `between 5000 and 10000`.
- Combined queries such as `women black cotton under 5000`.
- Global header autocomplete with keyboard navigation using Arrow Up/Down + Enter.
- Recent-search history with clear action.
- Mobile-friendly search overlay.
- Search results page with category, gender, color, size, availability and price filters.
- Popular/newest/price/rating sorting.
- Search result count and smart-filter chips.
- Existing COD-only checkout is unchanged.

## Verification
Run in the project directory:

```powershell
npm install
npx prisma generate
npx tsc --noEmit
npm run build
```

Then push:

```powershell
git add .
git commit -m "Upgrade NOORE smart search experience"
git push origin main
```
