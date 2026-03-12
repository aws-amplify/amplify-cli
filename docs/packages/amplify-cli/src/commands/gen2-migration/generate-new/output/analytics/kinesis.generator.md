# analytics/kinesis.generator.ts — AnalyticsKinesisGenerator

Generates a single Kinesis analytics resource and contributes to backend.ts.

## How It Works

One per Kinesis resource. In `plan()`, it reads the analytics category from `Gen1App.meta`, then delegates to `KinesisCfnConverter` which:

1. Downloads the nested stack's CloudFormation template from S3
2. Resolves CFN conditions using deployed stack parameters (via `CFNConditionResolver`)
3. Renames `env` parameter references to `branchName`
4. Runs `cdk-from-cfn` to produce a TypeScript CDK construct file

The generator then renders `analytics/resource.ts` via `AnalyticsRenderer` with the construct class name, file name, resource name, shard count, and stream name. Contributes to backend.ts:

- Import for `defineAnalytics`
- `const analytics = defineAnalytics(backend)` as an early statement

## Relationship to Other Components

- Receives `Gen1App`, `BackendGenerator`, `outputDir`, and `resourceName`
- Uses `KinesisCfnConverter` for CFN-to-CDK conversion (not pure — makes S3 and CloudFormation SDK calls via `Gen1App.clients`)
- Uses `AnalyticsRenderer` (pure) for resource.ts AST construction
- Uses `CFNConditionResolver` for evaluating CFN conditions
- `FunctionGenerator` detects Kinesis access and generates `addToRolePolicy` grants referencing `analytics.kinesisStreamArn`
