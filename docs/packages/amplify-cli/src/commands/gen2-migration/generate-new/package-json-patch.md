# package-json-patch.ts — Gen2 Dependency Patching

Patches a `package.json` with the standard Gen2 Amplify dev dependencies.

## How It Works

`patchNpmPackageJson(packageJson, packageVersions)` merges the provided `packageJson` with Gen2 dev dependencies: `@aws-amplify/backend`, `@aws-amplify/backend-cli`, `@aws-amplify/backend-data`, `aws-cdk`, `aws-cdk-lib`, `ci-info`, `constructs`, `esbuild`, `tsx`, `@types/node`. Versions default to `*` when not specified in `packageVersions`.

Existing dependencies and dev dependencies are preserved. All dependency keys are sorted alphabetically.

## Relationship to Other Components

- Called by `RootPackageJsonGenerator` during `execute()` with specific version pins
- Defines the `PackageJson`, `AmplifyDevDependencies`, and `AmplifyDependencies` types used by the generator
