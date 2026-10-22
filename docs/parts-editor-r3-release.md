# R3: benches — v1.6.0

Implemented 2026-10-22 following the [R3 plan](parts-editor-r3-plan.md). `garden-bench` and `cafe-bench` bring Parts Editor coverage to **21/72 objects**, with **51 remaining**. Shared gate T0 is next, before variable-count sofas, shelves and tiers.

## Profiles and geometry

Both revision-1 profiles use the `bench` builder. `backrest-bench` has 15 selectable leaves: four seat slats, two bearers, four legs, three horizontal back slats and two back supports. `backless-bench` has the same ten seat/frame leaves and no back members. Root groups support linked settings, custom members, apply/reset and history.

Two under-seat bearers are an explicit correction to the legacy geometry, whose middle seat boards lacked a modeled connection to the legs. They span the seat depth, meeting the thinnest board's underside and overlapping thicker boards. All boards share one top plane; legs have grounded horizontal end faces and follow each bearer's underside. This intentional frame/board overlap keeps the assembly connected.

Garden seat top height is independent of total height; Café seat top defines total height. Garden back slats attach to two posts starting within the rear seat board. Each back board can have its own vertical height, front/back thickness and finish. Derived spacing fits all three boards above the seat, with the last board and posts ending at total height. Counts stay fixed. All dimensions are final measurements without post-build mesh rescaling.

## Parameter contract

Settings are centimeters, rounded to hundredths. Let `H`, `W`, `D` be whole height, width and depth, and `M = min(W,D)`.

| Setting                | Default                       | Limits / ownership                                   |
| ---------------------- | ----------------------------- | ---------------------------------------------------- |
| Garden seat top height | `0.54H`                       | `0.35H`–`0.58H`, shared by seat group                |
| Seat thickness         | `min(4,0.10H)`                | 0.3–`0.12H`, group or individual board               |
| Seat gap               | `0.025D`                      | 0–`0.04D`, shared; slat depth is `(D − 3 × gap) / 4` |
| Bearer section         | `max(0.3,min(4,0.08M,0.05H))` | 0.3–`min(0.10M,0.06H)`, group/member                 |
| Leg section            | `max(0.3,min(5,0.08M))`       | 0.3–`0.12M`, group/member; horizontal cross section  |
| Back-slat height       | `0.105H`                      | `0.04H`–`0.12H`, group/member                        |
| Back-slat depth        | `min(2.5,0.08D)`              | 0.3–`0.12D`, group/member                            |
| Back-support section   | `max(0.3,min(3.5,0.08M))`     | 0.3–`0.10M`, group/member                            |

Back spacing is `(H − seatTop − 0.03H − sum(backBoardHeights)) / 2`, derived rather than independently editable. The conservative ranges keep it positive at combined limits. Back depth/post section determine their shared rear centerline inside the envelope. Every semantic part has an independent visual finish/color. Custom member settings survive group edits until Apply group settings or Reset group and members.

## Compatibility

Historical v1/v2/v3 whole-object bench files acquire revision 1 and retain saved dimensions/colors/materials. New part-bearing v3 files require the exact revision. Invalid IDs, future revisions, unsupported member fields and Café back settings fail before replacing current state. Fixtures are pinned in `tests/fixtures/benches-whole-object-legacy.json`.

Converted bench appearance can change because of the added bearers, explicit level seat plane, grounded leg ends and connected back layout. All **19 previously released objects retain byte-identical high/low geometry**, pinned in `tests/fixtures/released-v15-hashes.json`, including after extracting the existing square-post writer into the shared primitive module. Unconverted objects keep legacy builders and geometry checks.

## Verification and scope

`tests/benches.test.mjs` covers default, minimum, maximum, mixed member and asymmetric dimensions; exact measurements/gaps, feasible controls, valid normals, ownership, connections, independent overrides, history, migration and invalid imports. `tests/browser/benches.spec.mjs` covers both IDs with real exported-file import, reload, group/member operations, garden-back edits, mouse/native-touch picking and software fallback. Captures use `docs/images/bench-*` on desktop/tablet/mobile; older releases retain their archived images.

Runtime dependencies and pinned development package versions remain unchanged. Current npm audit reports zero vulnerabilities. Counts, free movement, removal, articulation and fabrication/structural validation are outside this batch.

Local release checks passed: **69 Node tests and 144 Chromium scenarios**, covering desktop, tablet and mobile. Representative garden-back desktop, Café bench tablet and Garden bench mobile captures were visually reviewed. Syntax, deterministic build/source exclusions and source/build secret checks passed. The production output contains 25 static files; the local browser suite completed in six minutes, within the existing CI budget.
