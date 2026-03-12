# analytics/kinesis.renderer.ts — AnalyticsRenderer

Pure renderer that produces TypeScript AST for `analytics/resource.ts`.

## How It Works

`render(opts)` accepts the construct class name, file name, resource name, shard count, and stream name. It generates:

- Imports for `CfnStream` (aws-cdk-lib/aws-kinesis), the generated construct class, and `Backend` (@aws-amplify/backend)
- `const branchName = process.env.AWS_BRANCH ?? "sandbox"`
- An exported `defineAnalytics` arrow function that receives `backend: Backend<any>` and:
  - Creates an analytics stack via `backend.createStack('analytics')`
  - Instantiates the generated construct with Kinesis props (stream name, shard count, auth/unauth policy names, role names from `backend.auth.resources`)
  - Returns the construct instance
  - Includes commented-out post-refactor code for setting the physical stream name

## Relationship to Other Components

- Called by `AnalyticsKinesisGenerator` — receives typed options, returns AST nodes
- No dependency on `Gen1App` — purely transforms input to AST
- The generated construct file (from `cdk-from-cfn`) is written separately by `KinesisCfnConverter`
