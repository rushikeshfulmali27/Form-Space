# Changelog

## 1.0.0 — 2026-10-17

- Focused the public release on Object Studio's 72 editable objects, four categories and 17 subcategories.
- Replaced unused React/Vinext/Cloudflare server tooling with a deterministic static build and loopback preview. Removed public AI navigation, generation assets and API endpoints; preserved pre-v1 work in Git history.
- Removed unused npm dependencies and the Sharp override. The release has no runtime dependencies and only pinned Playwright browser-test tooling.
- Hardened JSON size/schema/units checks, numeric normalization, and material lookup. Existing valid v1 exports remain compatible.
- Distinguished new, saved, corrupt, unavailable and in-progress storage states. Added renderer fallback feedback and accurate download/reset messages.
- Cached/lazily rendered catalog thumbnails, reused unchanged meshes, and stopped idle animation scheduling. Auto-rotation is opt-in and pauses in hidden pages.
- Corrected library grid sizing, tablet sticky overlap and mobile overflow; improved focus access, text legibility and control targets while retaining FORM styling.
- Added production build/security, storage, invalid-import and real browser regressions, static subpath checks, screenshots, release documentation and validation-only CI.

Earlier snapshots are development versions rather than public releases.
