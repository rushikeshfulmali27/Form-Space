# Standard desk Parts Editor v1.3

Date: 2026-10-19. Scope: shared primitive writing, fixed repeated-part groups, and the standard desk family.

## Delivered

- Parts Editor for `work-desk`, `coffee-table`, `dining-table`, `conference-table`, and `communal-table`. With the three pedestal tables, eight objects now have component editing; 64 remain whole-object only.
- Tabletop thickness/shape/size, shared leg thickness/inset, individual square leg thickness, shared or individual foot dimensions, rear brace thickness, and independent visual finish/color.
- Expandable leg/foot lists with stable semantic member IDs. Group defaults preserve explicit member overrides. Apply-to-members clears descendant overrides; reset group clears both group and descendants, with undo/redo.
- Individual triangle picking expands the member's group. Group highlight references descendant mesh ranges without duplicating vertices. Selection remains valid during geometry edits and software fallback.
- Shared primitive writer extracted with unchanged tessellation. Legacy geometry keeps its previous path; standard desks use final measured dimensions, grounded feet, supports attached to feet/top, and a rear brace connecting the rear supports. Round tops pull supports inside the ellipse.
- Earlier whole-object desk v1/v2/v3 files migrate to revision 1 defaults. Missing revision is accepted for the newly enabled desks only when both revision and part data are absent. New member data requires revision 1; future/invalid revisions and fields are rejected.

## Verification

- All 49 Node tests passed, including eight new standard-desk/group/geometry regressions.
- All 57 Chromium browser scenarios passed across desktop, tablet and mobile. The 21 new cases exercise every new object and group/member selection, persistence, fallback and legacy migration.
- After correcting a screenshot-detected flex-wrap issue in the scrollable parts list, the work-desk workflow passed again at all three viewport sizes. Final screenshots were visually reviewed.
- Syntax checks and production build passed. npm audit reports zero vulnerabilities. No dependency versions changed.
- Tracked/build secret checks and hosted deployment verification run as the final release gates.

Commands: `npm run check`, `npm test`, `npm run build`, `npm run check:secrets`, `npm audit --json`, `npm run test:browser`.

Coverage includes finite geometry/unit normals and complete bounds at combined dimension extremes; measured thickness, individual members and attachment endpoints; group inheritance/apply/reset and history; exact released pedestal vertex hashes; legacy save migration and strict invalid imports; triangle ownership without duplicated group geometry; nearest visible member picking and top occlusion; desktop/tablet/mobile edit/export/reload workflows for every new ID; native touch picking, WebGL loss, selection persistence and source/network exclusion.

Screenshots are captured from real browser runs as `images/desk-parts-desktop.png`, `images/desk-parts-tablet.png`, and `images/desk-parts-mobile.png`. Existing release screenshots remain archived separately.

## Compatibility and remaining work

No runtime dependencies were added and no dependency versions changed. All three pedestal-table defaults remain byte-for-byte identical in high/low detail after primitive extraction; the existing custom café-table fixture remains exact too. The 64 unconverted models retain the original low-detail geometry hashes. The five converted desks retain their overall settings/finishes with documented changes in support inset, foot grounding and brace attachment instead of global mesh scaling.

Group/member support currently covers fixed legs and feet. Variable-count shelf/cushion topology, standing/corner/slatted desk variants, laptop stand, other furniture families, mechanisms and free assembly editing remain future work. These are visual geometry constraints, not structural or manufacturing validation. Browser coverage uses Chromium emulation rather than certification on physical devices, Firefox or Safari.
