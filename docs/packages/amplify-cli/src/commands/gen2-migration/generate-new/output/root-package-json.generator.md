# output/root-package-json.generator.ts — RootPackageJsonGenerator

Accumulates dependencies from category generators and writes the root `package.json`.

## How It Works

Category generators call `addDependency(name, version)` and `addDevDependency(name, version)` during their `plan()` execution. When `plan()` runs, it reads the existing `package.json` (if present), merges accumulated dependencies, patches with Gen2 dev dependencies (`@aws-amplify/backend`, `aws-cdk-lib`, `constructs`, etc.), and writes the result.

Preserves existing fields (name, scripts, existing dependencies). Uses `patchNpmPackageJson()` from `package-json-patch.ts` for the Gen2 dev dependency set.

## Relationship to Other Components

- Created by the orchestrator alongside `BackendGenerator`
- `FunctionGenerator` and `CustomResourceGenerator` contribute dependencies from their resource-level `package.json` files
- Uses `patchNpmPackageJson()` for the standard Gen2 dev dependency versions
