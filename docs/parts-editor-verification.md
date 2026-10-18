# Parts Editor v1.1 verification

Date: 2026-10-18. Scope: the Orbit café table pilot on the existing static application.

## Implemented

- Three semantic parts: tabletop, tapered support column, and the four-foot base assembly. Each part carries an independent finish/color; dimensions use component-specific limits.
- Tabletop width/depth/shape map to existing overall fields. Thickness is independent. The column follows the underside of the top and stays connected to the base; its diameter is independent. The grounded base has an independent footprint inside the top envelope.
- A keyboard-accessible parts list and visible-geometry click/tap selection, with selection tint in WebGL and software. Dragging orbits instead of selecting. Escape clears selection, and selecting pauses auto-rotation.
- Reset selected part, explicit finish application to all parts, component feedback, and existing undo/redo/slider transactions.
- Version-2 exports and workspace storage. Valid v1 data migrates with the original retained. Corrupt v2 data is preserved and reported. Import validation rejects unsupported/invalid part fields before changing state.
- Static build allowlists the three new modules. No runtime package was added; package and release version is 1.1.0.

## Validation

- JavaScript syntax checks passed.
- All 35 Node tests passed, including 11 new component regressions covering dimension accuracy, unit normals, bounds, inheritance/material codes, strict import checks, history, legacy migration, nearest-triangle picking and empty gaps.
- All 27 Chromium browser scenarios passed across desktop, tablet and mobile. Nine new cases cover list editing, actual v2 download/import/reload, mouse/native touch selection, orbit separation, selection after WebGL context loss, single-step slider undo and invalid part imports.
- npm audit reports zero vulnerabilities, including development dependencies. No dependency versions were changed.
- Production build remains deterministic and restricted to explicitly allowed static files. Existing no-network, subpath, source-exclusion and security checks passed.
- SHA-256 fixtures were captured from the original committed v1 geometry generator before committing v1.1. All other 71 objects retain their original low-detail vertex data byte for byte.
- Desktop/tablet/mobile Parts Editor screenshots were captured from real browser tests and visually reviewed. Tablet parts editing spans the available properties width; mobile controls remain within the viewport.

Screenshots: `images/parts-desktop.png`, `images/parts-tablet.png`, `images/parts-mobile.png`.

## Compatibility and limitations

The café-table pilot uses explicit final dimensions instead of the old final global scaling. Legacy files preserve their original parameter settings and appearance with small geometry differences in foot grounding and support positioning. The retained v1 fixture checks dimensions, shape and finish migration. The other 71 models keep the original geometry path.

Only the Orbit café table exposes Individual parts. Base feet are grouped; component insertion/deletion, free movement, separate plywood layers, alternate base constructions, focus/isolate and exploded views remain future work. Finish and assembly behavior are visual; there is no engineering or manufacturing analysis. New v2 exports cannot be read by the old v1 app.

Browser coverage is Chromium on this Windows laptop and the configured Linux CI. Physical devices, Firefox, Safari, screen-reader sessions and production GPU diversity are not covered by these automated checks. Local preview uses Node; the deployed app needs no server or credentials.
