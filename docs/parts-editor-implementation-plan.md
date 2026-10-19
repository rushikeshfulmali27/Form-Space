# Parts Editor implementation plan

Status: café-table pilot implemented in v1.1. See `parts-editor-verification.md` for results. This document retains the intended sequence and future work.

Implementation decisions: the pilot keeps capability detection in the pure `supportsParts()` helper rather than duplicating it in catalog metadata. New café-table geometry uses explicit final dimensions, with small changes to default foot grounding and support positioning; legacy design settings still migrate. Applying a finish to all parts stores explicit finish/color overrides because frame components otherwise inherit matte finishes. Focus/isolate and additional object families remain deferred.

## 1. Goal and first release

Let users edit meaningful components of an assembled object, beginning with the Orbit café table (`cafe-table`). Selecting a component should reveal its dimensions and finish while the editor keeps it attached to the assembly.

First-release components:

1. Tabletop: width, depth, thickness, round/square shape, finish and color.
2. Support column: derived height, editable diameter, finish and color.
3. Base assembly: independent width/depth footprint and finish/color; its existing four feet form one editable component.

The current table has four diagonal feet, not a solid circular base. Preserve this construction for the first release. A circular or square plate base is a later component variant. A separate mounting plate would add geometry that does not currently exist and is also deferred.

Provide list selection, canvas click/tap selection, highlighting, reset part, undo/redo, and persistent import/export. Focus and isolate are useful follow-up work after the editing workflow is reliable. Only `cafe-table` advertises Parts Editor initially; other objects retain their current controls.

## 2. Findings from the current repository

| Area                    | Current implementation                                                                                                                | Consequence                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Object definitions      | `public/studio/catalog.js` creates 72 objects; `cafe-table` defaults to 80 × 80 × 74 cm                                               | Enable parts by explicit object capability, not all objects with `kind: table`                          |
| Geometry                | `geometry.js: buildModel()` appends primitives into one `Float32Array`; each vertex has ten floats: position, normal, color, material | Renderable pieces exist, but part identity and triangle ownership are lost                              |
| Café table construction | A top cylinder/box, a tapered support cylinder, and four beams                                                                        | Group those primitives into three semantic components                                                   |
| Dimensions              | Geometry ends with global nonuniform scaling so mesh bounds equal requested overall dimensions                                        | Independent part measurements would become misleading if this scaling is applied after assembly solving |
| Finishes                | One object material plus primary/accent colors; support uses accent with material code 0                                              | A new part material must control both its color and shader material code                                |
| Viewer                  | `Viewer.update()` caches high/low geometry by serialized design; `camera()` uses orthographic projection and overall dimensions       | Reuse camera conventions and cache; add final bounds and part metadata                                  |
| Input                   | `Viewer.attach()` interprets pointer movement immediately as orbit                                                                    | Add a click-versus-drag threshold before selection can coexist with orbit                               |
| Renderers               | WebGL and software fallback consume the same ten-float format                                                                         | Selection and highlighting need equivalent behavior in both renderers                                   |
| State                   | `design.js: normalize()` rebuilds from catalog and copies known flat fields only                                                      | Adding `parts` only in the UI would silently lose edits on preview, history or saving                   |
| Changes/history         | `diff()` compares a fixed list of flat fields; `History` normalizes snapshots and limits history to 80 entries                        | Extend normalization and semantic diffs; reuse the existing history mechanism                           |
| Persistence             | JSON version 1; imports limited to 100 KB; `storage.js` uses `form-studio.workspace.v1`                                               | Introduce a versioned format and deliberate local migration                                             |
| UI                      | `app.js` owns controls, rendering, commit/preview, feedback and import/export                                                         | Add a small parts controller without duplicating commit/persist behavior                                |
| Publishing              | `scripts/build.mjs` explicitly allowlists assets; GitHub Actions publishes validated `dist`                                           | New browser modules must be added to the allowlist and release checks                                   |

Existing test coverage includes catalog-wide geometry/bounds, input validation, state/history, storage failures, camera framing, context loss, a DOM event adapter, and Chromium desktop/tablet/mobile workflows. This plan extends those tests; it does not assume they have been rerun during planning.

## 3. Architecture and data ownership

Keep the current browser modules, renderer and GitHub Pages hosting. No backend or new runtime dependency is needed for this scope.

Suggested module responsibilities:

- New `parts.js`: capability definitions, defaults, allowed properties, per-field limits, override resolution, assembly constraints and edit commands. Keep this pure and independent of DOM/WebGL. Do not import `design.js` back into it; pass catalog/global defaults into its helpers to avoid an import cycle.
- `design.js`: orchestrate normalization, validation, migration, versioned serialization, semantic diff and history using the parts helpers.
- `geometry.js`: reuse the primitive builders; expose an assembly-aware model with part ranges and bounds, retaining a compatibility `buildModel()` that returns only vertex data.
- New `picking.js`: pure camera-space ray construction and ray/triangle intersection, with bounds used only as broad-phase rejection.
- `viewer.js`: render metadata, selection appearance, pointer gesture routing, selection callback and fallback support.
- Optional new `parts-controls.js`: build the parts list and selected-part inputs; dispatch edits through callbacks to `app.js` rather than owning a second design state.

Suggested geometry API:

```js
buildAssemblyModel(design, (low = false));
// { data: Float32Array, bounds, parts: [
//   { id, label, firstVertex, vertexCount, bounds }
// ] }

buildModel(design, (low = false));
// compatibility wrapper: returns buildAssemblyModel(...).data
```

Store part ranges outside the vertex buffer. This preserves the existing ten-float layout and avoids a mandatory shader attribute migration. Emit each semantic part contiguously; group all four feet into the base range. High- and low-detail meshes must share stable part IDs even when their triangle counts differ.

Keep selection, active edit mode, camera, focus and temporary visibility in viewer/UI state. They are not design edits and must not create history entries or change exported JSON.

## 4. Proposed saved format

Use JSON envelope version 2 for new exports. Preserve existing top-level design dimensions and finishes as defaults; add only explicit part overrides. Example below is illustrative, not the final complete catalog record:

```json
{
  "format": "form-studio",
  "version": 2,
  "units": "cm",
  "design": {
    "id": "cafe-table",
    "width": 80,
    "depth": 80,
    "height": 74,
    "shape": "round",
    "material": "oak",
    "color": "#b98c60",
    "accent": "#282e2c",
    "parts": {
      "tabletop": { "thickness": 4.5 },
      "column": { "diameter": 12, "material": "metal" },
      "base": { "width": 65, "depth": 65, "color": "#282e2c" }
    }
  }
}
```

Tabletop width/depth/shape use the existing top-level fields to avoid two conflicting copies. Show them in the tabletop inspector as well as whole-object editing, with explicit labels. A round top with unequal width/depth remains elliptical, matching current geometry; call it “Round / oval” or explain this relationship rather than claiming a diameter for unequal axes.

Normalize only allowlisted part IDs, fields and supported values. Use own-property checks and fresh objects; never merge arbitrary imported objects. Reject invalid recognized part data during import rather than silently correcting it. For interactive controls, return a normalized edit plus an explanation of any applied limit. Keep the 100 KB import limit.

Legacy version-1 imports should migrate to default parts that reproduce their original appearance as closely as possible, including existing colors and non-wood accents. A version-2 file must round-trip all part edits. Parts on an object without the capability, unknown part IDs and unknown part fields are import errors. Existing rules for ignorable descriptive metadata can remain separate.

## 5. Dimensions and assembly rules

Preserve the documented meaning of overall dimensions: they describe the complete object's outer bounds. For the pilot, constrain the base footprint and column diameter to fit within the tabletop envelope. This lets tabletop width/depth remain the existing overall width/depth without introducing conflicting dimensions.

- Overall height is authoritative. Derive the column geometry from the tabletop underside and the existing base connection point.
- Tabletop thickness increases downward; the top surface remains at overall height. The support automatically shortens.
- Overall height changes keep top thickness, column diameter and explicit base footprint unchanged, while the column length changes.
- Tabletop width/depth changes adjust default proportional dimensions. Preserve explicit overrides if valid; clamp only affected overrides that no longer fit and report the adjustment in the same undoable operation.
- Base footprint may change independently within the tabletop envelope; the feet remain centered around the column. It is not free translation.
- Preserve the existing small connection overlap where necessary. This is visual assembly, not a physical joint solver.
- Give part dimensions their own limits and decimal steps, rather than reusing whole-object limits of 20–240 cm and integer rounding. Final limits must account for the supported overall extremes and minimum viable column length.

The existing final global scaling is the main geometry risk. For the parts-enabled path, calculate components at their final dimensions and verify the combined envelope. Do not independently edit a thickness and then rescale the whole mesh. Keep legacy scaling for unrelated objects. Establish migrated defaults from the actual existing final mesh, not just the raw pre-scaling formulas.

All constraints must live in one pure normalization/command layer used by manual inputs, whole-object commands, imports and the rules-based editor. Do not let each UI control implement different geometry rules.

## 6. Finish inheritance and edit semantics

- Resolve default tabletop appearance from primary color/material. Resolve the support/base from their existing appearance, including legacy material code 0 where applicable.
- A part without an override follows its corresponding object default. A custom override affects only that part.
- Existing whole-object finish and rules-based edits update defaults while preserving custom overrides. Provide an explicit “Apply finish to all parts” action to clear relevant overrides and apply one finish everywhere.
- “Reset part” removes that part's overrides and restores its inherited defaults. “Reset object” restores the complete catalog default, including all parts.
- A range drag previews updates and creates one history item on completion or the existing cancellation path. A compound edit with dependent adjustments creates one history item.
- Extend feedback with labels such as “Tabletop thickness: 4.5 → 3 cm” and “Base width adjusted to fit tabletop.” Part-only changes must never be reported as “up to date.”

Keep the current rules-based text editor at object scope in the pilot and label that scope. A phrase such as “column diameter 8 cm” must produce a clear unsupported-part-edit message instead of being partially interpreted as an overall edit. Part-aware language commands can be added after the schema is stable.

## 7. Selection, rendering and controls

Add Whole object / Individual parts mode controls and a flat list of three native buttons with selected state. A complex ARIA tree is unnecessary for three leaf components. Show a selection heading and only that part's supported properties. On unsupported objects, show the existing editor without an empty parts experience.

Click/tap behavior:

1. Record pointer start position, pointer ID and movement distance.
2. Treat movement beyond a small CSS-pixel threshold as orbit; preserve existing mouse/touch capture and cancellation behavior.
3. On a completed stationary gesture, construct an orthographic ray from the existing camera basis and canvas rectangle. Convert CSS coordinates correctly for DPR and resize.
4. Test candidate bounds, then triangles; choose the nearest visible hit. Bounds alone would incorrectly select empty areas between base feet.
5. Clicking empty space clears selection; a drag never changes selection. Pause auto-rotation when selecting so the target stays stable.

Use the same pure picking implementation for WebGL and software. Prefer the mesh actually displayed in each mode, with stable semantic IDs across detail levels. Rebind selection handlers when context loss replaces the canvas.

For the first highlight, use a subtle selected-part tint plus the selected list row and heading. Preserve shading and depth occlusion; hidden triangles must not appear through the top. Implement the same semantics in software. An exact silhouette outline is optional later work, not a prerequisite for selection.

Selection changes should reuse geometry. Cache picking metadata when design geometry changes, not on every pointer move. Only render on changes or explicitly active auto-rotation, preserving the current idle behavior.

Keep the list keyboard accessible and the canvas orbit shortcuts functional. Provide Escape to clear selection when the editor/canvas has focus without interfering with open dialogs. On mobile, place the selected-part inspector in the existing responsive properties flow and verify controls do not overlap the canvas.

## 8. Implementation sequence and completion gates

| Step                           | Work                                                                                                                                  | Completion gate                                                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1. Compatibility fixtures      | Capture representative v1 exports, the current café-table mesh measurements and default screenshots; specify defaults and constraints | Migration expectations and independent dimension semantics are explicit                                                          |
| 2. State/schema                | Add parts capability/helpers; extend normalize/diff/history; implement v1→v2 import and v2 export                                     | Part edits survive normalization, history and serialization; malformed imports preserve current state                            |
| 3. Assembly geometry           | Add semantic emission ranges and final bounds; implement café-table assembly solving with existing primitives                         | Default appearance stays comparable; independent dimensions measure correctly; remaining 71 objects keep their geometry behavior |
| 4. List-based editing          | Add modes, parts list, selected-part controls, inheritance, reset and feedback through existing preview/commit                        | Complete editing works using keyboard/list alone, including save/reload and undo                                                 |
| 5. Canvas selection            | Add pure picking and pointer gesture handling; add highlight in WebGL/software                                                        | Correct visible part is selected by mouse/tap; orbit, occlusion, wireframe and fallback remain functional                        |
| 6. Persistence and integration | Complete local storage migration, object-switch cleanup, parser scope handling and allowlists                                         | No stale selection, lost overrides, silent data discard or missing production assets                                             |
| 7. Release verification        | Extend unit/browser coverage, inspect responsive screenshots, update docs/changelog                                                   | All existing checks and new acceptance cases pass on the production build and repository subpath                                 |

Implement in small reviewable commits. Publish through the existing GitHub Actions workflow after the complete pilot passes; the plan itself does not change the deployed site.

## 9. Local storage migration

Use `form-studio.workspace.v2` for the new serialized design. On startup, read v2 first. If absent, read v1 and validate/migrate in memory. Write v2 only after successful validation and a successful storage write; retain v1 as a fallback backup. If v2 is corrupt, report it and preserve its raw value; do not silently replace it with an older v1 design. Failed/quota-blocked migration must retain existing data and truthful save feedback.

Explain that a previous v1 application cannot consume new v2 exports. Keep saved appearance backward compatible through migration, rather than attempting to make the old application understand independent part settings.

## 10. Files and test impact

| File                                                            | Planned change                                                                                         |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `public/studio/catalog.js`                                      | Explicit parts capability for `cafe-table` only                                                        |
| New `public/studio/parts.js`                                    | Part definitions, defaults, constraints, inheritance and edit helpers                                  |
| `public/studio/design.js`                                       | Normalization, v2 format, v1 migration, semantic diff/history support and parser scope protection      |
| `public/studio/geometry.js`                                     | Semantic mesh ranges, assembled bounds, independent café-table geometry and compatibility wrapper      |
| New `public/studio/picking.js`                                  | Pure orthographic picking and nearest-hit ownership                                                    |
| `public/studio/viewer.js`                                       | Part selection, highlight, gesture threshold and lifecycle support                                     |
| `public/studio/app.js`                                          | UI state, central edit commands, selection cleanup and feedback integration                            |
| New `public/studio/parts-controls.js` if useful                 | DOM controls/list using app callbacks                                                                  |
| `public/studio/index.html`, `style.css`                         | Mode switch, parts inspector, responsive/accessible states                                             |
| `public/studio/storage.js`                                      | v2 storage with safe v1 fallback migration                                                             |
| `scripts/build.mjs`                                             | Explicitly include new modules; update release expectations that assume the previous asset list        |
| `tests/design.test.mjs`, `catalog.test.mjs`, `release.test.mjs` | Compatibility, geometry, limits, serialization, import validation, cache and production build coverage |
| New `tests/parts.test.mjs`, `picking.test.mjs`                  | Focused assembly/state and ray/occlusion cases                                                         |
| `tests/viewer.test.mjs`, `workflow.test.mjs`, `dom-adapter.mjs` | Viewer lifecycle and UI event coverage; extend adapter only where required                             |
| `tests/browser/studio.spec.mjs`                                 | Real desktop/tablet/mobile parts workflows and fallback cases                                          |
| `README.md`, `CHANGELOG.md`                                     | Scope, controls, dimension rules, save-format compatibility and limitations                            |

Specific acceptance cases:

- Changing top thickness changes the measured thickness without scaling column diameter/base width, and the assembly remains connected.
- Overall height and tabletop width/depth retain their declared meaning at minimum/maximum supported values. Dependent adjustments are visible and undoable.
- Primary/accent/material inheritance reproduces legacy visuals; a column metal override affects only the column. Reset and apply-to-all behave as documented.
- v1 fixtures migrate; v2 exports round-trip; corrupt, oversized, unknown, wrong-type, nonfinite and invalid part imports leave the current design/history intact.
- A drag creates one history step; selection and mode changes create none. Branching after undo clears redo as before.
- Object switching, reset, import and undo/redo cannot retain a selected ID that is unavailable on the current object.
- Canvas picks top/column/base at multiple camera angles and viewport sizes; nearest visible hit wins, hidden geometry cannot be selected through surfaces, and empty gaps remain empty.
- Mouse drag and native touch orbit do not trigger selection. Pointer cancellation, DPR changes, resize and WebGL loss preserve usable controls.
- List selection and visual highlighting work with software fallback, keyboard input and reduced-motion settings; no horizontal overflow on mobile.
- Selection alone does not rebuild geometry or schedule idle animation. Establish a pre-change timing baseline before setting a performance budget; optimize triangle picking only if measurements justify it.
- All catalog objects still render, fit camera bounds, and pass existing production build, subpath, no-network and secret checks.

Verification commands during implementation: `npm run check`, `npm test`, `npm run build`, `npm run check:secrets`, `npm audit`, and `npm run test:browser`. Inspect the production build at `/Form-Space/` as well as the generic test prefix, and review updated responsive screenshots before publishing.

## 11. Later releases

After the café-table pilot is validated:

1. Focus/isolate and an optional exploded inspection view; temporary display offsets must not change saved construction dimensions.
2. Plate-base variants and a visible mounting plate, each with explicit migration/default rules.
3. Extend to the side table and square café table after verifying their defaults and capability definitions independently.
4. Add other families with purpose-built semantic groups: chair seat/back/legs, shelf frame/shelves, cabinet body/doors.
5. Part-aware text commands and reusable component variants.

Free transforms, arbitrary part insertion/deletion, real plywood layering, joinery, load analysis and manufacturing exports require separate product and geometry work. They are not implied by editing the three café-table components.

## 12. Recommended next action

The café-table pilot, pedestal rollout, shared primitive writer and standard-desk group/member batch are complete. Continue with the [all-object rollout plan](parts-editor-all-objects-plan.md) and [72-object catalog mapping](parts-editor-catalog-map.md). Next, add standing/corner/slatted desk variants and the laptop stand before proceeding through the remaining family waves.
