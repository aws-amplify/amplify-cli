# custom-resources/custom.generator.ts — CustomResourceGenerator

Migrates a single custom CDK resource and contributes to backend.ts.

## How It Works

One per custom resource. In `plan()`, it:

1. Copies the resource directory from the local project (excluding `package.json`, `yarn.lock`)
2. Copies the `types/` directory if it exists
3. Extracts the exported class name and category dependencies from the source `cdk-stack.ts`
4. Transforms `cdk-stack.ts` via `AmplifyHelperTransformer` (Gen1 → Gen2 pattern rewriting)
5. Inserts `branchName` and `projectName` variable declarations
6. Renames `cdk-stack.ts` to `resource.ts`
7. Removes build artifacts (`build/`, `node_modules/`, `.npmrc`, `yarn.lock`, `tsconfig.json`)
8. Merges the resource's `package.json` dependencies into `RootPackageJsonGenerator`
9. Contributes import and `new ClassName(backend.createStack('name'), 'name', backend)` to backend.ts

When the resource has dependencies (detected from `AmplifyHelpers.addResourceDependency` calls), the `backend` object is passed as a constructor argument so the transformed resource can access other Gen2 resources.

## Relationship to Other Components

- Receives `Gen1App`, `BackendGenerator`, `RootPackageJsonGenerator`, `outputDir`, and `resourceName`
- Uses `AmplifyHelperTransformer` for AST-based Gen1 → Gen2 rewriting
- Dependencies are extracted via regex from the source file before transformation
