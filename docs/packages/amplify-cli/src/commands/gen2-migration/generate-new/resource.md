# resource.ts — Shared Resource File Renderer

Renders the standard `resource.ts` file structure used by most category renderers.

## How It Works

`renderResourceTsFile(params)` produces a `ts.NodeArray` containing:

1. Import statements — from `additionalImportedBackendIdentifiers` (e.g., `import { defineAuth } from '@aws-amplify/backend'`)
2. Optional post-import statements (e.g., `const branchName = ...`, schema variable declarations)
3. The main export: `export const {name} = {backendFunctionConstruct}({functionCallParameter})`
4. Optional post-export statements

This provides a consistent structure across `auth/resource.ts`, `data/resource.ts`, `storage/resource.ts`, and `functions/*/resource.ts` without each renderer reimplementing the import/export boilerplate.

## Relationship to Other Components

- Called by `AuthRenderer`, `DataRenderer`, `S3Renderer`, `FunctionRenderer`
- Not used by `DynamoDBRenderer` (writes to backend.ts, not resource.ts), `RestApiRenderer` (writes CDK constructs to backend.ts), or `AnalyticsRenderer` (has a custom export structure)
