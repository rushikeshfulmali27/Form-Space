# Open FORM Studio on your laptop

This archive contains the project source from commit 61f13e7581a549024b09bcf4b4ff6dcdce5f125d. It includes Object Studio, Prompt to Design, the generation API adapter, implementation plan, and 28 automated tests. It does not contain an API key, Git credentials, node_modules, or cloud runtime state.

1. Extract FORM_Studio into a folder you choose, for example D:\Projects\FORM_Studio on Windows. Use the folder containing package.json.
2. In the ChatGPT desktop app, select Codex, open this folder as a local project, and choose Work in > This computer (Local). Approve access to that folder when the app requests it.
3. Ask the local session to install dependencies and run the project. The project requires Node.js >=22.13.0. The commands are:

    npm ci
    npm test
    npm run dev

The development address is http://localhost:5173 . Object Studio is at / and Prompt to Design is at /prompt-design.

The local demo works without an AI key. Live AI is not configured. The missing secure key helper must be checked in the local environment before provisioning a key. A new local save destination must be confirmed for this laptop; the previous /workspace/sites/form-studio/.env.local path belongs to the hosted workspace.

The existing hosted Site remains private. Do not change its audience or create a replacement Site while working locally.

## Continuation prompt

Continue the existing FORM Studio project in this folder. Read README.md and docs/prompt-to-design-plan.md, verify the current directory, then install dependencies, run npm test, and start the app locally. Keep the existing Site private. Do not rebuild the project from scratch. After local startup works, inspect whether the OpenAI Developers secure API-key helper is available and continue the supported key setup flow. Confirm the laptop-local destination before writing any secret. Never print or include API keys in source, logs, or chat.
