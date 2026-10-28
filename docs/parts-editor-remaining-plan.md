# Parts Editor: completed 72-object rollout

Reviewed against v1.11.0 on 2026-10-28. **All 72 catalog objects support Parts Editor; zero objects remain pending.** The trusted registry, catalog map and machine-readable backlog contain the same exact IDs.

The [final-18 plan](parts-editor-final-18-plan.md) and [release notes](parts-editor-final-18-release.md) document the completed final slices. See the [architecture contracts](parts-editor-all-objects-plan.md), [catalog mapping](parts-editor-catalog-map.md) and [JSON backlog](parts-editor-remaining-backlog.json) for construction details and history.

## Completed delivery sequence

The initial pedestal/standard-table releases cover eight objects. Subsequent completed batches are:

| Batch | Construction | Added | Cumulative coverage |
| --- | --- | ---: | ---: |
| R1 | Finish desk and table variants | 4 | 12/72 |
| R2 | Chairs and stools | 7 | 19/72 |
| R3 | Benches | 2 | 21/72 |
| R4 | Sofas | 2 | 23/72 |
| R5 | Office chair | 1 | 24/72 |
| R6 | Shelving and open storage | 5 | 29/72 |
| R7 | Closed cabinets, drawers and locker | 6 | 35/72 |
| R8 | Wall shelf, bed and vanity | 3 | 38/72 |
| R9a | Kitchen island | 1 | 39/72 |
| R9 | Remaining counters | 4 | 43/72 |
| R10 | Retail and plant stands | 8 | 51/72 |
| R11a | Floor, table and dome pendant lights | 3 | 54/72 |
| R11 | Remaining lighting | 4 | 58/72 |
| R12 | Mirrors, partitions and boards | 8 | 66/72 |
| R13 | Planters and sculpture | 3 | 69/72 |
| R14 | Single-body forms | 3 | 72/72 |

T0 is complete and validated with sofa cushions, shelves and pastry trays. It adds count validation, active member pruning, safe placement, selection/focus reconciliation and atomic history; it does not add catalog IDs itself.

## Supported feature contract

Every object has list/canvas selection, visual highlighting, contextual controls, independent finish/color, reset, undo/redo, local saving and v3 JSON export/import. Repeated parts support linked groups and individual overrides. Shelf/tray/cushion counts are editable where modeled; other counts remain fixed. WebGL and software fallback share picking and editing.

Dimensions are final component measurements with automatic anchors and bounded clearances. Mirrors/boards have actual rims and surfaces; planters have open shells and visible soil; vase/plinths expose an honest continuous body. Single-body size/shape controls are whole-object settings, while Reset selected part restores its inherited finish.

Historical v1/v2/v3 whole-object files migrate through explicit profile revisions. Unknown/future schemas, unsupported construction and invalid members fail before replacing current data/history. Storage retains backups and reports failures honestly.

## Verification for future maintenance

Preserve released mesh hashes, IDs and saved meanings. Changes require measured fields, positive triangles, unit normals, exact outer bounds, valid attachments and full leaf ownership at mixed limits. Keep group/history/count tests and real desktop/tablet/mobile file/picking/fallback checks. Review captures, run syntax/Node/browser/build/secret/audit gates, publish through GitHub Pages and verify public asset hashes. CI validation has a 20-minute limit for the full catalog suite plus browser setup.

## Separate future enhancements

No catalog conversion work remains. Free transforms, arbitrary component addition, fabrication layers, CAD export, exploded views, animation, mechanisms, physical light/reflection/structural simulation, uploaded logos and optional vase finish regions are separate features. They are not implied by complete Parts Editor catalog coverage.
