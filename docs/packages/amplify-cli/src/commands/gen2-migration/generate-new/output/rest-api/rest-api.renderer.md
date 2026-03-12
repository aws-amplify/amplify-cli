# rest-api/rest-api.renderer.ts — RestApiRenderer

Pure renderer that produces CDK construct statements for API Gateway resources in backend.ts.

## How It Works

`renderApi(restApi)` accepts a `RestApiDefinition` and returns `ts.Statement[]`. It generates the full CDK construct tree:

1. Stack creation (`backend.createStack('apiName')`)
2. `RestApi` construct with CORS defaults
3. Gateway responses (DEFAULT_4XX, DEFAULT_5XX) with CORS headers
4. `LambdaIntegration` per unique backing function
5. Gen1 API reference via `CfnOutput` (preserves the original API ID)
6. IAM policy for the Gen1 API's execute-api permissions
7. Resource tree: recursively creates API Gateway resources and methods matching the Gen1 path structure
8. Per-path IAM policies for auth and group-based access control
9. `CfnOutput` for the API URL

Constructed with `hasAuth` (determines whether to generate auth-based policies) and `functionNames` (determines which function imports are already registered).

## Relationship to Other Components

- Called by `RestApiGenerator` — receives typed REST API definition, returns AST statements
- No dependency on `Gen1App` — purely transforms input to AST
- Statements are added to `BackendGenerator` as regular post-define statements
