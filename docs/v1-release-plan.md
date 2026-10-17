# FORM — Object Studio v1.0 release plan

## Scope and baseline

Public demo: browse and customize the existing parametric catalog, without credentials, AI, server APIs, or manufacturing/CAD claims. Preserve the FORM identity and existing version-1 JSON files. The existing private hosted Site remains untouched. Publish/push only after the user identifies a destination.

Inspection confirmed 72 unique objects, four categories, 17 populated subcategories, and 28 passing baseline tests on 17 October 2026. No Git repository or repository-specific AGENTS.md was present. The editor's five JavaScript modules and stylesheet are independent of the React/Vinext/Cloudflare template dependencies.

## Implementation checklist

- [x] Initialize local Git and commit a secret-scanned pre-v1 snapshot, preserving AI work in history (`f989f90`, `archive/pre-v1-ai`).
- [x] Replace the server/tooling dependency tree with a deterministic, allowlisted static build and loopback development/preview server. No public generation routes or AI assets.
- [x] Update public copy/navigation for Object Studio 1.0; keep the useful local rules-based editing helper, explicitly labeled.
- [x] Harden import validation, numeric input, storage recovery/status, gesture history, and object-specific controls.
- [x] Reduce repeated thumbnail/mesh work and idle rendering; verify pointer cancellation, keyboard and reduced motion.
- [x] Improve responsive layout, visible focus/contrast, fallback feedback, and honest material/size descriptions without redesigning the app.
- [x] Add regression/security/build tests and browser coverage of production output on desktop, tablet, and mobile: 24 Node tests and 18 browser tests pass.
- [x] Remove unnecessary dependencies/overrides, regenerate lockfile, and record final audit results: zero vulnerabilities including development dependencies.
- [x] Verify deterministic build, no AI requests/endpoints, legacy imports, geometry bounds, and source syntax. Final secret scans passed for 33 tracked and 12 build files.
- [x] Update README, changelog, deployment and verification docs. Suggested release tag: `v1.0.0`; final local commits are recorded in Git history.

## Completion and handoff

Implemented and locally verified. Browser screenshots are in `docs/images/`. No hosting/push destination was supplied; the existing private Site is unchanged. Public deployment, hosted headers/caching, cross-browser/physical-device coverage, and licensing choices remain outside the completed local verification. See `v1-verification.md` for evidence and limits.

## Deployment decision

Buildless browser modules are sufficient. Node built-ins will copy an explicit list of public files into `dist/` and serve only that directory. Relative asset URLs support both domain roots and GitHub Pages repository subpaths. Prepare generic static hosting and GitHub Pages instructions; no hosting account or repository has been authorized. Do not use the existing private Site identity for public v1.

## Verification gates

Unit/event tests for catalog, parser, history, validation, storage, mesh bounds/normals, and camera framing; production HTTP/build tests for file allowlisting and blocked routes/traversal; browser tests for real rendering and user workflows at multiple viewport sizes, with console/network checks. Report hardware/browser coverage limits honestly. All package removal, source changes, and verification outcomes will be recorded in `docs/v1-verification.md`.
