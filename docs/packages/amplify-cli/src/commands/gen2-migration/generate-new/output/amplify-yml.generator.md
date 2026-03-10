# output/amplify-yml.generator.ts — AmplifyYmlGenerator

Updates or creates the `amplify.yml` buildspec with Gen2 pipeline-deploy commands.

## How It Works

In `plan()`, it checks whether a local `amplify.yml` exists. The operation description reflects the action: "Update" when modifying an existing file, "Generate" when creating a new one.

During `execute()`, it tries three sources in order:

1. Local `amplify.yml` file
2. Remote buildspec from the Amplify app (via `AwsFetcher.fetchAppBuildSpec()`)
3. A default backend-only spec with Gen2 commands already in place

For sources 1 and 2, it parses the YAML, re-serializes it (normalizing quote style), and replaces the Gen1 `amplifyPush --simple` command with Gen2's `npm ci` + `npx ampx pipeline-deploy` commands.

## Relationship to Other Components

- Receives `Gen1App` for access to `fetchAppBuildSpec()`
- Reads/writes to `process.cwd()` (the project root), not the temp output directory
- Backend-only apps (no buildspec) get a default spec with placeholder frontend build commands
