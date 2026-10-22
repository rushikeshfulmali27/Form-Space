# Parts Editor rollout: all 72 catalog objects

Status: rollout in progress. V1.1/v1.2 delivered the three pedestal tables; v1.3 adds five standard desks/tables. V1.4 completes the four R1 desk variants. Twelve objects now support Parts Editor, with 60 remaining.

For the current delivery sequence, exact remaining IDs and dependencies, use the [remaining-object execution plan](parts-editor-remaining-plan.md) and [batch backlog](parts-editor-remaining-backlog.json). This document supplies the shared architecture and acceptance rules.

Completed foundation: trusted registry, profile-driven fields/defaults/limits/readouts, v3 format/revision checks, save migration, shared primitive writing, and fixed repeated groups/members with independent editing, highlighting and reset. Standard desks/tables are now implemented. Variable-count topology (shelves/cushions) remains future work. Wave 1 is complete, including standing, corner and slatted desks and the laptop stand. Seating and later waves remain planned; this is not completion of all 72 objects.

## 1. Scope and catalog coverage

Every object must have an honest editing experience based on the geometry it actually contains. Multi-part objects expose meaningful components and their existing connections. Single-body objects expose body editing; they must not acquire fictional assemblies just to increase the number of selectable parts.

The companion [complete catalog mapping](parts-editor-catalog-map.md) lists **all 72 IDs exactly once**, assigned to **41 construction profiles**. It also specifies controls and connections for every profile. The [JSON mapping](parts-editor-catalog-map.json) supports coverage checks during implementation. Profiles are implementation recipes, not additional library categories and not a requirement for 41 separate source files.

Common functionality for all supported components:

- List and canvas selection, visual highlight, contextual controls, independent color/visual finish, reset, undo/redo, local saving and import/export.
- Final measured dimensions, automatic attachment and clear feedback when related values must change.
- Both WebGL and software fallback, keyboard access, touch selection and responsive properties layout.
- For repeated pieces, a group action plus individual member editing once stable identity/constraints are implemented.

Three objects are single-body forms in the current model: `display-plinth`, `product-pedestal` and `vase`. They receive a selectable body with existing dimension/shape/finish controls. Splitting the vase into connected finish regions is a separate optional enhancement. Do not promise removable components, real plywood layers, transparent glass, mechanisms or structural accuracy that the model does not contain.

## 2. Existing foundation and gaps

V1.3 provides the registry, shared primitive writer, profile-driven inspector, fixed group/member identity, v3 persistence and selection/highlighting in both renderers. The remaining work is family construction and variable membership, rather than recreating those foundations.

| File or behavior                | Required generalization                                                                                                                        |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `parts.js` / registry           | Extend fixed profile/member definitions to validated construction and changing membership; retain existing inheritance/reset behavior          |
| `geometry.js` / family builders | Convert remaining families to final dimensions with the existing writer; extract lathe/foliage helpers when needed                             |
| `parts-controls.js`             | Add construction/count controls and topology-aware selection reconciliation; current nested-group rendering is limited to root groups          |
| `design.js`                     | Validate/normalize new construction fields and revision migrations without losing existing overrides                                           |
| `app.js`                        | Add atomic count/position commands and adjustment feedback; retain original-snapshot previews                                                  |
| `viewer.js`                     | Preserve existing leaf picking/group highlight/cache/fallback; reconcile selected members after topology changes and measure larger assemblies |
| `storage.js`                    | Retain existing v3→v2→v1 migration and backup behavior; support any required profile revision migration                                        |
| Build/check scripts             | Explicitly allow new modules; make syntax discovery recursive if implementation introduces subdirectories                                      |
| Tests                           | Extend the current twelve-object capability checks per completed batch; retain immutable fixtures for unconverted objects                       |

Retain browser modules, zero runtime dependencies and GitHub Pages. A new renderer/framework, server or account system is not required.

## 3. Shared data and module architecture

Extend the existing pure registry keyed by known catalog ID. It resolves the current object's construction profile. The implemented profile contract includes:

```text
id, revision, builder
parts                         IDs, labels, fields, root groups/member parents
defaults(design)              inherited settings
limits(design, partId, key)   valid dimension range
readout(design, parts, id)    derived UI explanation
legacyUnversioned             narrow legacy whole-object migration opt-in
```

Variable-count profiles additionally need dynamic member descriptions, construction normalization/validation and atomic edit commands, described in shared gate T0 of the remaining-object plan. Those extensions are planned, not existing APIs. Resolve profiles from trusted catalog lookup; imported data must not choose arbitrary builders or bypass variant/revision checks.

Continue the existing layout: `parts-registry.js` for resolution, `parts.js` as the facade, family definition/solver modules such as `parts-desks.js`, corresponding builders such as `geometry-desks.js`, and `geometry-primitives.js` for shared triangle/box/cylinder/beam/ellipsoid writing. Lathe and foliage are still local helpers and must be extracted where needed. Keep names flat initially to work with existing syntax checks and asset allowlisting. Pure registry/geometry modules must not depend on DOM, viewer or `design.js` imports that form a cycle.

Use the pilot's geometry result shape: vertex data, complete bounds and semantic part ranges. Builders call a writer with a concrete leaf part ID. One leaf can own multiple primitive emissions. If a part's emissions cannot be contiguous, collect them in that part's buffer and concatenate once, or deliberately extend metadata to multiple ranges; never label unrelated intervening triangles as that part. High/low detail share IDs, not triangle indexes.

Group metadata aggregates leaf bounds and descendants; it must not duplicate vertices. Ray hits resolve to a leaf and the UI can show its group. Show linked defaults on the group and independent overrides on the member. The current flat three-button list remains suitable for the café table; larger profiles use accessible expandable groups with native buttons and clear names.

Do not activate a catalog capability merely because a profile name exists. Enable an object only when schema, geometry, inspector and verification are complete for it.

## 4. Identity for repeated components

Use stable semantic names for fixed positions: `legs.front-left`, `legs.front-right`, `legs.rear-left`, `legs.rear-right`; `armrests.left`; `doors.01`; `shelves.01`. The café table retains its released IDs `tabletop`, `column`, `base`.

Resolve appearance in this order: object default → component/group default → explicit group override → explicit member override. A group edit updates its defaults and preserves member customizations; provide an explicit apply-to-members action when the user wants to replace overrides. Reset member removes only its overrides; reset group clears that group's overrides and descendants in one undoable action.

First expose repeated pieces as linked groups, then expose their members after topology behavior is implemented. Completing a family requires the member stage for genuinely independent pieces such as shelves, drawer fronts, legs and cushions. Closely connected details such as a pocket's back/floor/lip may remain one semantic assembly, with this grouping explained in the mapping.

Count and topology policy:

- Shelves use ordered bottom-to-top slots. Increasing count appends new IDs with defaults and redistributes default positions. Decreasing count removes highest slot IDs; preserve surviving overrides and clamp/reflow positions visibly. Removed settings are part of the undo snapshot, not retained in an invisible unbounded store. Re-adding after a committed decrease creates defaults; Undo restores the exact old assembly.
- Keep current cabinet front counts fixed for this rollout. A future count control requires explicit division and identity migration rather than reusing shelf semantics automatically.
- Sofa cushion count currently switches between two and three at width >190 cm. Migrate the legacy count into an explicit normalized construction field before independent cushion settings ship. Width edits then resize the existing cushion layout; any future count change is an explicit command with the same removal/undo policy.
- Fixed radial sets keep angular slot IDs: five chandelier heads/arms and office-chair caster assemblies, three hanging straps. A world-space coordinate is never the identity.
- A selected member removed by an edit falls back to its surviving parent group, or clears if that group no longer exists. Undo does not select a nonexistent ID. Selection/expanded rows remain temporary UI state.

## 5. Dimension ownership and constraints

Keep overall width/depth/height as the complete mesh envelope. Every profile must document the parts that establish each outer bound; inner component edits must either fit those anchors or explicitly adjust the related overall dimension as one named command. For this rollout prefer fitting/clamping within the envelope; do not silently grow the object.

For each editable field, define units, decimal precision, computed min/max, inherited default, anchor, affected dependents and import behavior before building its control. A field is not ready for the UI if these are unspecified. All limits must be feasible across the existing overall ranges (width 20–240, depth 4–240, height 20–240 cm) or clearly constrain interactive whole-object edits for that profile while continuing to load valid legacy files. Never produce a min greater than max or negative geometry at thin/short extremes.

Assembly evaluation order:

1. Resolve catalog, profile revision and construction counts.
2. Validate/normalize overall dimensions and explicit component values.
3. Determine outer anchors: floor, wall or ceiling; topmost surface and left/right/front/back extrema.
4. Resolve panel thicknesses, openings and component clearances.
5. Position attached pieces and repeated slots.
6. Recalculate dependent support lengths, handles, brackets and decorative details.
7. Measure final component/assembly bounds; reject invalid imports or report interactive adjustments.

Measure in final geometry coordinates. Do not build independent dimensions and then apply the old global nonuniform scale. Convert families gradually and keep the legacy scaling path for unconverted objects.

Family rules are in the mapping. Particularly important cases:

- Tables: thickness reduces support length; feet remain grounded; corner slabs share an attachment line; slat width follows available width minus gaps.
- Seating: seat height and total back height have separate meanings; arms, back, seat and leg endpoints stay connected. A member leg section may change independently while its attachment endpoints remain fixed.
- Storage: panel thickness reduces internal clear width; interior shelves remain ordered and cannot cross; doors/fronts fit openings; handles follow their own fronts. Current cabinet doors are solids and drawer fronts have no drawer box.
- Lighting: pendant height is ceiling-to-bottom drop; stem/suspension length fills remaining space. Diffusers remain inside their openings. A finish called metal does not create light emission or transparency.
- Decorative forms: pot rim anchors soil/foliage; mirror surface remains inset; lathe surface regions must meet at shared rings if introduced later.

During a slider preview, solve from the gesture's original snapshot plus the latest requested value. Do not repeatedly normalize the previous preview and permanently erase an override at an intermediate drag position. Commit the final solved design and adjustments as one history item; cancellation follows one documented policy consistently.

## 6. Save format and migration

Version **3** and per-object part revisions are already implemented. Continue that envelope for compatible new profiles; preserve version-2 café-table import. An incompatible change to an enabled profile requires explicit revision migration rather than reinterpreting old settings.

Example fragment:

```json
{
  "format": "form-studio",
  "version": 3,
  "units": "cm",
  "design": {
    "id": "dining-chair",
    "width": 48,
    "height": 88,
    "depth": 52,
    "partsRevision": 1,
    "parts": {
      "seat": { "thickness": 4, "color": "#79553c" },
      "legs.front-left": { "color": "#282e2c" }
    }
  }
}
```

The fragment omits remaining default fields for readability. Only the registry defines legal IDs, fields, materials, construction fields and revision for each object. Validate owned keys, numeric types, units, finiteness and feasible constraints; retain the 100 KB import limit. Reject future revisions, impossible assemblies, unsupported construction and inactive member IDs before replacing current state. Do not persist positions, cached bounds, selection, mesh buffers or arbitrary attachment graphs from imported JSON.

Migration sequence: validate legacy schema first → preserve original object parameters → resolve profile defaults from the historical builder/variant → preserve café-table v2 overrides exactly → produce the normalized current design. Preserve a historical reference fixture for every object and a custom café-table v2 fixture. Any visual deviation caused by removing final scaling must be measured and documented; do not silently redefine old measurements.

Retain `form-studio.workspace.v3`, reading v3 then v2 then v1 only when the higher key is absent. A corrupt newer save is reported/preserved rather than hidden by an older save. Write migrated data only after validation; keep original backups and truthful blocked/quota feedback. Earlier apps may reject newly supported profile schemas even within the v3 envelope; document compatibility per release.

## 7. UI and performance

- Generate fields and labels from the current profile rather than hiding inappropriate café controls. Rebuild when object, revision, variant or member topology changes, while preserving focus during ordinary edits.
- Keep overall controls in Whole object mode; selected-part fields expose only their supported values and clearly label dimensions that also own overall envelope fields.
- Provide group expansion, member names, custom/inherited indicators and adjustment summaries. Keep native keyboard controls; avoid an ARIA tree unless full tree interaction is implemented.
- Preserve click-versus-drag threshold, DPR-aware rays, frontmost triangle selection, empty-gap misses, shader/depth-correct tint and context-loss rebinding.
- Avoid rebuilding meshes for selection changes. Cache model/part lookup tables; broad-phase part bounds precede exact triangles. Measure the largest shelf/slatted/light model before adding a BVH or offscreen picking pass.
- Keep rendering idle when unchanged; generated parts/member lists should not schedule animation. Review tablet/mobile layouts for profiles with many members and long labels.
- Keep text shortcuts at whole-object scope until each family's language vocabulary has explicit parsing tests. Do not partially apply unsupported component commands.

## 8. Rollout order and release gates

| Wave | Coverage                                                                 |                            Count | Delivery gate                                                                                                         |
| ---- | ------------------------------------------------------------------------ | -------------------------------: | --------------------------------------------------------------------------------------------------------------------- |
| 0    | Registry, writer, inspector, group/member identity, v3 schema/migration  |                      Shared work | Existing café table matches released state; all older exports and existing browser workflows pass                     |
| 1    | Pedestal tables, standard/standing/corner/slatted desks and laptop stand | 12 including released café table | Every table variant has correct final dimensions and support anchors; slots/variants do not share accidental settings |
| 2    | Arm/armless/slatted chairs, stools, sofas, benches and office chair      |                               12 | Seat/back/arm ownership is clear; cushions have explicit topology; caster/leg/member selection is reliable            |
| 3    | Cabinets, shelves/racks, wall shelf, bed and vanity                      |                               14 | Counts/slots, front/handle attachment, internal clearances and legacy shelf semantics pass                            |
| 4    | Counters and retail/plant/clothing/accessory/promotional/logo stands     |                               13 | Tier/repeated-group connections remain correct; decorative geometry is labeled honestly                               |
| 5    | Floor/table lamps, pendants, chandelier and wall lights                  |                                7 | Ceiling/wall/floor anchors and radial/head/diffuser connections pass                                                  |
| 6    | Mirrors, partitions, boards, planters, sculpture and single-body forms   |                               14 | Variant-specific parts appear correctly; single-body experience and connected decorative forms pass                   |

Totals: 72 objects, 71 newly enabled after the released pilot. Each wave includes linked editing and member editing where defined; early linked-only checkpoints are reviewable progress, not completion of the all-object feature.

Within a wave: one representative family fixture → profile and strict schema → final-dimension geometry → list controls → member selection/persistence → full variant matrix → browser and release checks. Do not enable a whole kind when only its basic variant is tested. Publish verified waves through existing GitHub Actions; keep incomplete profiles unavailable rather than deploying placeholder controls.

V1.3 completes shared primitive writing and the standard-desk profile for `work-desk`, `coffee-table`, `dining-table`, `conference-table` and `communal-table`, including fixed member identity. V1.4 completes standing/corner/slatted variants and the laptop stand. Next, implement R2 seating. Variable-count member identity/removal rules must be completed before editable shelf/cushion counts ship.

## 9. Verification and completion definition

Before changing each family, capture normalized v1/v2 fixtures, final bounds/measurements and representative screenshots using the original generator. The existing hash fixture covers 71 pre-pilot models; keep it as an immutable baseline. Mark converted IDs explicitly in tests, add their new expected measurements and documented visual comparisons, and continue comparing unconverted IDs byte for byte. Do not regenerate all hashes just to make failures disappear.

Automated checks must cover:

1. **Catalog coverage:** JSON mapping has exactly the 72 current IDs with no duplicates, all variants match, profile counts are correct, and completion flags correspond to implemented builders and inspector definitions.
2. **Geometry ownership:** every rendered triangle belongs to exactly one selectable leaf; group ranges do not double-count; high/low detail IDs match; all vertices/normals and bounds are valid.
3. **Independent edits:** every editable dimension/finish changes its intended component, keeps unrelated explicit overrides, and correctly moves attached dependents. Assert actual final mesh measurements.
4. **Constraints:** default/min/max/combined extremes, thin envelopes, repeated spacing, independent member values and infeasible imports. Defaults must remain valid even where absolute physical dimensions are stylized.
5. **State:** single-history gestures, group/member reset, apply-to-members, branch after undo, count decrease/increase, topology-related selection cleanup and original-snapshot previews.
6. **Persistence:** all legacy fixtures migrate; custom café-table v2 remains exact in state; v3 saves round-trip; invalid or oversized imports preserve the current assembly; backup/corrupt/quota behavior stays correct.
7. **Picking:** choose near/far/hidden parts, gaps between members, multiple camera views and pixel ratios, touch/orbit/cancel, group/member transitions and WebGL context loss.
8. **Browser coverage:** for every one of the 72 objects, choose it, inspect its parts, edit at least one applicable setting, save/reload and export/import; exercise this data-driven smoke workflow across desktop/tablet/mobile. Add deeper family-specific workflows for every topology/anchor variant, with readable case names and isolated saves.
9. **Release:** syntax, Node tests, deterministic build, secret checks, dependency audit and browser tests at the real `/Form-Space/` prefix. Preserve no-network/CSP/source-exclusion behavior. Verify published assets against the approved build.

Use smaller named browser cases or family batches with suitable per-case timeouts. Avoid turning catalog loops into one long, fragile test. The existing workflow timeout is 15 minutes; measure the expanded suite and then split independent CI jobs or adjust the justified timeout if needed. This does not require adding runtime packages.

For each completed object, record profile revision, selectable parts and fields, connection rules, numeric limits, legacy fixture comparison, unit/browser case names and responsive screenshot review. “All objects complete” means every catalog ID meets these gates, including the documented body-only exceptions.

## 10. Risks and intentionally separate work

The largest risks are final-scaling removal, repeated-member identity, mutually dependent dimensions and older-save compatibility. Resolve these in shared contracts and fixtures before creating dozens of UI definitions. Decorative geometry may intersect intentionally; distinguish existing overlap from new disconnected parts in comparisons.

Opening drawers/doors, articulated joints, adjustable chair mechanisms, part insertion/deletion, free transforms, exploded assembly views, CAD export, physical material/lighting simulation and fabrication constraints remain separate features. Focus/isolate can be added later without changing saved construction data. No calendar estimate is committed before the shared registry and one additional family validate the approach.
