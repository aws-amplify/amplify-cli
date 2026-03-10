# generate-new/output — Category Generators

Each category has a generator (orchestration) and a renderer (pure AST construction). Generators are per-resource — the orchestrator creates one per resource entry in `amplify-meta.json`.

## Pattern

Every generator:

1. Receives `Gen1App`, `BackendGenerator`, `outputDir`, and a `resourceName`
2. Implements `Generator.plan()` returning one `AmplifyMigrationOperation`
3. In `execute()`: renders resource.ts via its renderer, then contributes to backend.ts via `BackendGenerator`

## Auth — `auth/auth.generator.ts` + `auth/auth.renderer.ts`

One per project (not per-resource). Reads Cognito config (user pool, identity pool, MFA, identity providers, groups, triggers). Generates `auth/resource.ts` with `defineAuth()` or `referenceAuth()`. Contributes password policy overrides, identity pool config, user pool client overrides, and provider setup to backend.ts. The `getAuthDefinition()` adapter function (inlined in the generator) converts SDK types to `AuthDefinition`.

## Data — `data/data.generator.ts` + `data/data.renderer.ts`

One per AppSync API. Reads GraphQL schema from local project, fetches API config from AWS. Generates `data/resource.ts` with `defineData()` including schema, table mappings (`migratedAmplifyGen1DynamoDbTableMappings`), authorization modes, and logging. Contributes additional auth provider overrides to backend.ts when auth exists (resolved via `Gen1App`).

## Storage — S3 + DynamoDB

**`storage/s3.generator.ts` + `storage/s3.renderer.ts`** — One per S3 bucket. Reads bucket config (notifications, acceleration, versioning, encryption) and cli-inputs.json for access patterns. Generates `storage/resource.ts` with `defineStorage()`. Contributes bucket overrides to backend.ts. The renderer is pure — `functionCategoryMap` is passed via render options.

**`storage/dynamodb.generator.ts` + `storage/dynamodb.renderer.ts`** — One per DynamoDB table. Fetches table definition via `DescribeTable`. Contributes CDK `Table` constructs as early statements in backend.ts. Shared `storageStack` declaration via `BackendGenerator.ensureStorageStack()`. The renderer's `renderTable()` produces statements for a single table + its GSIs.

## Functions — `functions/function.generator.ts` + `functions/function.renderer.ts`

One per Lambda function. Resolves deployed config, schedule, env vars, CFN permissions. Generates `{category}/{name}/resource.ts` with `defineFunction()`. Copies Gen1 source files. Contributes to backend.ts: function name override, env var escape hatches (`addEnvironment` calls), DynamoDB table grants, GraphQL API grants, DynamoDB stream triggers. The `classifyEnvVars()` function dispatches env vars into retained (stay in defineFunction) vs escape hatches (become addEnvironment calls) based on prefix/suffix patterns.

## REST API — `rest-api/rest-api.generator.ts` + `rest-api/rest-api.renderer.ts`

One per API Gateway resource. No resource.ts — REST APIs are generated as CDK constructs directly in backend.ts (no `defineRestApi()` in Gen2). Each API gets its own stack with RestApi, LambdaIntegration, gateway responses, Gen1 API reference, IAM policies, resource tree with methods, and output.

## Analytics — `analytics/kinesis.generator.ts` + `analytics/kinesis.renderer.ts`

One per Kinesis resource. Uses `KinesisCfnConverter` to download the CFN template from S3, resolve conditions, and run `cdk-from-cfn` to produce a CDK construct file. Generates `analytics/resource.ts` with a `defineAnalytics` arrow function. The `cfn-condition-resolver.ts` evaluates CFN conditions using deployed stack parameters. The `kinesis-cfn-converter.ts` handles S3 download, condition resolution, and cdk-from-cfn invocation.

## Custom Resources — `custom-resources/custom.generator.ts`

One per custom resource. Copies the resource directory, transforms `cdk-stack.ts` via `AmplifyHelperTransformer` (replaces Gen1 patterns: `AmplifyHelpers.getProjectInfo()` → `branchName`/`projectName`, `Stack`/`NestedStack` → `Construct`, removes `AmplifyHelpers` imports, adds resource dependency parameters). Renames to `resource.ts`, removes build artifacts, merges dependencies into root package.json. The `amplify-helper-transformer.ts` does AST-based rewriting.

## Infrastructure Generators

These don't have renderers — they write simple files directly:

- `backend-package-json.generator.ts` — Writes `amplify/package.json` with `{ type: 'module' }`
- `tsconfig.generator.ts` — Writes `amplify/tsconfig.json` with Gen2 compiler options
- `amplify-yml.generator.ts` — Updates/creates `amplify.yml` replacing Gen1 `amplifyPush` with Gen2 `ampx pipeline-deploy`
- `gitignore.generator.ts` — Removes Gen1 block, adds Gen2 entries (`.amplify`, `amplify_outputs*`, etc.)
- `root-package-json.generator.ts` — Accumulates dependencies from category generators, patches with Gen2 dev deps
