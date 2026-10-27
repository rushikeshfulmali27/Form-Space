# Parts Editor: next 15 objects

Baseline: v1.8.0, 24/72 supported. Target: v1.9.0, 39/72 supported. Requested 2026-10-27.

## Delivery slices

1. R6 shelving: `bookshelf`, `wall-shelving`, `display-rack`, `shoe-rack`, `display-cabinet`.
2. R7 closed storage: `tv-unit`, `wardrobe`, `bedside-table`, `filing-cabinet`, `drawer-unit`, `storage-locker`.
3. R8: `wall-shelf`, `bed-frame`, `dressing-table`.
4. R9a: `kitchen-island`. The other four counters remain in R9b.

## Contracts

- Explicit trusted profiles, revision 1, allowlisted static modules. Legacy whole-object v1/v2/v3 files acquire the profile; part-bearing files require the exact revision. No runtime service or new dependency.
- Every rendered component owns a selectable mesh range. Groups inherit dimensions/finish; members allow independent overrides. Root groups only, matching the existing inspector.
- Preserve construction: panel sides/back on shelves, four posts on racks, fixed fronts/handles/vents on closed cabinets, frame/mattress/pillows/headboard/legs on the bed, mirror/support/worktop/drawer block/legs on the vanity, body/top/plinth/three front panels on the island. No invented openings or mechanisms.
- Keep shelf count in `design.shelves` (2–6 integers). For panel shelves/racks it counts boards including first/last. For open display cabinets it counts bays, matching legacy behavior: fixed bottom/top and count minus one internal shelves. Show this distinction in the inspector.
- Shelf slots are numbered bottom-to-top. Count increases append defaults; decreases prune removed overrides. Surviving edits remain, with dimensions clamped to new feasible limits in the same history entry. Undo restores removed settings and selected members reconcile to their parent.
- Internal shelf center heights have non-overlapping slot bands with clearance reserved for the maximum allowed thickness. First/last boards stay on floor/top anchors. Absolute height edits clamp after overall size/count changes. No free transforms or arbitrary nesting.
- Derive attached component endpoints from the resolved settings. Controls use centimeters; geometry uses meters. Preserve the requested width/height/depth envelope, positive dimensions, ground contact, and unit normals without global rescaling.
- Text prompts for component dimensions route users to Individual parts instead of changing whole-object dimensions.

## Verification and release

- Pin v1.8 high/low geometry hashes before changes. Require all 24 released meshes to remain byte-identical.
- Test each new profile at default, combined min/max, asymmetric mixed limits and extreme overall dimensions. Check final measurements, grounding, connections, complete ownership, normal lengths and exact overall bounds.
- Test inheritance/reset/apply, history, shelf count grow/shrink/re-add, safe placement, legacy files and rejection of unknown/inactive parts, future revisions, fractional counts and unsupported construction data.
- Browser workflows on desktop/tablet/mobile cover all 15 objects, actual JSON download/import, reload, count selection/focus reconciliation, canvas picking and software fallback. Capture representative shelves/cabinet/bed views and inspect them.
- Run syntax, Node suite, full browser suite, deterministic build, secret checks and npm audit. Update catalog coverage/backlog and release notes. Commit, push, wait for GitHub validation/deployment, and compare public asset hashes with the tested build.
