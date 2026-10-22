# R2: chairs and stools — v1.5.0

Implemented 2026-10-22. This batch enables `lounge-chair`, `meeting-chair`, `dining-chair`, `visitor-chair`, `outdoor-chair`, `bar-stool` and `breakfast-stool`. Parts Editor coverage is **19 of 72 objects**, with **53 remaining**. R3 benches are next; variable-count sofas and shelves still require T0.

## Construction and controls

All four seating profiles use revision 1 and the `seating` builder. Exact defaults/limits are defined in `public/studio/parts-seating.js`; `geometry-seating.js` emits final dimensions in meters. Saved settings are centimeters with hundredth-centimeter precision. Interactive edits clamp to feasible limits; strict imports reject malformed or out-of-range data.

| Profile         | Objects         | Components                                                                                                    |
| --------------- | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `armchair`      | Lounge, Meeting | Seat, solid back, four splayed legs, two armrests and two arm supports; root groups expose individual members |
| `armless-chair` | Dining, Visitor | Seat, solid back and four legs; no arm definitions or controls                                                |
| `slatted-chair` | Outdoor         | Seat, five stable back slats, four legs, two armrests and two arm supports                                    |
| `stool`         | Bar, Breakfast  | Seat, four splayed legs and four stretchers; seat supports round/oval and square/rectangular shape            |

Every semantic component has an independent finish/color. Dimensions for back slats are shared by the slat group; each slat has its own finish. Arm supports inherit frame finish and expose independent finishes; their size/endpoints derive from their matching armrest and seat, rather than a misleading independent length control.

## Parameter contract

Let `H` be total height, `W` width, `D` depth and `M = min(W,D)`, all in centimeters. Limits are quantized to saved precision by the parts facade.

| Setting                        | Default                         | Limits                          |
| ------------------------------ | ------------------------------- | ------------------------------- |
| Chair seat top height          | `0.5325H`                       | `0.30H`–`0.55H`                 |
| Chair seat thickness           | `0.105H`                        | 0.3–`0.12H`                     |
| Stool seat thickness           | `min(5,0.08H)`                  | 0.3–`0.15H`                     |
| Back/back-slat thickness       | `0.15D`                         | 0.3–`0.18D`                     |
| Outdoor back-slat gap          | `0.0125W`                       | 0–`0.025W`                      |
| Leg section                    | `max(0.3,0.068M)`               | 0.3–`0.12M`                     |
| Armrest top height             | `0.64H`                         | `0.62H`–`0.80H`                 |
| Armrest section                | `min(0.07W,0.10D,0.05H)`        | 0.3–`min(0.12M,0.05H)`          |
| Shared stretcher center height | `0.30H`                         | `0.15H`–`0.45H`                 |
| Stretcher section              | `max(0.3,min(2.2,0.07M,0.05H))` | 0.3–`max(0.3,min(0.07M,0.05H))` |

Leg sections, armrest height/section and stretcher sections can be overridden per member. Seat height, back dimensions, slat gap and stretcher height belong to their semantic part/group. Whole width/depth/height remain authoritative. Group edits preserve member overrides until Apply group settings or Reset group and members; both are undoable.

## Connections and envelope

- Chair backs span from seat underside to total height and overlap the rear seat edge. Chair seat top height is measured from the floor; thickness changes its underside and leg length.
- Four splayed square legs have horizontal end faces, grounded at zero and attached to the seat underside. Section describes a horizontal cross section, not the complete bounding width of a slanted leg.
- Armrests fit within the full width and meet the back. Each support follows its own armrest and overlaps the seat and armrest; derived section keeps it inside the envelope. Conservative independent ranges leave positive support length at combined limits.
- Outdoor slat width is `(W - 4 × gap) / 5`. All five IDs remain fixed, and individual finishes survive gap changes.
- Stool seat defines full width/depth and top height. Upper leg anchors fit inside oval seats. Stretcher endpoints track the interpolated leg positions at their shared height, preserving connections when thickness, height or shape changes.
- Bounds match the declared whole dimensions with no post-build global rescaling. Groups reference leaf meshes without emitting duplicate triangles.

## Save compatibility and limits

Legitimate v1/v2/v3 whole-object seating exports acquire the current profile without changing saved dimensions, colors or materials. New component-bearing v3 exports require revision 1. Unknown/future revisions, invalid member IDs and unsupported arm settings on armless chairs are rejected before replacing the design.

Converted seating can differ visually from the old globally scaled model: grounded horizontal post ends, a connected back/seat, attached arm supports, explicit seat top height and adjusted support layout now determine geometry. All **12 previously released parts-enabled objects retain byte-identical high/low meshes**, pinned in `tests/fixtures/released-v14-hashes.json`. Unconverted catalog models retain their legacy builder and hash checks.

Component-dimension text prompts direct users to Individual parts rather than partially changing whole-object dimensions. No articulation, recline, tilt, arbitrary new components, structural validation or manufacturing output is added.

## Verification

`tests/seating.test.mjs` checks complete leaf ownership, unit normals, feasible controls and exact bounds at combined minimum/maximum and asymmetric dimensions, attachment endpoints, member inheritance/apply/reset/history, slat identity, strict imports and released mesh hashes. `tests/browser/seating.spec.mjs` covers each new ID with real export/import/reload, group/member operations and mouse/native-touch picking in WebGL and software mode. Additional construction cases exercise armrests, slats and stretchers.

Responsive captures for the four distinct constructions use `docs/images/seating-{lounge-chair,dining-chair,outdoor-chair,bar-stool}-{desktop,tablet,mobile}.png`. Existing release captures remain archived.

No dependency versions changed. The current npm audit reports zero vulnerabilities; no dependency remediation is needed for this report.

Local release verification passed: **64 Node tests and 126 Chromium scenarios** across desktop, tablet and mobile. The four seating constructions were reviewed in desktop/tablet/mobile screenshots. Syntax, deterministic build/source exclusions and source/build secret checks are release gates. Historical whole-object files are pinned in `tests/fixtures/seating-whole-object-legacy.json`; existing models retain their archived screenshots.
