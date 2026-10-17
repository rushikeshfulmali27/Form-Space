# Prompt to Design implementation plan

## Repository analysis

The v0.3 repository is a dependency-free browser application: `catalog.js` defines 72 templates and taxonomy; `design.js` owns normalization, the local parser, history and JSON serialization; `geometry.js` builds parametric meshes; `viewer.js` renders them; `app.js` wires the single-page editor. Node's built-in tests cover 19 scenarios. Sites previously served `dist/` as static files. There was no server, AI provider, runtime secret, or separate generation workspace.

## Scope and behavior

Add a real `/prompt-design` page, reached from a link beside the FORM logo and from the library sidebar. Keep `/` as Object Studio. A description produces one editable catalog-based design, followed by dimension, material, surface/frame color, shape and shelf editing. Follow-up prompts revise the current result. These are parametric designs, not arbitrary mesh generation.

## Architecture decisions

1. Preserve the existing modules in `public/studio/`, their stable template IDs and version-1 exported designs. Share one editor controller with both pages.
2. Use separate browser storage keys for Object Studio and Prompt to Design. Explicitly opening a generated design in Object Studio transfers the latest manual edits; export remains available when storage is blocked.
3. Retain Sites' Vinext build integration for server routes. Serve the existing HTML at `/` and the generation HTML at `/prompt-design` with shared assets under `/studio/`.
4. Add a provider-independent recipe contract: template ID, dimensions in cm, finish, colors, optional shape/shelves, title, summary, and unsupported requests. Validate provider output before building geometry. Never execute generated code.
5. Add `POST /api/design` for server-side OpenAI Responses requests using a strict JSON schema. Keep keys in hosted secrets; do not accept keys from the browser. Check request sizes/origins, timeout provider calls, and return actionable errors without leaking upstream details.
6. Add `GET /api/design/status` so the UI can report availability. No AI key is currently configured. Provide an explicit local demo mode using template matching and existing parsing. Do not silently substitute the demo after a failed AI request.
7. Treat generation as an asynchronous transaction: pending state, cancel, stale-response rejection, preserved last good design, accessible feedback, and undo/redo after applying a result.

## Implementation sequence

- [x] Analyze existing source and access; confirm owner-private deployment.
- [x] Migrate hosting to the Sites server starter while preserving editor behavior.
- [x] Add shared navigation and the second page with empty, pending, result and error states.
- [x] Add recipe validation, local generation and a server-only live AI adapter.
- [x] Wire generated results and follow-up prompts to the existing editor; support export and explicit transfer.
- [x] Test backward compatibility, generation, manual editing, cancellation, errors, invalid provider data and request validation.
- [x] Build and prepare the verified source for private deployment. The native deployment result is reported in the handoff.

## Acceptance criteria

Both URLs load distinct workspaces. A supported demo prompt yields a mesh and usable controls. The generated design can be refined, undone/redone, exported/imported, and opened in Object Studio. Unknown objects and unsupported details are explained. AI mode is enabled only when the server reports a configured provider. Provider failures leave the last design intact. Browser keys and original exports remain compatible. Sharing remains owner-private.

## External setup and verification limits

OpenAI Developers is connected, but its secure Codex API-key setup skill is not exposed in this session. No API key was created. To activate live AI, complete the supported key setup, configure hosted `OPENAI_API_KEY` and optionally `OPENAI_MODEL`, and redeploy. The initial adapter uses the Responses API with Structured Outputs. Official reference: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses . Live provider verification requires that connection; contract tests use injected provider responses. Browser/WebGL QA remains unavailable without the required browser-control skill; Node event adapters and projection tests do not replace browser QA.
