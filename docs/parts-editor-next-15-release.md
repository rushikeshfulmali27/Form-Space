# Parts Editor v1.9: 15 storage, bedroom and kitchen objects

This release completes R6, R7, R8 and R9a from the [next-15 plan](parts-editor-next-15-plan.md). Coverage is **39/72 supported**, with **33 remaining**. R9 now contains the other four counters.

## Objects and controls

| Models | Editable components and connections |
| --- | --- |
| Bookshelf, wall shelving | Side panels, back, linked/individual shelf thickness, 2–6 boards and internal center heights. Boards fit between sides and meet the back. |
| Display rack, shoe rack | Four independently sized posts plus shelf boards; corners meet posts. Count includes floor/top boards. |
| Display cabinet | Sides, back, plinth, bottom/top and internal shelves. Count means open bays, preserving the existing `count - 1` internal-board meaning. |
| TV unit, wardrobe | Carcass panels, plinth, fixed individual door fronts and matching handles. |
| Bedside table, filing cabinet, drawer unit | Carcass, plinth, fixed individual drawer fronts and matching handles. No new drawer boxes. |
| Storage locker | Carcass, two door fronts/handles and six separately selectable decorative vent strips. |
| Wall shelf | Board thickness and separate linked/individual mounts and diagonal brackets. Bracket endpoints follow the board underside and wall mounts. |
| Bed frame | Platform top height/thickness, headboard depth, mattress/pillow thickness and four leg sections. Mattress rests on the platform; pillows follow its top; legs follow the underside. Soft pieces retain rounded edges. |
| Dressing table | Worktop top height/thickness, four legs, mirror frame border/depth, mirror surface, connecting support and decorative drawer-block height. |
| Kitchen island | Body, countertop thickness, plinth height and three fixed front-panel thicknesses/shared gap. |

All components have individual finish/color, canvas/list selection, reset, undo/redo, local saving and JSON round trips. Repeated groups inherit settings and support apply-to-members. Doors/drawers stay closed; these visual models have no hinge, slide, load or fabrication simulation.

## Measurements and constraints

`parts-storage-bedroom.js` is the pure profile/attachment recipe; `geometry-storage-bedroom.js` writes its resolved measurements without globally rescaling the result. Dimensions are cm with 0.01 cm precision. The writer converts to meters. Width/height/depth retain the outer envelope at the existing overall limits.

Let W/H/D be overall cm, M = min(W,D), n = shelf count. Numeric limits and inherited defaults are defined by `storageLimits` / `storageDefaults`; defaults clamp to the same rounded limits as saved fields.

| Controls | Limits and anchors |
| --- | --- |
| Shelf thickness | 0.1 to min(0.12H/(n+1), 0.15D, 0.08W); default 2.7, clamped. |
| Panel shelf sides/back | Side thickness 0.1–0.08M, back thickness 0.1–0.12D. Shelves fill the interior width and terminate at the inside back plane. |
| Rack posts | Section 0.1–0.12M; posts reach floor/top, with outer faces at the requested envelope. |
| Shelf placement | Number slots bottom-to-top. Board-family internal nominal center H·i/(n−1), zero-based i; display-cabinet center H·(0.24 + 0.66(i+1)/n). Editable center bands ±0.16H/(n+1). Maximum thickness fits with clearance at mixed limits. First/last board-family members have derived floor/top heights. |
| Open cabinet | Plinth 0.05–0.16H. Fixed top/bottom thickness 0.1–min(0.04H,0.15D). Interior shelves remain above bottom and below top. |
| Closed storage | Plinth 0.05–0.16H; sides 0.1–min(0.08W,0.12D); top/bottom 0.1–min(0.06H,0.12D); back/front depth 0.1–0.08D. Shared gap 0–0.04min(W,H)/front-count. Handle section 0.05–0.05min(W/front-count,H/front-count,D). Front overlays meet carcass front anchors; handles follow each front and set the forward envelope. |
| Wall shelf | Board thickness 0.05–0.20H; mount/bracket section 0.1–min(0.08W,0.08D,0.08H). Board top H; mounts begin on ground datum; bracket ends derive from underside and wall edge. |
| Bed | Frame top 0.30–0.46H, frame thickness 0.10–0.20H; headboard depth 0.1–0.08D; mattress 0.08–0.22H, pillows 0.02–0.12H; leg section 0.1–0.08M. Headboard top H; legs extend to frame underside. |
| Vanity | Worktop top 0.40–0.54H, thickness 0.1–0.05H; mirror border 0.1–min(0.06W,0.04H), depth 0.1–0.08D; support/leg section 0.1–0.08M; drawer-block height 0.06–0.20H. Mirror top H; support joins worktop to frame; block hangs below top. |
| Island | Top thickness 0.1–0.12H; plinth 0.04–0.14H; front depth 0.1–0.08D; shared gap 0–0.015W. Body fills between grounded plinth and top underside; fronts meet its forward anchor. |

## Counts, persistence and compatibility

Shelf count stays in `design.shelves`, with one count owner and integer import validation. Parts mode shows a board-count or bay-count selector; Whole object keeps the existing range control. Increasing appends inherited slots; decreasing prunes inactive members and fields. Surviving dimensions clamp into the new safe bands in the same history snapshot. Undo restores exact removed settings. A removed selection falls back to the shelf group and expanded groups/focus survive rebuilding. Re-adding after a committed decrease starts from inherited defaults.

Revision 1 accepts historical whole-object v1/v2/v3 files without parts/revision/construction. New part-bearing files require the exact revision and valid active fields. Unknown parts, inactive slots, unsupported construction, future revisions, fractional counts and invalid values fail before replacing the workspace or history. Text prompts for component dimensions route users to Individual parts.

Converted models can differ visually from legacy globally scaled geometry: real panel thicknesses, connected supports, grounded bases, explicit overlay fronts and direct component measurements replace global mesh rescaling. All 24 previously released high/low meshes are pinned in `tests/fixtures/released-v18-hashes.json`; old files for the 15 new objects are pinned separately. The other 33 objects retain their existing builders.

## Verification

The targeted Node suite checks every new object at default, combined min/max and asymmetric mixed limits, with thin/short/large envelopes. It measures component dimensions, exact bounds, ownership, normals and connectedness; exercises all 2–6 shelf counts, safe placement and count/size changes; covers inheritance/reset/apply/history, migration and invalid imports; and verifies the v1.8 mesh hashes.

Browser scenarios cover each of the 15 objects on desktop/tablet/mobile with actual download/import, reload and history. All five shelving models test count pruning/re-add, focus/selection, group operations and placement clamping. Representative shelf/cabinet/bed cases test actual mouse/native-touch picking in both WebGL and software fallback. Saved-file failure cases preserve current data/history. Screenshots are `docs/images/next15-{bookshelf,wardrobe,bed-frame}-{desktop,tablet,mobile}.png`.

No dependency versions changed. The npm audit on 2026-10-27 reports **zero vulnerabilities**. No forced dependency remediation is used. The static build contains 32 allowlisted files and no API key or runtime service.

Local verification passed **105 Node tests and 243 Chromium scenarios** (full browser suite: 7.1 minutes). After the final import-construction hardening, back-panel accent-color preservation and component-prompt guard changes, all **72 new-object browser scenarios** passed again on desktop/tablet/mobile. Release captures were refreshed separately to hide transient save notifications. The previous 24 high/low meshes remain byte-identical. Coverage/backlog checks confirm 39 implemented IDs, 33 exact remaining IDs, valid prerequisites and no duplicate batch membership.
