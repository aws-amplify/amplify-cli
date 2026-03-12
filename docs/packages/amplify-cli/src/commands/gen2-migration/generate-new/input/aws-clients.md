# aws-clients.ts — AwsClients

Interface and factory for all AWS SDK clients used during introspection.

## How It Works

`AwsClients` is a plain interface listing one client per AWS service (Amplify, AppSync, CloudFormation, Cognito Identity Provider, Cognito Identity, S3, Lambda, CloudWatch Events, DynamoDB). `createAwsClients(region)` instantiates all of them with the given region.

## Relationship to Other Components

- Created once by the orchestrator (`prepare.ts`) and passed to `Gen1App`
- `Gen1App` passes it to `AwsFetcher` and exposes it as `gen1App.clients` for direct access
- `KinesisCfnConverter` uses `clients.s3` and `clients.cloudFormation` directly
