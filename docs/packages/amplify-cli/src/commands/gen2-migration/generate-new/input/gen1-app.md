# gen1-app.ts — Gen1App

Category-agnostic facade that every generator receives. Provides access to all Gen1 app state.

## How It Works

`Gen1App` is constructed via the static `Gen1App.create()` factory, which resolves the backend environment from the Amplify API, downloads the cloud backend from S3, and reads `amplify-meta.json`. After construction, all local state is available synchronously via readonly fields and methods.

Category-specific logic (GraphQL schemas, auth triggers, REST API configs, function categories) lives in the respective generators, not here.

Key fields:

- `appId`, `region`, `envName` — basic app identity
- `ccbDir` — absolute path to downloaded cloud backend directory
- `rootStackName` — root CloudFormation stack name
- `backendEnvironment` — resolved backend environment from Amplify API
- `aws` — `AwsFetcher` for SDK calls
- `clients` — raw `AwsClients` for cases not yet wrapped by `AwsFetcher`

Key methods:

- `meta(category)` — category block from amplify-meta.json (sync)
- `metaOutput(category, resourceName, outputKey)` — resource output from meta
- `template(relativePath)` — JSON template from cloud backend (sync)
- `cliInputsForResource(category, resourceName)` — cli-inputs.json for a resource (sync)
- `readFile(relativePath)` — text file from cloud backend (async)
- `pathExists(relativePath)` — path existence check (async)
- `fetchAllStackResources()`, `fetchResourcesByLogicalId()` — delegates to `AwsFetcher`

## Relationship to Other Components

- Every generator receives `Gen1App` and queries only what it needs
- `Gen1App.aws` exposes `AwsFetcher` for SDK calls
- `Gen1App.clients` exposes raw `AwsClients` for cases not yet wrapped by `AwsFetcher`
- Category-specific reading is inlined in the respective generators
- In tests, stub only the fields/methods your generator uses
