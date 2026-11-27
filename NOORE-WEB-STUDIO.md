# NOORÉ Web Studio

## Entry points and access

- Standalone workspace: `/studio`.
- Integrated admin workspace: `/admin/studio`.
- The Studio and its APIs require an authenticated `SUPER_ADMIN`, `ADMIN`, or `CONTENT_MANAGER` role.
- The Builder is available from the Studio's left-hand workspace navigation.

## Homepage design editor

- Existing `homepage_design` setting is retained.
- Edit homepage announcement, hero, collection, favourites, category, arrivals, luxury, sale, brand, newsletter and footer copy.
- Edit the existing brand palette and heading/body typography.
- Responsive desktop/mobile visual canvas preview.
- Save, discard and unsaved-change state. Homepage publishing and homepage-version restore are administrator-only; Content Managers can read the design but cannot publish directly.
- Up to 30 previous homepage design snapshots and restore support.

## Custom page builder

- Create up to 100 custom storefront pages at `/pages/[slug]`.
- Build each page with up to 40 reusable blocks: hero, rich text, image, image + text, live product grid, call-to-action, FAQ and spacer.
- Reorder and remove sections, edit colors, image URLs/alt text, content and product category/count.
- Private authenticated draft preview at `/studio/preview/[slug]`.
- Separate Save Draft, Request Approval and administrator Approve & Publish actions. Editing a published page does not replace its live version until an administrator publishes it.
- Unpublish and delete custom pages (administrator only). Content Managers can create/edit drafts and request approval but cannot publish, unpublish, delete pages or change global site settings.
- Published pages render server-side; product-grid blocks query only active catalogue products and reuse the existing product card/cart experience.
- Section content is rendered as text, not arbitrary HTML.

## SEO and discoverability

- Global site title, description, keywords, canonical URL, social image and site-wide noindex setting.
- Per-custom-page SEO title, meta description, canonical URL, Open Graph image and noindex control.
- Custom pages are added to the sitemap only when published and indexable.
- Custom page metadata includes Open Graph and Twitter sharing data.
- The sitemap and root metadata respect the global noindex setting.

## Navigation

- Manage custom menu labels, URLs and visibility.
- Enabled items appear in a supplemental navigation row below the existing NOORÉ header.
- Existing navigation and storefront routes are preserved.

## Media library

- Manage image URL records with names, alt text and folders.
- Upload images through the existing secured Vercel Blob upload API (JPG, PNG, WebP and AVIF, 8 MB maximum).
- Preview assets, copy URLs, remove library records and see usage counts across Studio page drafts and published versions.
- Existing Storefront Image Manager remains available for the current predefined homepage and department image slots.

## Redirects

- Manage enabled 301 and 302 redirects for unmatched legacy paths.
- The public catch-all route applies the configured HTTP status and destination.
- Redirect source paths must be unique; direct loops and destinations that point to another configured source are rejected.
- Existing application routes take precedence. This is intentionally designed for legacy URLs that do not collide with existing routes.

## Revision history and audit

- Page draft edits snapshot the previous draft before replacing it.
- Content Managers can submit drafts for administrator review; approval and publishing are separate role-gated actions with audit events.
- Publishing an updated page snapshots its previous published version.
- Restore moves a chosen revision back into draft; publishing is a separate action.
- Up to 100 page revision snapshots are retained.
- Studio actions write best-effort entries to the existing `AuditLog` model.

## Production and preview safety

- Preview deployments share the connected production Supabase project.
- Preview is read-only for Studio content writes: homepage design, homepage layout, hero banners, page content, storefront image settings, image uploads, custom pages/navigation/media/SEO/redirects, and restore actions are blocked with HTTP 409.
- Preview homepage section reads do not create defaults.
- Product-grid cards in draft preview are non-interactive, so draft preview cannot add items to a production cart.
- No new database tables or migrations are required; Studio data uses bounded JSON values in the existing `Setting` table.
- No products, prices, orders, customers, inventory, payments, checkout logic or existing public routes are replaced by the custom page builder.
- No production database changes or production deployment were performed as part of this branch.

## Remaining release verification

- Vercel build for commit `4b5b68f` passed compilation, TypeScript and static page generation. The latest non-interactive draft-preview changes are awaiting a fresh build.
- Browser-test create/edit/preview/publish/unpublish/delete, navigation, image upload, metadata, redirects, revisions and responsive layouts with an isolated preview database.
- Verify published pages and redirects against the real storefront before production rollout.
- Production publish remains gated on a verified restorable backup, confirmed production DB target and explicit release approval.
