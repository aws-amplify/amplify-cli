# prepare.ts — Orchestrator

Entry point for the generate pipeline. Assembles all generators and returns the full list of migration operations.

## How It Works

`prepareNew(logger, appId, envName, region)` performs the following:

1. Creates `AwsClients`, `Gen1App`, `BackendGenerator`, and `RootPackageJsonGenerator`
2. Reads `amplify-meta.json` via `Gen1App.fetchMeta()`
3. Iterates category keys and service types, instantiating one concrete generator per resource (e.g., `AuthGenerator` for Cognito, `S3Generator` for S3, `FunctionGenerator` per Lambda)
4. Appends infrastructure generators (`BackendGenerator`, `RootPackageJsonGenerator`, `BackendPackageJsonGenerator`, `TsConfigGenerator`, `AmplifyYmlGenerator`, `GitIgnoreGenerator`)
5. Collects `plan()` from every generator into a single `AmplifyMigrationOperation[]`
6. Prepends a no-op "Delete amplify/" operation (description only — the actual deletion happens in the post-generation operation)
7. Appends a post-generation operation that replaces the local `amplify/` folder with the generated output
8. Appends an "Install Gen2 dependencies" operation that cleans `package-lock.json`, `node_modules`, and runs `npm install`

Returns the full operations array to the parent dispatcher for describe → confirm → execute.

## Relationship to Other Components

- Called by `AmplifyMigrationGenerateStep.execute()` in `generate.ts`
- Creates and owns `Gen1App`, `BackendGenerator`, and `RootPackageJsonGenerator` — passes them to category generators
- All generators write to a temp directory (`outputDir`); the post-generation operation moves the result into the project
- `DependenciesInstaller` handles `npm install` with retry
