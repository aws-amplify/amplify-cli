# output/backend-package-json.generator.ts — BackendPackageJsonGenerator

Writes `amplify/package.json` with ES module configuration.

## How It Works

`plan()` returns a single operation that writes `{ "type": "module" }` to `amplify/package.json`. This is required for Gen2's ESM-based backend code.

## Relationship to Other Components

- Created by the orchestrator — no dependencies on other generators
- The file is written to the temp output directory, then moved to the project during the final replace operation
