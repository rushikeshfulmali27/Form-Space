# Next 15: counters, retail stands and lighting

Baseline v1.9.0: 39/72 supported. Target v1.10.0: **54/72 supported, 18 remaining**.

Implementation review: 2026-10-28.

## Slices and exact membership

1. R9: `reception-desk`, `service-counter`, `bar-counter`, `checkout-counter`. Reuse the kitchen-island carcass/top/plinth/three-front-panel solver without altering its existing geometry.
2. R10: `pastry-display-stand`, `plant-stand`, `garment-rail`, `hanging-rack`, `accessory-stand`, `brochure-holder`, `promotional-stand`, `freestanding-logo-display`.
3. R11a: `floor-lamp`, `table-lamp`, `pendant-light`. Leave the other four lights for R11b.

## Construction and controls

- Pastry stand: 2–6 trays in `design.shelves`; fixed two-post frame within the smallest tray footprint. Tray thickness, internal center height and upper-tray width/depth have safe limits. First/last trays anchor floor/top. Stable bottom-to-top IDs; decrease prunes overrides, undo restores them and re-add inherits defaults. Keep descending default footprints and reserve clearance at combined extremes.
- Plant stand: three fixed stepped platforms, individually sized widths/thicknesses and safe top-height bands; highest platform follows total height. Two support posts per platform follow its center and underside. Outer platforms anchor overall width; platform depth anchors depth.
- Garment/hanging racks: two feet, two uprights and top rail. Foot width/height, upright section and rail section remain connected. Only hanging rack has the existing lower shelf with thickness/height controls.
- Accessory stand: grounded base, mast and two fixed crossbars. Base thickness, mast section, crossbar section/width and lower-bar height; upper bar anchors total height.
- Brochure holder: base, central mast and three fixed pocket backs/floors/lips. Independent thickness/finish, back widths and lip heights; pocket attachments derive from the same anchors. No new pockets.
- Promotional stand: grounded base/back and two shelves. Base/back thickness and shelf thickness/center height; shelves meet the back and stay ordered.
- Logo display: grounded base, connecting support and three fixed F-shaped mark bars. Independent stroke section/depth/finish. Support must attach the actual vertical mark; no text/upload feature.
- Floor/table lamps: grounded base, stem, tapered shade and diffuser. Base thickness, stem diameter, shade height and diffuser thickness; connected through the center. Shade defines width/depth; its top defines total height.
- Pendant: ceiling mount, cable, tapered shade and diffuser. Mount/cable/shade/diffuser dimensions; ceiling mount top anchors total drop, diffuser bottom anchors zero. Preserve elliptical footprints and fixed shade taper.

## Shared contracts

Trusted ID-owned recipes determine topology; imported `kind`, `variant`, `panels` or builder names cannot change construction. Revision 1 profiles accept historical whole-object v1/v2/v3 files; new part data requires the exact revision and active allowlisted fields. Keep the v3 envelope, strict integer count validation, browser storage backups and atomic history.

Use root groups with linked inheritance and member overrides; every leaf owns actual triangles. Dimensions are cm at 0.01 precision, written to meter geometry without global rescaling. Overall limits remain width 20–240, height 20–240 and depth 4–240 cm. Preserve positive geometry, unit normals, declared outer bounds and attached components at combined/mixed limits. Add explicit modules to the static allowlist; add no runtime dependency/service.

## Verification and release

Capture all 39 released high/low mesh hashes and historical files before coding. Test every new construction at default, combined min/max, mixed asymmetric controls and extreme envelopes; measure final dimensions, bounds, ownership and connections. Exercise all tray counts, pruning, defaults, clamping, selection/focus, reset/apply and undo/redo. Reject unknown/inactive parts, future revisions and spoofed metadata.

Cover all 15 objects with desktop/tablet/mobile browser edit/export/import/reload workflows. Test mouse/native-touch selection and software fallback for the distinct tray, rail and lighting paths. Inspect representative responsive captures and every new construction. Run syntax, Node, full browser, deterministic build, source/build secret checks and npm audit. Align catalog/backlog coverage, publish through the existing GitHub Pages workflow and verify public asset hashes against the tested build.
