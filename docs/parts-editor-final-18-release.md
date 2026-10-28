# Parts Editor v1.11: complete 72-object catalog

Completes the [final-18 plan](parts-editor-final-18-plan.md), R11–R14 and the entire catalog rollout: **72/72 supported, zero pending objects**.

## Delivered constructions

| Objects | Selectable components and controls |
| --- | --- |
| Café pendant lamp | Reuse the verified mount/cable/shade/diffuser recipe, including ceiling-to-bottom drop semantics. |
| Chandelier | Ceiling mount thickness, stem diameter, five linked/individual arm sections and five globe heights. Angular slots remain fixed; derived elliptical placement preserves the outer envelope. |
| Wall lamp, café wall light | Mount height/thickness, horizontal support arm section and shade height. Mount anchors the rear/lower datums; arm follows the shade. |
| Wall mirror | Four-sided frame rim with border control, inset surface thickness and independent finishes. Frame depth uses the whole-object depth control. |
| Standing mirror | Rim/surface plus two angled supports and a floor crossbrace. Frame thickness/border, surface thickness and support sections remain connected. |
| Workstation partition | Main-panel thickness and individually sized feet. |
| Slatted decorative partition | Nine fixed slats, shared gap, linked/individual thickness/finish, base-tie height and two feet. Slats meet the tie's top face; the tie connects every slat to the feet. |
| Fitting-room partition | Main and return panels with independent thickness/finish and two feet. Panels meet at a shared edge without overlapping faces. |
| Whiteboard stand | Four-sided rim, inset surface, two posts and two full-depth feet. Frame/surface thickness, border, post sections and foot heights. |
| Menu stand, shop signboard | Rim/surface and four fixed A-frame members. Border, thicknesses and support sections; upper endpoints follow the frame. |
| Indoor/hanging planters | Open pot height/width/depth, fitted soil thickness, five stem sections and five leaf heights/finishes. Hanging model adds three suspension sections/finishes. Soil is visible and selectable through the rim. |
| Stacked sculpture | Base/lower/upper heights and finishes. Bounded ellipsoid heights guarantee actual physical overlap. |
| Display plinth, product pedestal, vase | One honest continuous body: whole-body width/height/depth, supported plinth shape and independent finish. Vase retains its connected hollow contour and open neck. |

All 72 now support list/canvas selection, highlighting, contextual fields, independent visual finish/color, reset, undo/redo, local persistence and v3 JSON round trips. Repeated groups inherit settings and support member overrides/apply/reset. Single-body size/shape controls are whole-object settings; Reset selected part restores inherited finish, while Reset object restores catalog dimensions.

## Measurements and attachment rules

`parts-decor.js` owns trusted ID-selected recipes and pure constraints; `geometry-decor.js` writes boxes, cylinders, ellipsoids, sloped posts and connected lathe surfaces. Multiple rim bars share one contiguous selectable component range. No final assembly is globally rescaled. Existing pendant geometry is reused without changing either previously released pendant/light recipe.

All saved component dimensions use cm rounded to 0.01; geometry uses meters. Let W/H/D be overall dimensions and M=min(W,D). Defaults clamp to the same rounded limits as saved fields.

| Controls | Limits and dependencies |
| --- | --- |
| Chandelier | Mount thickness 0.06–0.16H (default 0.14H), stem diameter 0.05–min(0.06M,0.04H), default 2. Arm section 0.1–min(0.05M,0.04H), default 2.5. Globe height 0.18–0.34H (default 0.34H). Fixed five-angle elliptical layout gives each globe width/depth 0.24W/D; normalized centers preserve exact outer bounds. Globe bottoms share zero; mount top H. Arms join globe interiors to the stem at 0.45H. |
| Wall lights | Mount height 0.70–0.95H (default 0.80H), thickness 0.1–0.15D (default 2.5). Arm section 0.1–min(0.08M,0.04H), default 2.5. Shade height 0.50–0.75H (default 0.68H). Arm center follows shade bottom + one-quarter shade height, within the plate. Shade width W/depth 0.70D and fixed 0.6 taper; top H, front D/2. |
| Rims and surfaces | Border 0.1–min(0.10W,0.05H), default min(3.5,0.06W,0.03H). Standing frame thickness 0.08–0.16D (default 2.5); wall mirror uses full D. Surface thickness 0.05–0.04D, or 0.05–0.20D for wall mirror (default 1.2). Surface fits the open center, with its front aligned to the rim. |
| Frame supports | Section 0.1–min(0.06W,0.08D,0.03H), default 2.8. Whiteboard foot height 0.015–0.06H (default 4). Mirror support endpoints meet side/top anchors and floor brace; board posts/legs follow frame anchors. Feet/A-frame ends set full depth. |
| Partitions | Foot width 0.05–0.16W, default 6; height 0.015–0.06H, default 5. Panel/slat thickness 0.1–0.25D, default 4. Return thickness 0.1–min(0.12W,0.15D), default 4. Shared nine-slat gap 0.02–0.08W (default 0.055W); each slat width (W−8gap)/9. Base-tie height 0.02–0.06H (default 4.5). Feet determine the lower join; panel/slat tops follow H. |
| Pot and soil | Pot width/depth 0.60–0.90 of overall W/D (default 0.85); height 0.30–0.55H (default 0.47H), or 0.24–0.38H (default 0.38H) when hanging. Open tapered shell has a modeled floor/inner wall/rim. Soil top is pot height−0.01H; thickness 0.05–0.02H (default 0.015H). Width/depth fit the inner wall's radius at that height, so soil contacts the wall and remains visible. |
| Foliage and straps | Five fixed stem sections 0.05–min(0.025M,0.01H), default 0.8. Leaf height 0.12–0.24H (default 0.20H), or 0.10–0.18H (default 0.15H) hanging. Five fixed canopy positions preserve width/depth; standing upper leaves reach H. Hanging strap section 0.05–min(0.02M,0.005H), default 0.8; three straps join the pot rim to H. |
| Sculpture | Base height 0.08–0.20H, default 0.14H; lower height 0.45–0.60H, default 0.46H; upper height 0.55–0.68H, default 0.58H. Lower bottom follows base top−0.04H; upper top H. Limits guarantee overlap even at opposing extremes. |
| Continuous bodies | Existing whole-object ranges W/H=20–240, D=4–240 cm; shape round/square only on the two plinths. Vase retains its outer/inner rotational profile with no invented separate neck/body/foot components. |

The slat base tie corrects the old disconnected slats. Rims are real openings with inset surfaces, avoiding duplicated face geometry. Corner panels meet at an edge. Planters use open shells so previously obscured soil is visible. Other converted proportions/grounding can differ from the old globally rescaled meshes; these are bounded visual models, not physical CAD/lighting simulations.

## Compatibility and verification

Every final object uses revision 1 and accepts verified historical v1/v2/v3 whole-object saves without part/revision/construction data. New part-bearing files require the exact revision and active allowlisted fields. Unknown/future schemas, unsupported construction and invented slots fail before replacing current design/history. Imported metadata cannot choose a builder or member count. Existing storage backups, failure reporting and the 100 KB file limit remain unchanged.

Fifty-four released high/low meshes remain byte-identical, pinned in `tests/fixtures/released-v110-hashes.json`. Historical files for all final objects are pinned in `final-18-whole-object-legacy.json`.

Node tests cover every final model at default, combined min/max, asymmetric mixed fields and extreme overall dimensions: measured fields, post end sections, exact bounds, positive geometry, unit normals, complete ownership, frame insets, slat gaps/joins, foliage/soil connections, sculpture overlap and strict persistence. The vase test verifies one connected manifold with paired triangle edges; actual ray tests verify visible soil and unselectable slat gaps.

Browser cases cover all 18 on desktop/tablet/mobile with real edit/export/import/reload and history. Additional cases exercise group inheritance/apply/reset, single-body global size/shape semantics, legacy/invalid files, actual mouse/native-touch selection and software fallback across lights, frames, slats, soil, straps and vase. Responsive captures use `docs/images/final18-{chandelier,mirror-stand,decorative-partition,planter,vase}-{desktop,tablet,mobile}.png`; other construction captures stay in ignored `work/`.

CI's validation timeout increases from 15 to 20 minutes for the 405-scenario complete catalog suite: the preceding 312-scenario run took nine minutes locally and a previous Chromium setup took almost five minutes. Test cases, worker isolation and deployment checks remain intact. No dependency versions or runtime services are added.

## Verified results (2026-10-28)

- Syntax checks and all 155 Node tests passed, including deterministic builds, historical mesh hashes and migration fixtures.
- All 405 Chromium scenarios passed across desktop, tablet and mobile in 11.8 minutes; the final 18 add 93 responsive scenarios.
- Reviewed rendered captures for all new constructions and representative responsive layouts. Historical release screenshots remain archived separately.
- Exact runtime/catalog/backlog reconciliation passed: 72 supported IDs, zero pending objects; all delivery batches and the shared topology gate are complete.
- `npm audit --json` reported zero vulnerabilities. Dependency versions are unchanged.
- Production build contains 36 static files. Secret checks passed for all 208 tracked files and 36 build files; GitHub Actions repeats the release gates before deploying.
