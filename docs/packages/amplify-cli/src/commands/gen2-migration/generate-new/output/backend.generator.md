# generate-new/output/backend.generator.ts — BackendGenerator

Accumulator that collects contributions from all category generators and writes the final `backend.ts` file. Implements `Generator` so it participates in the same `plan()` flow — it runs last in the generator list.

## How It Works

Category generators call these methods during their `plan()` execution:

- `addImport(source, identifiers)` — Named imports, merged by source module
- `addDefineBackendProperty(property)` — Properties for the `defineBackend({ auth, data, ... })` call
- `addStatement(statement)` — Post-defineBackend statements (overrides, escape hatches, grants)
- `addEarlyStatement(statement)` — Statements between defineBackend and regular statements (DynamoDB tables, analytics)
- `ensureBranchName()` — Emits `const branchName = process.env.AWS_BRANCH ?? "sandbox"` exactly once
- `ensureStorageStack(hasS3Bucket)` — Emits `const storageStack = ...` exactly once (reuses S3 stack or creates new)

When `plan()` runs, it assembles everything into a single `backend.ts`:

1. Sorted imports (resource imports → CDK sub-modules → @aws-amplify/backend → CDK root → CDK cognito)
2. Sorted defineBackend properties (auth → data → storage → functions)
3. Early statements (DynamoDB tables, analytics)
4. Regular statements (auth overrides, storage overrides, data overrides, function overrides, REST API constructs)

## Relationship to Other Components

- Every category generator receives `BackendGenerator` in its constructor
- `RootPackageJsonGenerator` is a separate accumulator for package.json dependencies
- The import sorting in `importOrder()` uses hardcoded numeric keys — fragile but matches expected snapshot output
- The blank-line insertion between imports and statements is done via string manipulation after AST printing
