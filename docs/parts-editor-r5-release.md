# R5: office chair — v1.8.0

Implemented 2026-10-27 following the [R5 plan](parts-editor-r5-plan.md). `office-chair` brings Parts Editor coverage to **24/72 objects**, with **48 remaining**. R6 shelving and open storage is next.

## Components and ownership

The revision-1 `office-chair` profile emits 17 selectable leaves: seat, back, support column, two armrests, two arm supports, five star-base arms and five caster assemblies. Four root groups expose linked defaults and independent member settings. Slots `.01`–`.05` keep fixed angular identity at 72° intervals; there is no count/construction control.

Every semantic part has independent finish/color. Armrests expose member top height and section. Base arms expose member section and shared footprint inset. Casters expose member diameter. Arm-support dimensions follow the corresponding armrest and seat, with separately editable finishes. Group apply/reset and all edits use the existing history and v3 save contracts.

## Parameter contract

Dimensions are centimeters at hundredth-centimeter precision. Let `H`, `W`, `D` be the whole height, width and depth, and `M = min(W,D)`.

| Setting                    | Default                         | Limits                               |
| -------------------------- | ------------------------------- | ------------------------------------ |
| Seat top height            | `0.47H`                         | `0.36H`–`0.52H`                      |
| Seat thickness             | `0.10H`                         | 0.3–`0.12H`                          |
| Back depth                 | `0.14D`                         | 0.3–`0.18D`                          |
| Column diameter            | `max(0.3,min(5,0.15M,0.06H))`   | 0.3–`min(0.20M,0.08H)`               |
| Armrest top height         | `0.62H`                         | `0.60H`–`0.76H`, group/member        |
| Armrest section            | `max(0.3,min(4,0.10M,0.035H))`  | 0.3–`min(0.12M,0.04H)`, group/member |
| Base-arm section           | `max(0.3,min(3.5,0.07M,0.03H))` | 0.3–`min(0.08M,0.04H)`, group/member |
| Footprint inset            | `0.02M`                         | 0–`0.10M`, shared                    |
| Caster horizontal diameter | `max(0.3,min(5.4,0.10M,0.06H))` | 0.3–`min(0.12M,0.08H)`, group/member |

Caster height is 75% of horizontal diameter. Base-arm section is its vertical thickness and perpendicular horizontal width, not the bounding height of a sloped mesh. Their vertical end sections prevent floor penetration even with thick arms and small casters. Column height, arm-support length and radial reach are derived, not independent conflicting controls.

## Connections and envelope

Each caster is grounded. Each matching base arm ends inside its caster's upper half; the shared hub clears all endpoints. All five roots meet the column, which ends at the seat underside. Increasing caster or spoke size reserves more perimeter clearance, pulling the shared radial ellipse inward. The shared inset adjusts that clearance further without changing angular slot IDs. Independent dimensions and finishes are retained as endpoints move.

Seat thickness adjusts column height. The back extends to the seat underside and intersects its rear edge, correcting the old visible gap. Arm supports intersect the seat and their corresponding armrest. Conservative independent height limits maintain positive column and support lengths. Armrest outer edges establish width; the seat front/back establish depth; the back reaches total height. High/low models have the same IDs, valid normals and complete leaf ownership without post-build rescaling.

These are visual assemblies: no swivel, tilt, caster rotation, telescoping mechanism or fabrication/structural validation is simulated.

## Compatibility and verification

Historical v1/v2/v3 whole-object office-chair exports retain dimensions/colors/materials and acquire revision 1. Part-bearing v3 files require the exact revision. Invalid slots, unsupported member fields, future revisions and invented construction counts fail before replacing workspace/history. Original saves are pinned in `tests/fixtures/office-chair-whole-object-legacy.json`.

Converted appearance can differ because of explicit grounded casters, connected base/column/seat/back anchors and final component dimensions. The 23 previously released high/low meshes remain byte-identical, pinned in `tests/fixtures/released-v17-hashes.json`; unsupported objects retain legacy geometry.

`tests/office-chair.test.mjs` checks defaults, combined/minimum/maximum/mixed/asymmetric limits, measured spoke end sections, caster diameters/heights, grounding, attachments, angular identity, ownership/normals, inheritance, history, strict imports and released meshes. `tests/browser/office-chair.spec.mjs` covers actual export/import/reload, group operations, caster mouse/native-touch picking, software fallback and invalid-import history preservation. Captures use `docs/images/office-chair-{desktop,tablet,mobile}.png`.

No dependency versions changed. The npm audit on 2026-10-27 reports zero vulnerabilities; no forced dependency remediation is used.

Local verification passed: **83 Node tests and 171 Chromium scenarios** across desktop, tablet and mobile. Office-chair workflows were also rerun while refreshing all three captures after normalizing their viewport position. The desktop, tablet and mobile captures were visually reviewed. Syntax, deterministic build/source exclusions and source/build secret checks passed. Production output contains 30 static files. The local HTTP smoke test required loopback access after the sandbox denied its initial connection; it then passed unchanged.
