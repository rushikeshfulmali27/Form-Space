# Final 18 objects: complete catalog Parts Editor

Baseline v1.10.0: 54/72. Target v1.11.0: **72/72**, with no pending catalog objects. Review date: 2026-10-28.

## Implementation slices

1. R11: `pendant-lamp`, `chandelier`, `wall-lamp`, `wall-light`. Reuse the verified pendant recipe; add five fixed chandelier arms/globes and connected wall mount/arm/shade recipes.
2. R12: `mirror`, `mirror-stand`, `workstation-partition`, `decorative-partition`, `fitting-room-partition`, `whiteboard-stand`, `menu-stand`, `signboard`.
3. R13: `planter`, `hanging-planter`, `decorative-sculpture`.
4. R14: `display-plinth`, `product-pedestal`, `vase`.

## Construction contracts

- Lights: ceiling/ground datums remain explicit. Chandelier has one mount/stem, five stable angular arms and five globes. Globe heights and arm sections have independent overrides; derived elliptical placement preserves overall width/depth. Wall lights have mount thickness/height, attached arm section and shade height. No emission, wiring, transparency or mechanisms.
- Frames: construct actual four-sided rims with separate inset surfaces so finish changes do not create overlapping faces. Wall mirror depth follows overall depth; standing mirrors and boards have bounded frame/surface thickness and border section. Preserve standing mirror's two angled supports plus connected floor brace. Whiteboard has posts/feet; menu/sign boards have four A-frame members. Supports follow frame anchors.
- Partitions: preserve solid, nine-slat and corner-return variants. Feet remain individually editable. Slats have shared gap and thickness plus individual thickness/finish; add an explicit bottom tie to connect all nine members to the feet, correcting the old unsupported slats. No count, hinge or arbitrary panel addition.
- Planters: pot height/width/depth, soil thickness, five stem sections and five leaf heights/finishes; hanging variant adds three fixed suspension straps. Use an open tapered pot shell so soil remains visible and selectable. Soil fits the inner wall; stems root in soil and terminate inside their corresponding leaves. Fixed canopy placement preserves the overall envelope. Hanging straps meet the pot rim and top anchor.
- Sculpture: base and two connected ellipsoids. Height controls preserve grounding and guaranteed overlap; upper form follows total height.
- Single bodies: selectable body with existing overall width/height/depth, finish and supported shape controls. Preserve vase's connected outer/inner lathe profile. Do not invent detachable necks, tops, layers or feet.

All construction is selected by trusted catalog ID. Imported metadata cannot change builders or member counts. Use revision 1 with legacy whole-object v1/v2/v3 migration and strict active-field/revision validation. Retain root groups, inheritance/apply/reset, atomic history, local saves and the v3 JSON envelope.

Controls use 0.01 cm precision; geometry is meters, with no global assembly rescaling. Limits must remain feasible across W/H=20–240 and D=4–240 cm. Derive endpoints from resolved settings and explain derived dimensions in the inspector. Every triangle has one leaf owner; multi-primitive rims stay one contiguous selectable component.

## Verification and release

Capture 54 released high/low mesh hashes and old files for all 18 before edits. Verify defaults, combined min/max, asymmetric settings, extreme envelopes, measured fields, exact overall bounds, normals, ownership and physical attachments. Test frame insets/supports, slat clearances, pot/soil/leaf joins, fixed slots, vase continuity and honest body-only controls.

Browser coverage for all 18 on desktop/tablet/mobile: actual edit/export/import/reload, group/history behavior, mouse/native-touch picking and software fallback across new constructions. Update tests that previously assumed an unsupported catalog object; only unknown IDs remain unsupported. Review representative responsive screenshots and each construction. Run syntax, Node, full browser, deterministic build, secret checks and npm audit. Mark R11–R14 complete, validate all 72 exact IDs, publish through GitHub Pages and compare live asset hashes with the tested build.
