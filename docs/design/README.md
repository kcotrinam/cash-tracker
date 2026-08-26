# CashTracker design documentation

Stitch is the canonical source for CashTracker's visual design. No Stitch project URL is
stored in this repository, so obtain access through the project maintainer.

Repository design documentation records screen coverage, behavior, accessibility, and
implementation constraints that developers and coding agents need. Screenshots, HTML
exports, generated assets, and local design variants are not sources of truth and must
not be committed under `docs/`.

## Implementation guidance

- Build mobile first and verify both mobile and desktop compositions.
- Use the existing Tailwind CSS v4 utilities and CSS variables in
  `apps/web/app/globals.css`.
- Do not copy generated Stitch HTML or CSS into production components.
- Preserve Spanish-first copy through the existing message catalogs.
- Meet WCAG AA contrast, retain visible focus, use semantic controls, and support full
  keyboard navigation.
- Keep touch targets at least 44 by 44 pixels and mobile input text at least 16 pixels.
- Respect reduced-motion preferences, safe areas, and narrow viewports without
  horizontal overflow.
- Use text or icons in addition to color for financial direction, errors, and status.

Before implementing a screen, consult Stitch, review
[screen-map.md](screen-map.md), and inspect existing application patterns. Update the
screen map whenever a screen is added, removed, renamed, or moved to another route.

Product direction belongs in [PRODUCT.md](../../PRODUCT.md); business rules belong in
[domain.md](../domain.md); coding-agent rules belong in
[AGENTS.md](../../AGENTS.md).
