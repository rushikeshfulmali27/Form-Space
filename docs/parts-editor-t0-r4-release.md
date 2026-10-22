# T0 and R4: dynamic cushion membership — v1.7.0

Implemented 2026-10-22 following the [T0/R4 plan](parts-editor-t0-r4-plan.md). `sofa` and `reception-sofa` bring Parts Editor coverage to **23/72**, with **49 remaining**. R5 office chair is next. Shelving and tier builders still need their own adapters for existing shelf counts and ordered placement; this release does not enable them.

## Shared construction contract

The registry accepts either static definitions or a trusted `parts(design)` function. `construction.js` validates profile-owned integer fields and provides an atomic count command that removes inactive overrides. Existing fixed profiles use their original contracts and geometry.

The first construction field is `construction.cushionCount`, integer **1–4**, owned by revision-1 `sofa`. Increasing count appends numbered slots; decreasing removes highest slots and their active overrides. Surviving slots retain edits. Re-adding a removed slot creates inherited defaults; Undo restores the previous design exactly. A count change creates one history entry. Selection and expansion remain temporary UI state and do not create history entries.

`PartsControls` renders the count select outside the member list so it retains focus during topology changes. Surviving selected members and expanded groups persist. If a selected slot disappears, selection falls back to its surviving parent. Undo restores data while retaining any still-valid current selection; it does not time-travel temporary UI selection. Switching objects clears selection. The existing inspector still uses root groups, not arbitrary recursive nesting.

## Sofa profiles and connections

Both sofas expose base, back, two arms, 1–4 cushions and four grounded legs. There are `8 + count` leaf meshes; groups reference members rather than duplicating triangles. Rounded forms remain. Whole width/depth/height define the outer envelope; component dimensions are final and never globally rescaled.

The base anchors cushions and legs. Back and arms overlap the base; each cushion meets the base top and overlaps the back slightly. Cushion width is derived from space between the independently sized arms and the shared gap. Leg length follows the base underside. All semantic parts have independent finish/color; arms, cushions and legs also have group defaults with member overrides.

Settings are centimeters rounded to hundredths. Let `H`, `W`, `D` be whole dimensions and `M = min(W,D)`:

| Setting           | Default                 | Limits                        |
| ----------------- | ----------------------- | ----------------------------- |
| Base top height   | `0.40H`                 | `0.32H`–`0.48H`               |
| Base thickness    | `0.20H`                 | `0.10H`–`0.22H`               |
| Back depth        | `0.22D`                 | 0.3–`0.24D`                   |
| Arm top height    | `0.735H`                | `0.70H`–`0.85H`, group/member |
| Arm width         | `0.08W`                 | 0.3–`0.15W`, group/member     |
| Cushion thickness | `0.16H`                 | 0.3–`0.18H`, group/member     |
| Cushion gap       | `0.012W`                | 0–`0.02W`, shared             |
| Leg section       | `max(0.3,min(5,0.08M))` | 0.3–`0.12M`, group/member     |

These conservative independent limits keep positive leg lengths, cushion widths and space below arm tops at combined extremes. Future families can reuse dynamic definitions and active-slot commands, but their specific clearance/position constraints must be implemented and tested separately.

## Persistence and migration

The v3 export envelope and storage keys remain unchanged. New sofa v3 files explicitly carry revision 1 and complete construction settings. Missing/future revisions, missing or unknown construction fields, non-integer/out-of-range counts and inactive member IDs fail before replacing current state. Explicit construction data on profiles without a construction schema is rejected. Older format versions cannot carry new construction data.

Legitimate historical v1/v2/v3 whole-object sofas without parts, revision or construction migrate to two cushions at original width ≤190 cm and three above. This choice is captured **before width rounding** (including widths such as 190.4 cm). Future width edits preserve the explicit count. Historical exports are pinned in `tests/fixtures/sofas-whole-object-legacy.json`.

Converted sofa geometry can differ from the old globally scaled model: the base fills the declared footprint, parts have explicit connected anchors, rounded members fit independent dimensions and grounded legs follow the base. The 21 already-released high/low meshes remain byte-identical, pinned in `tests/fixtures/released-v16-hashes.json`. Unconverted models retain legacy geometry and regression checks.

## Verification and limits

`tests/sofas.test.mjs` covers all four counts, default/combined/mixed/asymmetric dimensional extremes, measured attachments, unit normals and complete ownership; count removal/re-add, history branching, semantic diffs, selection reconciliation, strict migration and old geometry hashes. `tests/browser/sofas.spec.mjs` exercises both IDs with real export/import/reload, count-control focus, surviving/deleted selection, group apply/reset, threshold edits, invalid imports, mouse/native-touch picking and software fallback. Responsive captures use `docs/images/sofa-{sofa,reception-sofa}-{desktop,tablet,mobile}.png`.

The current npm audit reports zero vulnerabilities; dependency versions are unchanged. Count and component-dimension text prompts direct users to the inspector. No articulation, physical upholstery simulation, arbitrary member insertion, shelf conversion or fabrication output is added.

Local verification passed: **77 Node tests and 162 Chromium scenarios** across desktop, tablet and mobile. Count workflows were also rerun on all three sizes after correcting removed-slot feedback to say Removed rather than Inherited. Representative Studio sofa desktop/mobile and Reception sofa tablet captures were reviewed. Syntax, deterministic build/source exclusions and source/build secret checks passed. Production output contains 28 static files.
