# gen1-app.ts — Gen1App

Category-agnostic facade that every generator receives. Provides lazy-loading, cached access to generic Gen1 app state.

## How It Works

`Gen1App` is constructed once by the orchestrator with the app ID, region, environment name, and AWS clients. Generators call `fetch*` methods to get the data they need. Each method fetches on first call and caches the result — subsequent calls return the cached value without additional API calls or file reads.

Local state (amplify-meta.json, cloud backend files) is read directly. AWS SDK calls are delegated to `AwsFetcher`. The cloud backend zip is downloaded once via `BackendDownloader` and extracted to a temp directory.

Category-specific logic (GraphQL schemas, auth triggers, REST API configs, function categories) lives in the respective generators, not here.

Key methods:

- `findProjectRoot()` — cached Amplify project root directory
- `fetchMeta()`, `fetchMetaCategory(category)` — parsed amplify-meta.json
- `fetchBackendEnvironment()`, `fetchRootStackName()` — from Amplify API
- `fetchCloudBackendDir()`, `readCloudBackendJson()`, `readCloudBackendFile()`, `cloudBackendPathExists()` — S3 cloud backend
- `fetchAllStackResources()`, `fetchResourcesByLogicalId()` — delegates to `AwsFetcher`

## Relationship to Other Components

- Every generator receives `Gen1App` and queries only what it needs
- `Gen1App.aws` exposes `AwsFetcher` for SDK calls
- `Gen1App.clients` exposes raw `AwsClients` for cases not yet wrapped by `AwsFetcher` (e.g., `KinesisCfnConverter`)
- Category-specific reading (GraphQL schema, auth triggers, REST API config) is inlined in the respective generators (`DataGenerator`, `AuthGenerator`, `RestApiGenerator`)
- Function-to-category mapping is computed by the orchestrator (`generate.ts`) and passed to `FunctionGenerator` as a constructor arg
- In tests, stub only the methods your generator calls — the facade makes mocking straightforward
