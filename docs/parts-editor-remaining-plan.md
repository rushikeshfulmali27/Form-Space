# Parts Editor: remaining-object execution plan

Original planning baseline: v1.3.0 (8 enabled, 64 remaining). R1 is implemented in v1.4.0 on 2026-10-22: 12 objects now support Parts Editor and 60 remain. Batch membership below preserves the original 64-object rollout; R1 is complete, R2–R14 and T0 remain planned.

Use this as the execution plan, the [catalog mapping](parts-editor-catalog-map.md) for each object's parts and connection rules, and the [machine-readable backlog](parts-editor-remaining-backlog.json) for batch membership/dependencies. The existing [architecture roadmap](parts-editor-all-objects-plan.md) remains the shared design reference.

## 1. What is already complete

The three pedestal tables and five standard desks/tables are released. Their shared foundation includes:

- Trusted object/profile registry; revision-1 v3 part schemas; validated v1/v2/v3 migration paths.
- Final-dimension geometry for enabled profiles; shared triangle, box, cylinder, beam and ellipsoid writing.
- Stable fixed leg/foot IDs, linked defaults, member overrides, apply-to-members, group/member reset and undo/redo.
- Leaf triangle picking, group highlighting without duplicate geometry, native group expansion and a vertically scrollable inspector.
- WebGL/software fallback, touch/keyboard controls, original-snapshot dimension previews and responsive browser checks.
- Deterministic static output, explicit asset allowlists, secret/security checks and GitHub Pages deployment.

Preserve these eight released objects and their saved IDs. Do not rebuild the pilot or introduce a new renderer/framework. Runtime dependencies and hosting remain unchanged unless a measured need emerges.

## 2. Delivery order and exact coverage

Every ID from the original remaining-64 baseline appears exactly once below. Dependencies allow independent batches to be implemented in a different order if useful; the recommended sequence is R1 → R2 → R3 → T0 → R4 through R14. The JSON backlog records the same membership. A batch is complete only when all of its IDs meet the release gates.

| Batch | Objects                                                                                                                                                       | Count | Main deliverable                                                                               |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----: | ---------------------------------------------------------------------------------------------- |
| R1    | `standing-desk`, `corner-desk`, `patio-table`, `laptop-stand`                                                                                                 |     4 | Complete the desk/table wave with distinct two-column, L-shaped, slatted and platform builders |
| R2    | `lounge-chair`, `meeting-chair`, `dining-chair`, `visitor-chair`, `outdoor-chair`, `bar-stool`, `breakfast-stool`                                             |     7 | Seats, backs, arms where present, legs and stretchers; fixed member editing                    |
| R3    | `garden-bench`, `cafe-bench`                                                                                                                                  |     2 | Seat slats/legs; back slats/supports only for garden bench                                     |
| R4    | `sofa`, `reception-sofa`                                                                                                                                      |     2 | Cushion identity/count migration, frame/back/arms/legs and member editing                      |
| R5    | `office-chair`                                                                                                                                                |     1 | Seat/back/arms, lift column, five base arms and caster assemblies                              |
| R6    | `bookshelf`, `wall-shelving`, `display-rack`, `shoe-rack`, `display-cabinet`                                                                                  |     5 | Variable shelves, frame/post variants, individual placement and thickness                      |
| R7    | `tv-unit`, `wardrobe`, `bedside-table`, `filing-cabinet`, `drawer-unit`, `storage-locker`                                                                     |     6 | Carcass, back/plinth, individual fronts/handles and locker vents                               |
| R8    | `wall-shelf`, `bed-frame`, `dressing-table`                                                                                                                   |     3 | Brackets; bed frame/headboard/mattress/pillows; vanity top/mirror/drawer block                 |
| R9    | `kitchen-island`, `reception-desk`, `service-counter`, `bar-counter`, `checkout-counter`                                                                      |     5 | Counter body/top/plinth and separate front panels                                              |
| R10   | `pastry-display-stand`, `plant-stand`, `garment-rail`, `hanging-rack`, `accessory-stand`, `brochure-holder`, `promotional-stand`, `freestanding-logo-display` |     8 | Tiers, platforms, rails, pockets, shelves and existing fixed logo geometry                     |
| R11   | `floor-lamp`, `table-lamp`, `pendant-light`, `pendant-lamp`, `chandelier`, `wall-lamp`, `wall-light`                                                          |     7 | Bases/plates/canopies, supports, shades/diffusers and radial light heads                       |
| R12   | `mirror`, `mirror-stand`, `workstation-partition`, `decorative-partition`, `fitting-room-partition`, `whiteboard-stand`, `menu-stand`, `signboard`            |     8 | Nested frame/surface, panels/slats, return panel and correct support variants                  |
| R13   | `planter`, `hanging-planter`, `decorative-sculpture`                                                                                                          |     3 | Pot/soil/foliage/straps and connected stacked forms                                            |
| R14   | `display-plinth`, `product-pedestal`, `vase`                                                                                                                  |     3 | Body editing that reflects genuinely single-piece geometry                                     |

Totals by original rollout wave: remaining desks 4; seating 12; storage/bed/vanity 14; counters/stands 13; lighting 7; décor/forms 14. Total **64**, covering **39 remaining construction profiles**.

## 3. Completed implementation batch: R1 (v1.4.0)

Implemented these profiles independently instead of registering every remaining `kind: desk` against the standard-desk solver.

### Standing desk

- Parts: tabletop, left/right columns, left/right feet, rear brace; linked column and foot groups with individual members.
- Controls: top thickness/shape/size, column cross-section, foot footprint/thickness and brace thickness. Height continues to come from the whole-object control.
- Connection rules: columns end at the tabletop underside and their respective feet; the brace spans supports. Increasing top thickness shortens columns. Keep two supports rather than the standard desk's four legs.
- First-release limits: retain existing construction; telescoping motion, travel limits and motor components are outside scope.

### Corner desk

- Parts: main top, return top and five named support legs. Preserve the existing two-slab L shape.
- Controls: shared top thickness, constrained return proportions, leg section and visual finishes. Define which slab establishes each outer edge before exposing its dimensions.
- Connection rules: top slabs share a height and attachment line; legs remain underneath their assigned slabs. Prevent return-width edits from producing gaps, negative slabs or unsupported legs.
- Use stable support IDs tied to slab position. Do not reuse four-leg IDs for a fifth support or silently transform the L shape into a rectangle.

### Patio table

- Parts: seven top slats, four legs, two feet and rear brace, with linked slat and support groups.
- Controls: top-slat thickness/gap, individual slat finish, leg/foot/brace controls. Keep the existing seven-slat count fixed in R1.
- Constraint: derive slat width from available width and gap; do not give both unconstrained values. Slats must span the frame and preserve the declared envelope. Define the behavior of the existing shape control so switching shape cannot silently discard slat settings.

### Laptop stand

- Parts: platform, angled support, base and retaining lip.
- Controls: platform thickness, support section, base footprint/thickness and lip height.
- Connections: support endpoints follow the base and platform; lip stays on the platform's front edge. Preserve the current unhinged stand rather than adding articulation.

R1 delivered: all four objects support list/canvas selection, independent valid edits, inheritance/reset, undo, save/reload and export/import on desktop/tablet/mobile. Existing eight profiles and their geometry fixtures continue passing. This raises coverage from 8 to 12 objects. Next: R2 chairs/stools; complete T0 before variable-count objects.

## 4. Shared dependency T0: changing membership and construction

Fixed legs/feet are already implemented. Before R4 or R6, add changing membership without losing or misassigning custom settings.

### Profile-driven construction state

- Add a strictly validated profile-owned construction field when needed, for example `construction.cushionCount`. Normalize and serialize it explicitly; the current `normalize()` only copies known global fields and part overrides and would otherwise discard it.
- Keep existing shelf count in `design.shelves`; do not introduce a second competing count. Define a profile's topology from that count.
- Allow dynamic part descriptions from normalized construction, while retaining the current static `profile.parts` contract for fixed profiles. Update all consumers through the shared facade.
- Separate count changes from geometry-size edits. Group controls must not change construction implicitly.

### Stable member policy

- Shelf slots run bottom to top: `shelves.01` onward. Increasing count appends IDs; decreasing removes highest IDs. Surviving overrides retain their identities.
- A committed decrease removes deleted settings from the active design. Undo restores the exact old snapshot; re-adding after a committed decrease creates defaults. Do not keep invisible unlimited orphan overrides.
- Current sofa geometry chooses two/three cushions at width >190 cm. Migration captures that legacy count before edits. Once converted, width edits resize the current layout rather than silently changing cushion membership.
- Slot positions may reflow when count changes, but member identity must not be derived from world coordinates or triangle order. Clamp/reflow custom positions with explicit feedback.

### Selection reconciliation

The current inspector rebuilds and clears selection when its object/revision/ID signature changes. Replace this for topology changes: preserve a surviving selected ID; when removed, select its surviving parent group or clear if unavailable. Continue clearing selection when switching to another object. Reconcile the viewer and inspector together, including Undo/Redo and software fallback.

One count/position operation and its dependent adjustments must produce one history entry. Selection and expansion create none. During a slider gesture, solve from the gesture's starting snapshot; do not gradually erase values through intermediate clamping.

T0 completion: unit/browser cases for add/remove/re-add, surviving and deleted overrides, undo/redo branching, selected-member removal, invalid inactive IDs, save/reload and import validation. Only then enable variable-member furniture.

## 5. Family-specific implementation requirements

### Seating: R2–R5

- Define seat height separately from total height. Seat thickness changes leg endpoints; back height remains anchored to the top envelope.
- Armless variants expose no armrest definitions. The outdoor chair keeps its five existing back slats; benches keep their fixed four seat slats and optional three back slats.
- Stool stretchers follow the legs at a constrained shared height. Individual thickness/finish edits do not disconnect their endpoints.
- Sofas require T0 and an explicit cushion layout fitted between arms. Preserve existing soft rounded forms and current two/three-cushion defaults.
- Office chair has five fixed radial base/caster slots. Keep arm, caster and support ownership stable when dimensions change; no swivel/tilt mechanism is implied.

### Storage: R6–R8

- Solve carcass thickness and inner clearances first, then shelves/fronts, then handles and decorative details. A handle follows its own front, not a global shared transform.
- Shelves remain ordered, cannot cross and cannot exceed openings. Expose internal shelf positions only after count/spacing constraints are tested.
- Preserve count semantics: the current open display cabinet uses `shelves - 1` internal boards plus carcass boards, whereas shelf/rack families count their generated shelf boards directly. Label/migrate intentionally rather than changing the saved count's meaning.
- Keep cabinet front counts fixed for this rollout. Existing drawer models contain fronts/handles, not drawer boxes. The media cabinet currently has closed vertical panels; no open bays or glass may be invented.
- Locker vents are decorative bars. Bed pillows follow mattress/top; vanity mirror surface follows its frame; wall brackets retain endpoint attachment.

### Counters and stands: R9–R10

- Countertop thickness changes body height while preserving overall height; front panels and plinth follow their existing body anchors.
- Pastry trays taper with level and stay attached to posts. Its existing count uses T0. Plant stand's three stepped platforms keep their own corresponding supports.
- Only `hanging-rack` has the modeled lower shelf. Preserve that variant distinction.
- Brochure pockets can remain semantic pocket assemblies (back/floor/lip) while each pocket gets independent size/finish within its support layout.
- The logo display is the current fixed three-bar mark. Editing text, importing logos or adding hooks is outside scope.

### Lighting: R11

- Use the correct reference plane: floor for lamps, ceiling for pendants/chandelier, wall for wall lights. Overall hanging height is the full drop.
- Keep shades/diffusers nested; stem/suspension lengths fill the remaining distance. Enforce positive lengths at minimum overall height.
- Chandelier's five arms/heads keep angular slot IDs. No emitted light, optical simulation, wiring or transparency is implied by the geometry/material controls.

### Décor and forms: R12–R14

- Mirror surface stays inside its frame; only the standing variant gets support members. The current reflective look remains approximate shading.
- Solid, nine-slat and corner-return partitions have different definitions. Whiteboard posts/feet differ from A-frame menu/sign supports.
- Extract/reuse the remaining procedural helpers as needed: lathe and foliage are still local to `geometry.js`, rather than part of the shared primitive writer. Preserve unchanged models while moving them.
- Pot rim anchors soil/foliage; hanging straps converge at the upper anchor. Sculpture forms stay connected with bounded overlap.
- Plinths and vase are genuine single-body models. Provide body selection and meaningful size/shape/finish controls. Neck/body/foot finish regions on the vase are optional later work and must share connected surface rings. Do not invent removable subparts just to claim multiple parts per object.

## 6. Technical changes by area

| Area                    | Required work                                                                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registry/family modules | Add explicit ID/variant registrations only after the corresponding profile/builder/tests are complete; share recipes without conflating constructions                       |
| Parts facade            | Support dynamic member descriptions, construction-aware defaults/limits and well-defined inheritance; keep existing fixed groups unchanged                                  |
| Geometry                | Add small family builders consuming the shared writer; final measured dimensions and complete leaf ownership; preserve legacy generation for unconverted IDs                |
| Inspector               | Add count/position controls and conditional fields; preserve focus/selection during normal edits and surviving topology changes                                             |
| Commands/history        | Centralize count and coupled-position commands; return normalized design plus adjustment messages and commit compound edits once                                            |
| Import/export/storage   | Validate construction and active member IDs against trusted revisions; migrate legitimate older whole-object files without permitting unversioned part data                 |
| Tests/build/CI          | Add family fixtures and generated coverage; explicitly allow new modules; measure suite duration before splitting validation jobs or changing the current 15-minute timeout |

Keep one-level groups for families that fit the existing inspector. If a family truly requires nested groups, implement recursive rendering, descendant bounds/highlight and inheritance deliberately; the current UI creates member containers only for root groups. A flat group list is preferable to pretending arbitrary nesting already works.

Each exposed numeric field needs a parameter contract: units/precision, inherited default, computed min/max, anchor, dependents, interactive adjustment behavior and strict import behavior. Define those values while implementing the profile before enabling its UI. Preserve overall width/depth/height as the final envelope and keep feasible limits across supported extremes. No whole-mesh rescaling after independent part measurements.

## 7. Save compatibility policy

Continue the v3 envelope and per-object profile revision where the new schema fits; do not bump the envelope automatically for each family.

- Existing eight IDs, fields and member meanings stay stable. Any incompatible change to an enabled profile needs an explicit revision migration.
- Newly enabled objects must accept their legitimate historical v1/v2/v3 whole-object saves. Many existing v3 files lack `partsRevision` because the object was previously unsupported.
- Allow that legacy path only when revision, part overrides and new construction data are absent. Reject missing revision when member/construction data is supplied. Never broadly accept unknown future revisions.
- Validate legacy fields before migration. Derive defaults/counts from the original construction; keep old export fixtures and document visual differences caused by removing global scaling.
- Unknown IDs, fields, impossible arrangements, inactive members, malformed construction and oversized files must fail before replacing current design/history.
- Retain the 100 KB limit and current v3→v2→v1 storage lookup. Corrupt newer data must not be hidden by an older save. Preserve backup values and truthful blocked/quota feedback.

## 8. Definition of done for each batch

1. **Coverage:** exact IDs/variants appear once in the catalog map and backlog; runtime registry matches declared implementation status.
2. **Parameter specification:** every editable field has the numeric/anchor contract above; no meaningless or unsupported controls.
3. **Geometry:** final component/whole bounds match labels; triangles belong to exactly one leaf; groups only reference descendants; high/low detail IDs agree; normals/vertices remain valid at combined extremes.
4. **Connections:** editing one part preserves unrelated overrides and correctly moves attached dependents. Test actual mesh measurements and endpoints.
5. **Interaction:** list and mouse/native-touch selection, frontmost hit/empty gaps, group/member highlight, keyboard access, orbit separation, responsive layout and context-loss fallback pass.
6. **State:** reset/apply/inheritance, single-step gestures, topology/history branching, selection reconciliation and save/reload work.
7. **Compatibility:** original fixtures migrate, current schemas round-trip and invalid imports leave state unchanged. Compare unconverted meshes against immutable baselines rather than regenerating hashes to hide regressions.
8. **Production:** syntax, Node tests, deterministic build, tracked/build secret checks, audit and browser tests pass; review representative desktop/tablet/mobile screenshots; deploy through the existing workflow and verify published assets.

Browser coverage must include every newly enabled ID, with focused deeper cases for distinct constructions and count/anchor behavior. Keep cases small enough to diagnose and rerun by family. Existing eight objects remain in the regression suite.

Release notes must say how many objects are actually enabled and name remaining groups. Do not label a linked-only prototype, profile stub or body-only exception as a finished multi-part assembly editor.

## 9. Recommended next action

R1 is complete. Implement **R2: chairs and stools**, then R3 benches. Schedule T0 before sofa/shelf member editing. Work in reviewed family increments so each deployed release is complete and testable; use the backlog dependencies to avoid repeating shared work.

No calendar estimate is fixed here. Size the seating builders and T0 after their parameter contracts and fixtures are prepared, then use measured implementation/verification time to estimate later batches.
