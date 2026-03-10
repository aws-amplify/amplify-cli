# generate-new/input — Gen1 App State

The input layer provides all Gen1 app state to generators through a single facade.

## gen1-app.ts — Gen1App

Facade class that every generator receives. Provides lazy-loading, cached access to:

- **amplify-meta.json** — `fetchMeta()`, `fetchMetaCategory(category)` — parsed category blocks
- **Backend environment** — `fetchBackendEnvironment()`, `fetchRootStackName()` — from Amplify API
- **Cloud backend files** — `fetchCloudBackendDir()`, `readCloudBackendJson()`, `readCloudBackendFile()` — downloaded from S3 via `BackendDownloader`
- **Function metadata** — `fetchFunctionNames()`, `fetchFunctionCategoryMap()` — derived from meta, cached
- **Auth triggers** — `fetchAuthTriggerConnections()` — reads cli-inputs.json from cloud backend
- **REST API configs** — `fetchRestApiConfigs()` — reads cli-inputs.json from local project
- **GraphQL schema** — `fetchGraphQLSchema(apiName)` — reads from local project (single file or schema/ directory)
- **Stack resources** — `fetchAllStackResources()`, `fetchResourcesByLogicalId()` — delegates to `AwsFetcher`

All fetch methods cache on first call. `Gen1App.clients` exposes raw `AwsClients` for cases not yet wrapped by `AwsFetcher` (e.g., analytics Kinesis converter).

## aws-fetcher.ts — AwsFetcher

Wraps all AWS SDK calls. Each method makes a single SDK call and caches the result. Covers: Cognito (user pool, MFA, clients, identity providers, groups, identity pool), Lambda (function config, schedule), S3 (notifications, acceleration, versioning, encryption), CloudFormation (stack resources), AppSync (GraphQL API), DynamoDB (table description), Amplify (buildspec).

## aws-clients.ts — AwsClients

Interface + factory for all AWS SDK clients used during introspection. Single instantiation point ensures consistent configuration.

## backend-downloader.ts — BackendDownloader

Downloads and caches the `#current-cloud-backend.zip` from S3. Extracts to a temp directory. Static cache ensures one download per process.

## auth-access-analyzer.ts

Parses CloudFormation templates to extract Cognito auth access permissions from `AmplifyResourcesPolicy` resources. Used by `AuthGenerator` to determine which functions have auth access (manageUsers, manageGroups, etc.).

## file-exists.ts

Single utility: `fileOrDirectoryExists(path)` via `fs.access()`.
