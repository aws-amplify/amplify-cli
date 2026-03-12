# custom-resources/amplify-helper-transformer.ts — AmplifyHelperTransformer

AST-based transformer that rewrites Gen1 custom resource patterns to Gen2 equivalents.

## How It Works

`transform(sourceFile, projectName)` runs a TypeScript AST transformation that:

- Removes imports from `@aws-amplify/cli-extensibility-helper` and `amplify-dependent-resources-ref`
- Transforms `cdk.Fn.ref('env')` → `branchName`
- Transforms `cdk.Fn.ref(dependencies.category.resource.attribute)` → `backend.gen2Category.resources.gen2Path`
- Removes `AmplifyHelpers.getProjectInfo()` variable declarations, transforms property access (`.envName` → `branchName`, `.projectName` → `projectName`)
- Removes `AmplifyHelpers.addResourceDependency()` calls, tracks dependency variables
- Removes `new cdk.CfnParameter(this, 'env', ...)` statements (both variable and expression forms)
- Removes `AmplifyDependentResourcesAttributes` type annotations and strips `as AmplifyDependentResourcesAttributes` assertions
- Removes variable declarations calling functions imported from `amplify-dependent-resources-ref`
- Transforms `amplifyResources.category.resource.attribute` and dependency variable property access to `backend.gen2Category.resources.gen2Path`
- Transforms `amplifyResourceProps.resourceName` → `id`, `.category` → `'custom'`
- Changes `extends Stack`/`NestedStack` to `extends Construct`
- Replaces constructor parameters with `(scope, id, backend?)` — `backend` is added only when dependencies exist
- Strips extra arguments from `super()` calls

`addBranchNameVariable(sourceFile, projectName)` inserts `const branchName = process.env.AWS_BRANCH ?? "sandbox"` and optionally `const projectName = "..."` after imports, if not already present.

## Relationship to Other Components

- Called by `CustomResourceGenerator` during `execute()`
- Uses `CATEGORY_MAP` to translate Gen1 categories (function, api, storage, auth) to Gen2 names (functions, data, storage, auth)
- Uses `ATTRIBUTE_MAP` to translate Gen1 output attributes to Gen2 resource property paths
