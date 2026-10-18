# Changelog

## 1.2.0 — 2026-10-18

- Extended Parts Editor to Round side table and Square café table, using their own default dimensions and finishes.
- Added a trusted shared profile registry for parts, field definitions, limits, defaults, geometry dispatch and inspector readouts. Part lists rebuild on object/profile changes.
- Added version-3 exports with per-object part revisions and safe v2/v1 local-save migration. Released café-table v2 settings and geometry remain unchanged.
- Fixed overall-dimension slider previews so intermediate clamping does not permanently shrink explicit component overrides when the drag returns to its starting size.
- Added legacy fixtures, schema/migration checks and desktop/tablet/mobile regressions for both tables. Other 69 objects retain their original geometry; additional rollout families remain planned.

## 1.1.0 — 2026-10-18

- Added the café-table Parts Editor pilot: independently edit tabletop thickness/shape/size, column diameter and four-foot base footprint, with separate finishes/colors and automatic connections.
- Added parts list, mouse/touch picking and depth-aware selection tint in WebGL and software fallback. Orbit gestures remain separate from selection, with keyboard-accessible controls and Escape to deselect.
- Added part reset, explicit finish application to all parts, semantic change feedback and existing undo/redo integration.
- Introduced version-2 JSON exports and local workspace storage, preserving version-1 import and safe migration with the old local save retained.
- Kept the other 71 models' original geometry, verified against pre-change hashes. The pilot uses explicit final component dimensions and grounded feet instead of whole-mesh scaling.
- Added geometry, migration, validation, picking and desktop/tablet/mobile browser regressions. Runtime dependencies remain zero.

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
