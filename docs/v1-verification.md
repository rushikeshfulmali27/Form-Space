# FORM Object Studio v1.0 verification

Date: 17 October 2026. Scope: static public demonstration, not CAD or manufacturing validation.

## Baseline and implementation

The supplied folder was not a Git repository. Inspection found 72 unique catalog IDs, four categories, 17 populated subcategories, and 28 passing baseline tests. The core editor already ran as browser modules; React, Vinext, Cloudflare, database, connector and UI template dependencies served no necessary purpose in the v1 scope.

Initialized local Git and preserved the secret-scanned baseline in commit `f989f90` and branch `archive/pre-v1-ai`. The baseline includes the deferred generation implementation and original hosting-template license. Current v1 source removes those routes, pages, scripts and dependencies. Local copies also remain in ignored `work/pre-v1-local/`. Existing `.env.local` and private `.openai/` data were not edited, committed, or copied into the build. No AI key setup or live API tests were performed for this release task.

The public build is an allowlist of the editor HTML, stylesheet and browser modules, a static 404 page, deterministic SHA-256 manifest, `.nojekyll`, and host header configuration. There are no server functions. All asset URLs are relative. The local preview serves only those files from `dist/`, on loopback, with no source-root fallback; other methods and paths are rejected. HTML CSP blocks API/network connections. Hosts supporting `_headers` also apply frame, MIME and referrer restrictions; GitHub Pages will only enforce the HTML CSP unless an external proxy adds headers.

## Bugs and safeguards addressed

- Empty, null and boolean numeric values no longer normalize to a minimum-sized object. Imports reject malformed fields, unsafe prototype property material names, unknown IDs, unsupported controls, invalid units and UTF-8 content above the size limit. Known v1 files retain their format/IDs and default missing legacy fields.
- Save status distinguishes an unsaved starting design, in-progress edit, successful save, corrupt saved content and unavailable/full storage. A read failure does not crash the editor; corrupt content is not overwritten until a successful edit/save. Export errors and a no-op reset no longer claim an operation succeeded.
- Slider previews form one committed drag step; history branches and selection/shape/shelf controls stay consistent when switching objects. Pointer cancellation/lost capture ends orbit interaction.
- Software fallback is announced. WebGL context-loss recovery retains keyboard/pointer controls and updates the renderer status on the next render.
- Library thumbnails are rendered on approach to the visible scroll area and cached by stable catalog ID. Previously each filter rebuilt every thumbnail. Mesh data is reused when design state is unchanged. Idle viewers schedule zero animation frames; auto-rotation starts off and only schedules work while enabled and visible. Software canvas DPR is capped at 1 to avoid multiplying CPU raster work on high-DPI screens.
- Fixed collapsed library grid rows, tablet sticky-library overlap with properties, and mobile horizontal overflow discovered by browser checks/screenshot review. Improved focus access, contrast, text sizes and hit targets. Long names wrap; empty filters, fallback, import errors and storage failures have visible feedback.

## Automated verification

Final local results: **24/24 Node unit/event/build/security tests passed**, **18/18 production browser tests passed**, JavaScript syntax checks passed, and the production build succeeded. The final browser run completed in 1.4 minutes with one worker. The suite covers:

- Catalog taxonomy/counts/search, all 72 local rule selections, and backward compatibility for the original eight exported IDs.
- Full and reduced-detail geometry: finite triangles, unit normals, floor position and outer dimension bounds. Combined minimum/maximum dimensions are checked for every catalog object. Supported shelf/shape changes produce geometry changes.
- Camera projection: all 72 objects, all presets/custom angles and narrow viewports; resize and fit behavior. This proves numeric framing, not visual perfection for every model.
- History branching and manual/parser/import workflows through the event adapter. The adapter is explicitly not a browser.
- Storage corruption, denied reads/writes, new-state feedback, malformed/oversized imports and schema validation.
- Deterministic build manifest across repeated builds, exact file allowlist, no AI code in output, root/subpath asset serving, and rejection of old generation routes, secret/source/traversal paths and invalid Host headers.
- Production-build Chromium browser tests at 1440 × 1000, 820 × 1180 and 390 × 844, served under `/FORM_Studio/`. Actual canvas screenshots must change after manual edits. Browsing every subcategory, supported controls, camera/orbit, undo/redo, reset, real JSON download/reimport, reload persistence, invalid inputs, range history, corrupt/blocked storage, software fallback and reduced-motion defaults are exercised.
- Browser assertions fail on page/console errors, failed requests, HTTP errors during normal use, external requests or AI requests. Test instrumentation deliberately simulates denied storage/WebGL; it never calls a model.
- Additional browser checks passed for real touch-event orbit on tablet/mobile, opt-in auto-rotation changing rendered pixels, color/shape/wireframe controls, and an actual `WEBGL_lose_context` transition followed by continued keyboard/fit controls. No normal-use page/console errors, failed requests, HTTP failures, external requests or AI requests were observed.
- Syntax checks cover all current JavaScript modules, scripts, unit/browser tests and config. TypeScript checks no longer apply because no TypeScript source remains in the v1 tree.

Screenshots in `docs/images/` are captured by the real browser tests, not mockups. Desktop, tablet and mobile captures were visually inspected after the layout fixes. The static assets total approximately 135 KB uncompressed; there are no external fonts or runtime library downloads. CI is prepared with read-only repository permission and immutable official action references; hosted CI execution is not verified until this repository is uploaded.

## Dependency assessment and resolution

The previous audit had 30 affected package entries (1 critical, 21 high, 7 moderate, 1 low), including transitive parent reports. Its critical Next `ImageResponse` condition was not used by the editor, while Windows Vite development issues and the Cloudflare/React runtime stack warranted attention. The earlier assessment is preserved in the baseline history.

Rather than retaining and upgrading an unused framework, the static release removes the entire React/Next/Vinext/RSC, Vite, Cloudflare/Wrangler/Miniflare, Sharp/override, database, form, UI, lint and CSS-build dependency groups. Each was checked against application imports: the retained browser modules import only one another and need none of them. The first dependency change regenerated the lockfile and audited cleanly; `npm ci --ignore-scripts` then installed the new tree and the retained editor tests passed.

The sole direct development dependency is exact-pinned `@playwright/test@1.64.1`, resolving `playwright@1.64.1` and `playwright-core@1.64.1`. There are **zero runtime npm dependencies**. The final registry response, including development tools, is in `dependency-audit-v1.json` and reports **zero vulnerabilities**. No `npm audit fix` or forced upgrade/downgrade was run. There is consequently no known audit-listed critical/high package left in the public runtime as of this review. This does not establish absence of unknown defects in browser code or the hosting/browser platform.

Primary references checked during the assessment: [Vite Windows file access](https://github.com/advisories/GHSA-fx2h-pf6j-xcff), [Windows editor credential disclosure](https://github.com/advisories/GHSA-v6wh-96g9-6wx3), [React Server Functions DoS](https://github.com/advisories/GHSA-wx67-qw84-cm4g), [Next image generation RCE](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j), [Playwright production web-server setup](https://playwright.dev/docs/test-webserver).

## Secret and source hygiene

The scanner checks tracked filenames/content and the complete build for credential signatures and exact known local secret values without printing them. Local `.env*`, private Site identity, dependencies, caches, outputs, traces, and ignored work copies are excluded from version control. No new license was invented; existing content ownership still requires the owner's confirmation before granting others reuse rights. Added screenshots are locally captured from this project, with no external art/fonts/models.

## Remaining limits and manual release checklist

- Real hardware GPUs and physical touch devices, Safari, Firefox, screen-reader UX and a formal accessibility audit are not covered by Chromium emulation. Verify those before claiming cross-browser/device certification. Pinch zoom is not implemented; one-finger orbit and zoom buttons are supported.
- Numeric mesh tests do not prove structural correctness, watertight solids, nonintersection, manufacturability or realistic material rendering. Furniture parts intentionally meet/intersect; extreme custom dimensions can produce stylized proportions. No such engineering claims are made in the interface.
- Check representative long-name and extreme-size models visually on the chosen host. Test keyboard focus order and native color picker on the target browsers. Confirm browser storage/private mode behavior where required.
- No destination GitHub repository or hosting project has been identified or authorized. No push, public deployment or private Site access-policy change was made. Hosted URL, headers, caching and Pages CI/deployment must be verified after a destination is supplied.
- Review content rights and choose a license if reuse is intended. No new licensing grant was added.

Suggested release tag after reviewing the prepared commits: `v1.0.0`. See README for exact commands and build/output settings.
