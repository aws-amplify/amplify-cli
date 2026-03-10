# rest-api/rest-api.generator.ts — RestApiGenerator

Generates a single REST API (API Gateway) as CDK constructs in backend.ts.

## How It Works

One per API Gateway resource. REST APIs have no `resource.ts` — Gen2 has no `defineRestApi()`, so the entire API is generated as CDK constructs directly in backend.ts.

In `plan()`, it reads the REST API configuration from `Gen1App.fetchRestApiConfigs()` (which parses `cli-inputs.json` from the local project), then contributes to backend.ts via `RestApiRenderer`:

- A dedicated CloudFormation stack per API
- `RestApi` construct with CORS configuration
- `LambdaIntegration` per unique backing function
- Gateway responses (DEFAULT_4XX, DEFAULT_5XX)
- Gen1 API reference (SSM parameter for the original API ID)
- IAM policies for auth/group-based access control
- Resource tree with methods matching the Gen1 path structure
- CloudFormation output for the API URL

## Relationship to Other Components

- Receives `Gen1App`, `BackendGenerator`, and `resourceName`
- Uses `RestApiRenderer` (pure) for CDK construct AST construction
- Calls `BackendGenerator.ensureBranchName()` for the branch name variable
- Adds function imports for backing Lambdas that aren't already registered by `FunctionGenerator`
