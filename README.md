# FORM — AI 3D Design Studio

A private parametric design studio with Object Studio at `/` and Prompt to Design at `/prompt-design`.

## Implemented

- Object Studio: 72 catalog objects in four main categories and 17 subcategories; search, filters and editable parametric geometry.
- Prompt to Design: navigation beside the logo and in the library, design brief and examples, independent saved workspace, empty/loading/result/error states, cancel, follow-up prompts, and editing controls.
- Both workspaces share dimension, surface/frame color, material, shape and shelf controls, WebGL/software rendering, camera tools, undo/redo, version-1 JSON export/import, and browser persistence.
- The generation page transfers the latest manually edited design to Object Studio only after an explicit Open in Object Studio action.
- Local demo generation uses template matching and local property parsing. Its label explicitly says it does not use an AI model.
- The server-only AI adapter uses OpenAI Responses with a strict design-recipe schema, validates output again, and never executes generated code. Provider status, refusals, bad output, timeouts and request errors have explicit handling. Failed/canceled/stale requests preserve the last good design.

## Repository structure

- `public/studio/`: original editor modules and HTML, shared editor controller, generation contract, and second-page controller.
- `app/route.ts` and `app/prompt-design/route.ts`: HTML page routes.
- `app/api/design/`: status and generation routes.
- `server/generate.js`: server-only provider adapter and request handling.
- `docs/prompt-to-design-plan.md`: repository analysis, decisions, sequence, acceptance criteria and setup limitations.
- `.openai/hosting.json`: retained Site identity and Worker configuration. The Sites Vinext integration is preserved.

## Provider status

Live AI is not configured. OpenAI Developers is connected, but its secure Codex API-key setup skill is not available in this session; no key was created. The UI discovers availability from `/api/design/status`, disables unconfigured live AI, and provides Local demo. Configure `OPENAI_API_KEY` as a hosted secret using the supported key setup workflow, optionally configure `OPENAI_MODEL` (default adapter model: `gpt-4o-mini`), then redeploy. No browser key entry is implemented. API contract checks use an injected mock provider and do not represent a live model test.

The output is an editable configuration of a catalog template. Arbitrary meshes, structural engineering checks, and unsupported object details are outside this version.

## Validation and build

`npm test` runs the built-in Node test suite. `npx tsc --noEmit --incremental false` checks TypeScript integration. Build with the Sites `build-site.mjs` helper, which uses the preserved Vinext build. The deployment includes built server code and public assets, not secrets.

The current suite covers the original workflows plus generation of all 72 objects, recipe and request validation, mocked provider responses, manual-edit context, separate storage, refinement, cancellation, stale replies, failure preservation, export and transfer. Live browser/WebGL and responsive visual QA remain unverified because the required browser-control skill is unavailable. DOM adapters and projection checks are not browser QA.

Sites hosting remains owner-private. Do not change sharing without the owner's approval.
