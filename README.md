# NOORE Premium Homepage 2.0

Replace the existing `src/app/(public)/page.tsx` with the included file.

Adds richer editorial homepage sections: Shop by World (Women/Men/Kids), Luxury Spotlight, Collection Stories, and Journal. Preserves adaptive personalization, existing product sections, COD-only checkout, and empty-catalog behavior.

After extraction:

```powershell
cd D:\NOORE\noore
npm run build
git status
git add "src/app/(public)/page.tsx"
git commit -m "Upgrade NOORE premium homepage"
git push origin main
npx vercel --prod
```
