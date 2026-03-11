# functions/function.generator.ts — FunctionGenerator

Generates a single Lambda function resource and contributes overrides, grants, and triggers to backend.ts.

## How It Works

One per Lambda function. In `plan()`, it resolves the full function definition by:

1. Fetching deployed Lambda config (timeout, memory, runtime, handler) via `AwsFetcher.fetchFunctionConfig()`
2. Fetching CloudWatch schedule via `AwsFetcher.fetchFunctionSchedule()`
3. Classifying environment variables into retained (stay in `defineFunction()`) vs escape hatches (become `addEnvironment()` calls in backend.ts) via `classifyEnvVars()`
4. Extracting DynamoDB, Kinesis, and GraphQL API permissions from the function's CloudFormation template

Renders `{category}/{name}/resource.ts` via `FunctionRenderer`, copies Gen1 source files, then contributes to backend.ts:

- Function name override (`cfnFunction.functionName`)
- Environment variable escape hatches (`addEnvironment()` calls)
- DynamoDB table grants (API tables and storage tables)
- GraphQL API grants (mutation/query)
- Kinesis stream grants (`addToRolePolicy` with `aws_iam.PolicyStatement`)
- DynamoDB stream triggers (event source mapping)

The `classifyEnvVars()` function uses prefix/suffix pattern matching to dispatch env vars. Prefixes: `API_`, `STORAGE_`, `AUTH_`, `FUNCTION_`, `ANALYTICS_`. Each prefix group has ordered suffixes (longer suffixes first to prevent partial matches, e.g., `_STREAMARN` before `_ARN`).

## Relationship to Other Components

- Receives `Gen1App`, `BackendGenerator`, `AuthGenerator` (optional), `S3Generator` (optional), `RootPackageJsonGenerator`, `outputDir`, and `resourceName`
- Uses `FunctionRenderer` (pure) for resource.ts AST construction
- Contributes Cognito auth access permissions to `AuthGenerator` via `addFunctionAuthAccess()` when the function's CFN template contains cognito-idp actions
- Contributes S3 storage access permissions to `S3Generator` via `addFunctionStorageAccess()` when the function's CFN template contains s3 actions
- Merges function-level `package.json` dependencies into `RootPackageJsonGenerator`
- The function's effective category (auth, storage, or function) is resolved via `Gen1App.fetchFunctionCategoryMap()`
