# R1: desk and table variants — v1.4.0

Implemented 2026-10-22. Parts Editor coverage is 12 of 72 objects; 60 remain. This completes the desk/table wave. R2 seating is next; T0 must precede variable-count cushions and shelves.

| Object | Profile / revision | Selectable geometry | Dimension rules |
| --- | --- | --- | --- |
| Standing desk | `standing-desk` / 1 | Top, two columns, two feet, brace; column and foot groups | Top defines the envelope; columns attach to its underside and feet. Column section, foot footprint/thickness and brace section are constrained. Total height drives column length. |
| Corner desk | `corner-desk` / 1 | Main top, return top, five named legs; top and leg groups | Both slabs share thickness and height. Main slab width and return slab depth are each 20–55% of their envelope axis; slabs share an exact join. Legs follow their assigned slab. |
| Patio table | `slatted-table` / 1 | Seven stable slat IDs, four legs, two feet, brace; top, leg and foot groups | Gap is 0–1.5% of total width; slat width is `(width − 6 × gap) / 7`. Oval mode clips these same seven strips. Supports snap inward to slats instead of ending in gaps. |
| Laptop stand | `laptop-stand` / 1 | Platform, angled support, base, lip | Platform/base thickness: 0.3 cm–15% of height. Lip: 0.3 cm–20% of height. Base footprint: 40–95% of envelope. Support: 0.3 cm–12% of minimum width/depth. Lip is included in total height and follows the front edge. Horizontal support end faces intersect the base and platform. |

All numeric settings use centimeters and hundredth-centimeter precision. Exact inherited defaults and computed limits live in `public/studio/parts-desk-variants.js`; standard frame limits remain in `parts-desks.js`. The facade quantizes limits to saved precision, allowing boundary exports to import without floating-point rejection. Interactive edits clamp within those limits; strict imports reject invalid IDs, fields, types, values and revisions.

Top thickness for the three desk profiles is 0.5–min(12, height−10) cm. Standard foot and brace limits are shared with the released desk profile. Groups inherit finishes and allowed dimensions; individual member overrides survive group edits until Apply group settings or Reset group and members is used. Slat and corner-slab members expose finish/color; their dimensions belong to the shared top group. Their geometry uses final dimensions, with no whole-mesh rescale.

Legacy v1/v2/v3 whole-object saves for these four IDs acquire revision 1 and retain catalog settings, dimensions and finishes. Converted geometry now has explicit grounded/support anchors, so it can differ visually from the old globally scaled mesh. New component-bearing v3 files require the exact profile revision. The eight already-released objects retain byte-identical high/low geometry, pinned in `tests/fixtures/released-v13-hashes.json`.

Verification is in `tests/desk-variants.test.mjs`, `tests/browser/desk-variants.spec.mjs` and `tests/browser/variant-picking.spec.mjs`, alongside the existing suite. These cover complete leaf ownership, finite unit normals, combined envelope/component limits, shared attachments, group/member inheritance, history, legacy migration, strict validation, actual export/import/reload, mouse/touch picking and software fallback. Responsive captures are in `docs/images/variant-{object}-{desktop,tablet,mobile}.png`.

Local release result: 56 Node tests and 81 Chromium scenarios passed across desktop, tablet and mobile. Representative standing-desk desktop, laptop-stand tablet, corner-desk mobile and oval patio-table screenshots were visually reviewed. Syntax, deterministic build, source exclusions and source/build secret checks passed. The production output has 21 static files.

No dependency versions changed. The npm audit report on 2026-10-22 contains zero reported vulnerabilities. There are no runtime package dependencies; the only direct development dependency remains the pinned browser test tooling. No dependency remediation is needed for this report.

Telescoping motion, articulation, free transforms, changing the fixed slat count and fabrication/structural simulation remain outside R1.
