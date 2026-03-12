# output/tsconfig.generator.ts — TsConfigGenerator

Writes `amplify/tsconfig.json` with Gen2 TypeScript configuration.

## How It Works

`plan()` returns a single operation that writes a `tsconfig.json` with Gen2 compiler options: `es2022` target/module, `bundler` module resolution, strict mode, and a `$amplify/*` path mapping to `../.amplify/generated/*`. Single-element arrays are collapsed to one line for readability.

## Relationship to Other Components

- Created by the orchestrator — no dependencies on other generators
- The `$amplify/*` path mapping enables imports from Amplify-generated types in the backend code
