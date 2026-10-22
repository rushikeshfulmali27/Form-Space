# R3 implementation plan: two benches

Baseline: v1.5.0, 19 supported objects. Scope: `garden-bench` and `cafe-bench`; expected coverage after completion is 21/72, with 51 remaining.

1. Capture the 19 released high/low mesh hashes and historical whole-object bench exports before editing. Preserve all existing IDs and schemas.
2. Add two fixed bench profiles. Both have four numbered seat slats, four named splayed legs and two seat bearers. Only the garden bench has three horizontal back slats and two back supports. Counts stay fixed, so T0 is not required.
3. Seat controls: linked/individual thickness, shared gap, independent finishes. Garden seat top height is separate from total height; café seat top defines total height. Derive slat depth from available depth and three gaps.
4. Add two under-seat bearers to connect separated seat boards to the legs. These are an explicit connection correction to the old model, whose middle boards had no modeled connecting frame. Bearers have linked/individual section and finish. Document this geometry change.
5. Keep legs grounded with horizontal end faces; their upper endpoints follow each bearer's underside. Reuse the fixed leg IDs and extract the existing square-post writer only with byte-identical seating regression checks.
6. Garden back: linked/individual board height and thickness, independent finishes; derived spacing fits three boards above the seat and ends at total height. Two supports connect them to the rear seat board; support section/finish can be edited independently. Café bench exposes no back controls or members.
7. Specify feasible centimeter limits across width 20–240, depth 4–240 and height 20–240; never use post-build rescaling for these component dimensions. Group overrides, apply/reset, history and revisions use the existing facade.
8. Test final measurements, gaps, attachments, mixed member overrides, normals and leaf ownership at combined limits. Verify v1/v2/v3 migration, malformed imports, real file round trips, local reload, keyboard/mouse/touch selection and software fallback on desktop/tablet/mobile.
9. Review responsive captures, run syntax/unit/browser/build/audit/secret checks, update coverage/backlog/release notes, publish through GitHub Pages and compare public asset hashes.

The batch adds fixed part editing, not free movement, count changes, removable boards or fabrication simulation. After R3, implement shared gate T0 before sofas, variable shelves or tiers.
