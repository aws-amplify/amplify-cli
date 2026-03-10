# aws-fetcher.ts — AwsFetcher

Wraps all AWS SDK calls needed during Gen1 app introspection.

## How It Works

Each method makes a single SDK call and returns the raw SDK response type. Results are cached where the same resource is likely to be queried multiple times (user pool, MFA config, web client, identity providers, stack resources). Methods that are called once per unique key (e.g., `fetchFunctionConfig` per function name) use a `Map` cache.

Covers: Cognito (user pool, MFA, clients, identity providers, groups, identity pool), Lambda (function config, schedule), S3 (notifications, acceleration, versioning, encryption), CloudFormation (stack resources), AppSync (GraphQL API), DynamoDB (table description), Amplify (buildspec).

## Relationship to Other Components

- Owned by `Gen1App` — generators access it via `gen1App.aws`
- Receives `AwsClients` in its constructor for all SDK client instances
- `fetchAllStackResources()` walks the nested CloudFormation stack tree recursively
- `fetchResourcesByLogicalId()` indexes the flat resource list by logical ID
