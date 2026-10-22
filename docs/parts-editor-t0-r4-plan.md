# T0 and R4: changing membership, validated with sofas

Baseline v1.6.0: 21 supported objects, 51 remaining. Deliver T0 shared construction support and R4 (`sofa`, `reception-sofa`) together, raising coverage to 23/72. Other families stay planned in the remaining-object backlog.

1. Pin the 21 released high/low meshes and historical sofa exports. Preserve existing geometry and saved IDs for all already enabled objects.
2. Add trusted profile-owned construction fields and dynamic part definitions through the registry/facade. First field: `construction.cushionCount`, integer 1–4. Legacy sofas derive two cushions at width ≤190 cm, three above; capture this before normalization. Subsequent width edits resize that explicit layout without changing count.
3. Count commands append stable numbered slots or remove highest slots and their active overrides. Survivors retain settings; re-adding a removed slot starts with inherited defaults. Undo restores the complete previous snapshot. One count change is one history edit; count uses a select control, not destructive intermediate slider previews.
4. Preserve selected/expanded surviving members during topology changes. Removed selection falls back to its surviving group; switching objects clears selection. Keep count-control focus and reconcile both renderers, history, reload and imports.
5. Strictly validate construction schema/count, active IDs and profile revision. Reject unknown construction even on unsupported profiles. Legacy whole-object v1/v2/v3 files without revision, parts or construction migrate. New sofa v3 files explicitly carry construction and revision; retain the existing export envelope and storage keys.
6. Sofa profiles expose base, back, two arms, fixed four legs and a dynamic cushion group. Thickness/section/seat-height controls fit within the declared envelope and keep pieces attached. Retain rounded forms; do not imply articulation, physical upholstery or arbitrary component insertion.
7. Test count increase/decrease/re-add, surviving/deleted overrides, selection/focus, atomic history, width-threshold stability, migration, malformed/future construction, inactive IDs, exact geometry, group operations and real save/export/import on desktop/tablet/mobile and software fallback.
8. Run regression/build/security/audit checks, review responsive captures, update coverage and remaining plan, publish through GitHub Pages and verify public assets.

This gate supports future shelf/tier counts, but those objects and their ordered placement constraints remain separate batches. A shared gate is complete only after its real sofa integration and compatibility checks pass.
