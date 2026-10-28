# Parts Editor v1.10: counters, retail stands and lighting

Completes the [15-object plan](parts-editor-retail-lighting-plan.md): R9 (four counters), R10 (eight stands) and R11a (three lights). Coverage: **54/72 supported, 18 remaining**. R11 now tracks the four remaining lights.

## Delivered models

| Objects | Components and behavior |
| --- | --- |
| Reception desk, service counter, bar counter, checkout counter | Reuse the verified kitchen-island body/top/plinth/three-front-panel construction. Top thickness drives body height; panels remain attached. |
| Pastry display stand | Two posts and 2–6 trays. First/last trays anchor floor/top. Upper trays have individual width/depth; internal trays have safe center-height bands. Posts fit inside the smallest permitted tray and end at the upper tray underside. |
| Plant stand | Three fixed stepped platforms with individual width/thickness and lower top heights; six supports follow their platform underside. Outer platform centers follow widths to preserve total width. |
| Garment rail, hanging rack | Feet, uprights and hanging rail. Feet drive upright centers; uprights stop at rail underside. Only hanging rack has a lower shelf. |
| Accessory stand | Base, mast and two crossbars; upper bar anchors total height. Bars meet the mast's forward face. |
| Brochure holder | Base, mast, three pocket backs/floors/lips. Floors/lips follow back widths; backs sit against the mast's front face. Lip height is its final measured height. |
| Promotional stand | Base, full-height back and two shelves with safe separate center-height bands. Shelves terminate at the back's inner plane. |
| Freestanding logo display | Grounded base, connecting support and three fixed F-shaped bars. Support follows the vertical stroke; the vertical stroke meets the top bar underside and the middle bar meets its right edge. |
| Floor lamp, table lamp | Grounded base, stem, tapered shade and diffuser. Shade top anchors total height; stem connects base through diffuser to shade. |
| Dome pendant light | Ceiling mount, cable, tapered shade and diffuser. Mount top anchors ceiling-to-bottom drop; diffuser bottom anchors zero. Cable endpoints follow mount and shade. |

All leaves support independent visual finish/color, list/canvas selection, reset, history, local persistence and version-3 JSON round trips. Repeated groups support inherited settings, independent overrides and Apply to members. Lighting is a visual solid-shade model, with no light emission, electrical behavior, transparency or adjustable wall thickness. Fixed pockets/platforms/mark bars cannot be added or removed. Text, uploaded logos, hooks and mechanisms remain separate features.

## Dimensions and anchors

`parts-retail-lighting.js` owns trusted ID recipes, definitions, defaults, limits and attachment coordinates. `geometry-retail-lighting.js` writes boxes and elliptical tapered cylinders without globally scaling the assembly. The four counters explicitly reuse `parts-storage-bedroom.js`. Imported `kind`, `variant`, `panels` and builder strings cannot change construction.

All values are cm, rounded to 0.01; geometry is meters. Let W/H/D be overall dimensions, M=min(W,D), n=tray count, and i=zero-based tray index. Numeric defaults clamp to the same rounded limits used by saved parts.

| Fields | Limits/defaults and dependencies |
| --- | --- |
| Tray frame and thickness | Post section 0.1–min(0.08M,0.04H), default 3. Tray thickness 0.1–min(0.10H/(n+1),0.10D), default 4. |
| Upper tray size | Width 0.42W–W(1−0.08i), default W(1−0.12i); depth 0.40D–D(1−0.06i), default D(1−0.10i). Bottom tray retains whole width/depth. Posts at ±0.15W and −0.14D fit all permitted footprints. |
| Tray center heights | Internal default Hi/(n−1), safe band ±0.12H/(n+1). First/last centers derive from thickness so outer faces remain at 0/H. Maximum thickness leaves clearance at mixed limits. |
| Plant platforms/supports | Platform thickness 0.02–0.08H (default 2.5), width 0.22–0.36W (default W/3). Lower platform top heights 0.28–0.44H and 0.53–0.69H (defaults 0.40H/0.65H); highest top H. Support section 0.1–min(0.06W,0.10D,0.04H), default 2.5. |
| Racks | Foot width 0.12–0.22W (default 0.14W), height 0.02–0.08H (default 5). Upright section 0.1–min(0.08M,0.04H); rail section 0.1–min(0.10M,0.05H), defaults 3.5. Hanging shelf center 0.12–0.30H (default 0.16H), thickness 0.1–0.05H (default 2.5). |
| Accessory stand | Base thickness 0.02–0.12H (default 4), mast section 0.1–0.12M, bar section 0.1–min(0.12M,0.05H), defaults 2.5. Bar width 0.40–0.95W (default 0.90W); lower center 0.35–0.65H (default 0.55H). Upper top H. |
| Brochure pockets | Base thickness 0.02–0.08H (default 0.05H), mast section 0.1–min(0.10M,0.05H), default 3.5. Panel thickness 0.1–min(0.04H,0.08D), default 2. Back width 0.60–0.90W (default 0.90W); floor/lip width is back width + 0.10W. Lip height 0.04–0.12H, default 0.12H. Pocket floor tops at 0.30/0.55/0.80H; back tops 0.20H above them. |
| Promotional stand | Base thickness 0.08–0.20H (default 0.16H), back thickness 0.1–0.15D (default 3.5). Shelf thickness 0.1–min(0.05H,0.12D), default 2.5. Lower center 0.23–0.37H (default 0.25H); upper center 0.52–0.72H (default 0.59H). |
| Fixed logo mark | Base thickness 0.06–0.16H (default 0.12H). Support section 0.1–min(0.10W,0.12D), default 0.08W. Stroke section 0.1–min(0.20W,0.14H), default min(0.18W,0.14H); stroke depth 0.1–0.25D, default 0.24D. Section is width on the vertical stroke and height on horizontal strokes. |
| Floor/table lamps | Base thickness 0.01–0.08H (default 3.6), stem diameter 0.05–min(0.10M,0.04H), default 2.8. Shade height 0.18–0.38H (default 0.24H), fixed top taper 0.52. Shade bottom follows H−shade height. Base footprint 0.64W/D. |
| Pendant | Mount thickness 0.02–0.08H (default 0.04H), cable diameter 0.05–min(0.025M,0.02H), default 0.8. Shade height 0.24–0.45H (default 0.34H), fixed top taper 0.28. Mount footprint 0.32W/D. |
| Diffusers | Thickness 0.05–min(0.02H,0.05M), default 0.5. Lamp diffuser sits immediately below shade; pendant diffuser starts at zero. Their widths/depths follow the shade footprint at 0.92 or 0.94 scale. |

Counter constraints are unchanged from the [v1.9 notes](parts-editor-next-15-release.md). Overall ranges stay W/H=20–240 and D=4–240 cm. No global rescaling changes a part's final measurement.

## Counts, saves and compatibility

Pastry tray count stays in `design.shelves` (2–6 integers), with a Tray count selector in Parts mode and the existing Whole object range. Slots run bottom-to-top. Decreasing count prunes removed members and no-longer-editable fields; surviving dimensions clamp into current safe limits in one history snapshot. Undo restores exact removed settings. Re-adding after a committed decrease starts from inherited defaults. Removed selections reconcile to the tray group; focus and expanded groups survive.

Revision 1 accepts verified historical whole-object v1/v2/v3 designs without parts/revision/construction. New part-bearing files require the current revision and active allowlisted fields. Future revisions, unsupported construction, unknown/inactive members, fractional/out-of-range counts and spoofed topology fail before replacing current state/history. Component-dimension prompts direct users to Individual parts.

Converted models can change visually as explicit thicknesses, connected supports and direct measurements replace old whole-mesh rescaling. Thirty-nine previously released high/low meshes are pinned in `tests/fixtures/released-v19-hashes.json`; the 15 new objects have historical whole-object fixtures in `retail-lighting-whole-object-legacy.json`. The remaining 18 use their existing builders.

## Verification

Node cases cover all 15 models at default, combined minimum/maximum and mixed asymmetric limits, including thin/short/tall envelopes. They measure every editable dimension, full triangle ownership, exact outer bounds, grounding, unit normals, attachments and strict save round trips. Additional cases cover all tray counts, safe clearances, group inheritance/reset/apply, history/selection, migration, invalid files and the 39 released mesh hashes.

Browser cases cover every new object on desktop/tablet/mobile with real JSON download/import, reload and history; tray count pruning, re-add, clamping, focus and group operations; and actual mouse/native-touch picking in WebGL and software fallback for trays, rail, lamp, pendant, pocket lips and mark bars. Representative responsive captures are `docs/images/retail-lighting-{pastry-display-stand,garment-rail,floor-lamp}-{desktop,tablet,mobile}.png`. Other construction captures remain local under ignored `work/`.

Dependency versions are unchanged. The npm audit on **2026-10-28** reports **zero vulnerabilities**. No forced dependency remediation is used. Production output contains 34 allowlisted static files, with no runtime dependency, API key or service.

Local verification passed **127 Node tests and 312 Chromium scenarios** across desktop/tablet/mobile. The full browser suite took **9.0 minutes**. Syntax, deterministic build/source-exclusion checks, geometry compatibility and coverage/backlog checks passed. All nine representative release captures and the remaining new construction captures were visually reviewed. Historical screenshots were restored so their archived release evidence remains unchanged.
