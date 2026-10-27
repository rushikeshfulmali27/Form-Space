# R5: office chair implementation plan

Baseline v1.7.0: 23 supported objects. Add only `office-chair`, bringing coverage to 24/72, with 48 remaining.

1. Pin the 23 released high/low meshes and historical whole-object chair saves before conversion.
2. Add a revision-1 fixed profile: seat, back, support column, two armrests, their two supports, five numbered star-base arms and five matching caster assemblies. Keep angular slot identity fixed; no count control or mechanism animation.
3. Expose seat top height/thickness, back depth, column diameter, armrest top height/section, base section/shared footprint inset and caster diameter. Group edits preserve member overrides; individual arms, spokes and casters retain independent finishes and supported dimensions.
4. Define final dimensions and attachment anchors before enabling controls. Ground each caster; end each base arm inside its caster; connect all five roots to the column; column ends at seat underside. Attach back to the seat rather than retaining the old gap. Derive arm supports from the seat and corresponding armrest.
5. Use a radial prism with vertical cross sections so thick base arms cannot dip below the floor with small casters. Keep every member inside whole width/depth; conservative height ranges leave a positive column and arm-support span at all current dimension limits.
6. Preserve complete leaf ownership, matching high/low IDs, group highlighting, selection, history, v1/v2/v3 whole-object migration and strict revision/member validation.
7. Verify measured dimensions, combined/mixed limits, fixed angular slots, geometry connections, group/member apply/reset, real export/import/reload, keyboard/mouse/touch selection and software fallback across desktop/tablet/mobile.
8. Run regression/build/security/audit checks, review captures, update the backlog and remaining-object plan, publish through GitHub Pages and compare public assets with the tested build.

These are visual assembly controls. Swivel, tilt, caster rotation, telescoping animation and structural/manufacturing validation remain separate work. R6 shelving follows after this batch.
