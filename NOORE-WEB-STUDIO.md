# NOORÉ Web Studio

## Phase 1 implementation

The standalone Web Studio is available at `/studio`. The same shared workspace is available inside the existing admin shell at `/admin/studio` and from the role-aware admin navigation.

### Access control
- The standalone route uses the existing NextAuth session and `requireAdmin` guard.
- Access is limited to `SUPER_ADMIN`, `ADMIN`, and `CONTENT_MANAGER`.
- The existing `/api/admin/homepage-design` endpoint remains the source of truth and enforces the same role set.
- The mobile admin navigation reuses the shared role-aware navigation component, so the Studio link is available there too.

### Connected capabilities
- Load the saved homepage design.
- Edit the existing homepage copy fields.
- Edit the existing color palette and heading/body font settings.
- Preview local unsaved changes in a responsive desktop/mobile canvas.
- Save changes through the existing homepage-design API.
- Open existing homepage, page-content, media, and website-design tools.

### Deliberate boundaries
- The canvas is a local design preview, not a pixel-perfect rendering of the live storefront.
- Save writes the existing `homepage_design` setting; it does not create a second content store.
- Pages and SEO sections currently link to existing tools or clearly identify capabilities that are not connected yet.
- This phase does not alter products, orders, customers, inventory, checkout, or storefront routes.
- No database migration or production deployment is part of this change.

## Next phases
1. Render the actual storefront inside an isolated preview frame with draft-only design state.
2. Add version history and one-click rollback for homepage design settings.
3. Connect reusable page sections and per-page content to the existing content model.
4. Add per-page SEO metadata and redirect management.
5. Add media library selection, upload workflow, accessibility checks, and publishing approvals.
