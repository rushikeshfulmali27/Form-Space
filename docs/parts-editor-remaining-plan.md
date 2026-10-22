# Parts Editor: implementation plan for the remaining 49 objects

Reviewed against v1.7.0 on 2026-10-22. The runtime registry enables **23 of 72 objects**. This plan covers the other **49**. R1–R4 and shared gate T0 are complete. See [T0/R4 notes](parts-editor-t0-r4-release.md) for dynamic cushion construction and save/selection behavior.

Use the [JSON backlog](parts-editor-remaining-backlog.json) for exact membership and prerequisites, the [catalog map](parts-editor-catalog-map.md) for construction details, and the [architecture roadmap](parts-editor-all-objects-plan.md) for shared contracts. Keep the existing browser modules, renderer, static build and GitHub Pages hosting.

## 1. Feature scope

Users can select an actual component on the canvas or in the parts list, edit valid dimensions and finishes, and see attached parts follow. Repeated components have linked group settings plus individual overrides. Reset, apply-to-members, undo/redo, local saving and JSON import/export work consistently.

Preserve each model's real construction. Armless chairs have no arm controls; closed cabinets do not acquire invented open bays. Plinths and vase receive meaningful body selection. Free transforms, adding arbitrary components, animation, exploded views, CAD export and fabrication simulation remain separate features.

## 2. Delivery order and full coverage

Every unsupported catalog ID appears exactly once below. Coverage includes the 23 already released. T0 was validated with R4; future shelf/tier adapters and ordered placement remain family-specific work.

| Batch                           | Exact object IDs                                                                                                                                              | Count | Parts and controls                                                                        | Coverage after batch |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | ----------------------------------------------------------------------------------------- | -------------------: |
| R5 — office chair               | `office-chair`                                                                                                                                                |     1 | Seat, back, arms, support column, five base/caster slots                                  |                24/72 |
| R6 — shelving                   | `bookshelf`, `wall-shelving`, `display-rack`, `shoe-rack`, `display-cabinet`                                                                                  |     5 | Frame/panels, shelf count, individual shelves and constrained placement                   |                29/72 |
| R7 — closed storage             | `tv-unit`, `wardrobe`, `bedside-table`, `filing-cabinet`, `drawer-unit`, `storage-locker`                                                                     |     6 | Carcass, back/plinth, individual fronts/handles, locker vents                             |                35/72 |
| R8 — bedroom/wall shelf         | `wall-shelf`, `bed-frame`, `dressing-table`                                                                                                                   |     3 | Shelf/brackets; bed frame/headboard/mattress/pillows/legs; vanity top/mirror/drawer block |                38/72 |
| R9 — counters                   | `kitchen-island`, `reception-desk`, `service-counter`, `bar-counter`, `checkout-counter`                                                                      |     5 | Top, body, plinth and individual front panels                                             |                43/72 |
| R10 — stands/retail             | `pastry-display-stand`, `plant-stand`, `garment-rail`, `hanging-rack`, `accessory-stand`, `brochure-holder`, `promotional-stand`, `freestanding-logo-display` |     8 | Tiers/platforms, posts/rails, pockets, shelves and current logo mark                      |                51/72 |
| R11 — lighting                  | `floor-lamp`, `table-lamp`, `pendant-light`, `pendant-lamp`, `chandelier`, `wall-lamp`, `wall-light`                                                          |     7 | Bases/mounts, stems, shades/diffusers and fixed light-head members                        |                58/72 |
| R12 — mirrors/partitions/boards | `mirror`, `mirror-stand`, `workstation-partition`, `decorative-partition`, `fitting-room-partition`, `whiteboard-stand`, `menu-stand`, `signboard`            |     8 | Frames/surfaces, solid/slatted/return panels, posts/feet and A-frame supports             |                66/72 |
| R13 — planters/sculpture        | `planter`, `hanging-planter`, `decorative-sculpture`                                                                                                          |     3 | Pot, soil, foliage, suspension and connected sculpture forms                              |                69/72 |
| R14 — single-body forms         | `display-plinth`, `product-pedestal`, `vase`                                                                                                                  |     3 | Selectable body, valid dimensions/shape and finish                                        |                72/72 |

Remaining counts: **1 + 5 + 6 + 3 + 5 + 8 + 7 + 8 + 3 + 3 = 49**. Recommended sequence: R5 through R14. Backlog prerequisites are distinct from this recommended order. T0 is complete; adapt its commands and definitions to existing shelf/tier count fields before those families ship.

## 3. Completed R2 chairs and stools (v1.5)

The seven-object release contains four construction slices:

1. **R2a: lounge and meeting chairs.** Seat, solid back, four named legs, left/right armrests and their modeled supports. Seat height is separate from total height. Seat thickness moves leg endpoints; back and arm supports follow their anchors.
2. **R2b: dining and visitor chairs.** Reuse the seat/back/leg solver with armless definitions. Reject arm overrides and expose no unused arm controls or geometry.
3. **R2c: outdoor chair.** Preserve its five back slats and the arms present in current geometry. Use linked slat thickness/gap with independent finishes and stable IDs. Derive slat width from available width and gap; keep count fixed.
4. **R2d: bar and breakfast stools.** Seat, four legs and current stretchers. Bound section and stretcher height so joints stay connected. Preserve each catalog object's proportions and finishes.

Proposed names include `seat`, `back`, `legs.front-left`, `legs.rear-left`, `legs.front-right`, `legs.rear-right`, `armrests.left/right` and `back-slats.01`–`.05`. Final IDs must follow actual leaf ownership and be documented before exporting new part data. Keep armrests and their supports in separate root groups if necessary; the current inspector does not support arbitrary nesting.

Initial controls: seat height/thickness, solid-back thickness or shared back-slat thickness/gap, leg section, armrest height/section where modeled, stretcher section/height on stools, and finish/color per component. Overall width/depth/height remain the outer-envelope controls. Do not add unsupported recline or swivel settings.

Define every field's units, default, min/max and attachment endpoints before building its control. Seat height must leave room for thickness, arms and back. Constraints must remain feasible across current overall ranges: width 20–240, depth 4–240, height 20–240 cm. Explain dependent adjustments; never generate negative dimensions.

R2 delivered all seven objects and raised coverage to **19/72**, preserving the 12 earlier released meshes. R3 is complete: four seat slats, connecting bearers and legs, plus three garden back slats and supports, reaching **21/72**.

## 4. Completed T0 foundation (v1.7)

T0 now supports profile-owned construction and dynamic definitions, active-slot pruning, atomic count edits and selection/focus reconciliation. The sofa integration proves the rules below; shelf/tier adapters and ordered placement are still required in R6/R10.

- **Trusted topology:** derive active definitions from profile-owned normalized construction through the shared facade. Keep fixed profiles working. Imported data cannot select builders.
- **Count ownership:** keep shelf/tier count in `design.shelves`. V1.7 has an explicitly validated 1–4 sofa cushion count and revisioned schema. Migration captures two cushions at original width ≤190 cm and three above it, before width rounding. After migration, width changes resize the chosen layout without changing count.
- **Stable slots:** number shelves bottom-to-top and cushions consistently. Increasing count appends defaults. Decreasing removes highest slots and active overrides. Surviving slots retain edits; re-adding after a committed decrease creates defaults. Undo restores the exact previous snapshot.
- **Selection/focus:** preserve a surviving selected ID; select its surviving parent or clear when removed. Object switching still clears selection. Reconcile inspector, WebGL and software state during edits, history, reload and import.
- **Atomic commands:** one count change plus clearance/position adjustments creates one history entry. Solve slider previews from the gesture's starting snapshot and explain clamped values.
- **Strict persistence:** validate counts, construction fields and active IDs before replacing state. Do not silently ignore supplied unknown/future construction data. Preserve import limits and honest storage-failure feedback.

T0 verification: unit/browser cases cover increase/decrease/re-add, surviving/deleted overrides, selected-member removal, undo/redo branching, invalid/inactive members, legacy migration, reload and real export/import. T0 alone does not increase object coverage.

## 5. Construction rules for later families

### R4–R5: sofas and office chair

Fit sofa cushions between modeled arms and preserve rounded forms and migrated counts. Office chair members keep five fixed angular base/caster slots and separate seat/back/arm/support ownership. These controls do not imply tilt, swivel or lift animation.

### R6–R8: storage and bedroom

Solve carcass thickness and interior clearances before shelves/fronts and handles. Shelves stay ordered and inside openings; expose individual placement only once coupled spacing rules pass. Preserve current count meanings: the open display cabinet has `shelves - 1` internal boards plus carcass boards, while shelf/rack builders count generated shelf boards directly.

Keep door/drawer-front counts fixed. Handles follow their own front. Current drawer models contain fronts/handles, not drawer boxes; the media cabinet has closed vertical panels. Locker vents remain decorative members. Pillows follow mattress placement, vanity mirror surface fits its frame, and wall-shelf brackets stay attached to the board.

### R9–R10: counters and stands

Top thickness adjusts counter body height within the envelope; panels and plinth follow. Pastry tiers taper with level and attach to posts; their count requires T0. Plant platforms retain corresponding supports. Only `hanging-rack` has the modeled lower shelf.

Brochure pockets may remain semantic back/floor/lip assemblies with independent size/finish inside their layout. The logo display retains its fixed three-bar mark. Text editing, uploaded logos and new hooks are separate work.

### R11: lighting

Use the correct floor, wall or ceiling anchor. Hanging height is the full ceiling-to-bottom drop. Shades/diffusers fit together and stems remain positive at limits. Chandelier members keep fixed angular IDs. Finishes do not imply emitted light, optical simulation or transparency.

### R12–R14: décor and body forms

Mirror surfaces fit their frames; only standing variants get supports. Keep solid, nine-slat and corner-return partitions distinct. Whiteboard posts/feet differ from A-frame menu/sign supports.

Extract lathe/foliage helpers only as needed and preserve objects still using legacy geometry. Pot rims anchor soil/foliage; straps converge at the upper anchor; sculpture forms retain bounded overlap. Plinths and vase get body controls. Optional vase finish regions must share connected surface rings and belong to a later enhancement.

## 6. Technical work and save compatibility

| Area                         | Planned work                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Registry and family profiles | Explicit ID registrations, fields/defaults/limits, stable groups/members; enable only verified objects                                |
| Parts facade                 | Dynamic definitions, construction-aware defaults/limits and commands; preserve current precision/inheritance                          |
| Family geometry builders     | Shared primitive writer, final dimensions and explicit anchors; one owner per triangle, groups reference members                      |
| Inspector                    | Validated count/position controls, surviving selection/focus; retain root groups until recursive behavior is deliberately implemented |
| Design/history/storage       | Explicit construction normalization/validation, profile migrations and atomic edits                                                   |
| Build/CI                     | Allowlist added modules, capture family fixtures and browser checks; measure suite duration as coverage grows                         |

Retain the v3 export envelope where compatible; use trusted per-profile revisions. Do not bump the format for each family. Incompatible changes to an enabled profile require migration. Protect all **23 released objects**, IDs and saved meanings.

Newly enabled objects must accept legitimate historical v1/v2/v3 whole-object saves. Missing revision is allowed only on a verified legacy path with no part overrides or new construction data. Reject future revisions, malformed construction and invalid members before replacing the design. Preserve the 100 KB import limit, v3→v2→v1 storage lookup, corrupt newer data, backups and blocked/quota feedback. Document visual changes from replacing old whole-mesh rescaling with final component dimensions.

## 7. Repeatable workflow per batch

1. Audit each legacy builder; capture high/low mesh hashes and old whole-object save fixtures before changing geometry.
2. Specify each numeric field, default, precision, limits, anchor, dependent adjustment and import behavior; identify parts defining the outer bounds.
3. Implement pure profiles/solvers and family geometry, preserving distinct constructions and leaf ownership.
4. Connect inspector, picking, group inheritance/apply/reset and atomic history.
5. Add legacy migration and strict validation; preserve unrelated overrides.
6. Complete unit/browser/visual verification, then register the verified IDs and update coverage records.
7. Publish a complete tested batch through GitHub Pages and compare public manifest/assets with the approved build.

## 8. Completion checks

A batch is complete only when:

- Exact IDs appear once in the catalog/backlog and runtime coverage matches declared status.
- Component/envelope measurements match the inspector; vertices/normals stay valid at combined limits; high/low detail use matching IDs and complete leaf ownership.
- Connections remain valid and unrelated overrides survive. Group/member inheritance, apply and reset work correctly.
- Mouse/native-touch picking, occlusion, empty gaps, highlighting, keyboard access, orbit separation and software fallback pass.
- Undo/redo, single-step gestures, local reload and actual exported-file import pass. Count-dependent families also meet T0.
- Legacy fixtures migrate; invalid/future/inactive-member settings preserve current state. Released meshes and unchanged legacy objects remain protected.
- Syntax, Node tests, deterministic build/source exclusions, secret checks, npm audit and browser scenarios pass; review desktop/tablet/mobile captures for each distinct construction.
- GitHub validation/deployment succeeds and public files match the build; release notes state actual supported and remaining counts.

Every newly enabled object needs browser coverage, with focused cases for distinct connection/count behavior. Keep cases small enough to diagnose. The v1.4 regression baseline had **56 Node tests and 81 Chromium scenarios**, not a fixed final test target. Measure the 15-minute CI budget before splitting jobs or changing timeouts.

## 9. Next action

Implement **R5: office chair** to reach **24/72**, preserving its five fixed base/caster slots and modeled supports. Then implement R6 shelving with adapters for the existing shelf count and ordered placement rules. Completion means **72/72**, including honest body-only editing for single-piece forms.

No calendar estimate is committed. Use measured seating/T0 implementation and verification time to size later batches; ship reviewed construction families rather than enabling unfinished entries.
