# Pedestal-table rollout v1.2

Scope: first rollout batch. Parts Editor now supports `cafe-table`, `side-table`, and `square-cafe-table`; 69 catalog objects retain whole-object editing. The complete catalog mapping and roadmap are included, with completion status per object.

## Changes

- Added an explicit trusted profile registry. The parts facade, validation, geometry dispatch, dynamic list/fields and derived readouts consume profile definitions instead of a global café-only part list.
- Enabled the side and square café tables with independent tabletop thickness/shape/size, column diameter, base footprint, colors and visual finishes. Existing selection, reset, history and renderer fallback apply.
- Added v3 JSON with a per-object part revision. V1 imports and the released v2 café-table schema migrate; new families cannot claim v2 part settings. Unsupported/future revisions are rejected before replacing state.
- Migrated local saves to `form-studio.workspace.v3`, checking v2 before v1 only when the newer key is absent. Original saves are retained; corrupt newer values are not concealed by older backups.
- Changed overall-dimension slider preview to resolve explicit overrides from the committed snapshot so intermediate clamping does not permanently shrink custom component settings.

## Verification

- All 41 Node tests passed, including six new registry/schema/migration and independent-component tests.
- All 36 Chromium browser scenarios passed across desktop, tablet and mobile. New cases cover both tables' editing, real JSON export/import, reload, switching/undo, mouse/native-touch column selection, fallback editing and v2 migration/preview preservation.
- Released custom café-table v2 settings retain their values and match pre-change high/low vertex hashes byte for byte. Reference hashes were captured from the original committed v1.1 geometry/parts modules before this release.
- The side/square v1 fixtures retain overall parameters and finishes. Their components now use the pilot's final-dimension construction, with small grounding/support differences from legacy global scaling; all 69 unconverted models still match original low-detail geometry hashes.
- Existing tests cover finite/unit-normal geometry, combined overall extremes, camera framing, import limits, storage failures, deterministic allowlisted build, source exclusion and no external/API requests.
- npm audit: zero vulnerabilities; no runtime dependencies or development dependency versions were added/changed.
- Syntax checks, production build and tracked/build secret checks passed. Public artifact verification follows the GitHub Pages deployment.
- Real desktop and mobile screenshots of the new table editors were reviewed: `images/parts-side-table-desktop.png`, `images/parts-square-cafe-table-desktop.png`, `images/parts-square-cafe-table-mobile.png`.

This batch does not complete wave 0 or all of wave 1. General primitive-writer extraction, repeated groups/member topology and the remaining desk/table profiles are next. Browser tests use emulated Chromium viewports; physical-device, Safari and Firefox certification is not included.
