# data/data.generator.ts — DataGenerator

Generates the AppSync/GraphQL data resource and contributes to backend.ts.

## How It Works

One per AppSync API. In `plan()`, it reads the GraphQL schema from the local project via `Gen1App.fetchGraphQLSchema()`, fetches the API config from AWS via `AwsFetcher.fetchGraphqlApi()`, and resolves DynamoDB table mappings by regex-matching `@model` types in the schema.

Renders `data/resource.ts` via `DataRenderer` with the schema, table mappings, authorization modes, and logging config. Then contributes to backend.ts:

- Import and `defineBackend` property for `data`
- Additional auth provider overrides (`cfnGraphqlApi.additionalAuthenticationProviders`) when auth exists — resolved by checking `Gen1App.fetchMetaCategory('auth')`

## Relationship to Other Components

- Receives `Gen1App`, `BackendGenerator`, and `outputDir`
- Uses `DataRenderer` (pure) for resource.ts AST construction
- Checks for auth existence to conditionally add user pool config overrides
- Table mappings use the pattern `{ModelName}-{apiId}-{envName}` to match Gen1 DynamoDB table names
