# NOORÉ Web Studio

## Access points and permissions

- Standalone workspace: `/studio`.
- Integrated admin workspace: `/admin/studio`.
- Routes and APIs use the existing NextAuth admin guard and allow `SUPER_ADMIN`, `ADMIN`, and `CONTENT_MANAGER`.
- Admin navigation exposes the integrated workspace to those roles.

## Connected functionality

### Homepage design and content
- Reads and edits the existing `homepage_design` setting.
- Editable homepage announcement, hero, collection, favourites, categories, arrivals, luxury, sale, brand, newsletter and footer copy.
- Color controls for page, text, accent, buttons, surfaces, borders, header, footer and announcement.
- Heading/body typography controls.
- Responsive desktop/mobile local canvas preview.
- Save and discard behavior with unsaved-change state.
- Preview deployments reject homepage design writes because preview currently shares the production Supabase project.

### Version history
- Every changed homepage save records the previous normalized design.
- Keeps the latest 30 snapshots in the existing `Setting` table under `homepage_design_versions`; no schema migration is required.
- History is admin-only and supports restoring a selected snapshot.
- A restore first snapshots the current design, so it can be restored again.
- Preview deployments reject restores for the same production-data safety reason.

### Existing site management tools
- Studio links to existing homepage section management, page content, storefront media/image uploads and website design tools.
- These tools remain authoritative for their current content and media workflows; Studio does not duplicate product, order, customer, inventory or checkout data.

## Important boundaries

- The canvas is a local design mock-up, not a pixel-perfect rendering of the actual storefront.
- Homepage save is a live setting write when used on a production deployment. Do not publish from production until release/backup checks have been completed and the operator intends to change the live site.
- The Preview environment is intentionally read-only for all Studio content writes: homepage design, homepage layout, hero banners, individual page content, storefront image settings, image uploads, and homepage version restore. Homepage section reads also avoid creating defaults in Preview.
- Existing image manager updates image URL settings; it is not a general-purpose DAM with folders, crop transformations or asset lifecycle controls.
- The current site contains existing page-content tools, but a universal drag-and-drop page builder, isolated draft rendering for every route, per-page SEO metadata/redirect manager, approval workflow, and audit-grade content versioning for every content type are not yet implemented.
- No product, order, customer, inventory, pricing, payment, checkout or storefront business data is modified by this Studio work.
- No database schema migration or production deployment is part of this change.

## Remaining phases before calling Studio fully complete

1. Isolated, true storefront rendering of unpublished drafts across all routes.
2. Reusable drag-and-drop page sections/blocks with persisted page layouts.
3. Per-page SEO title/description, canonical, social metadata, structured data and redirect management wired into route metadata.
4. Full media library (folders, search, metadata, alt text, crop/transform and asset usage tracking).
5. Approval/publishing workflow, revision history for all page/content types, audit log and rollback.
6. Browser regression/accessibility testing and production release after verified backup and isolated preview database are available.
