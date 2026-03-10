# data/data.renderer.ts — DataRenderer

Pure renderer that produces TypeScript AST for `data/resource.ts`.

## How It Works

`render(opts)` accepts schema text, table mappings, authorization modes, and logging config. It builds a `defineData()` call with:

- `migratedAmplifyGen1DynamoDbTableMappings` — maps model names to physical DynamoDB table names, keyed by branch name
- `authorizationModes` — maps Gen1 auth types (AWS_IAM, AMAZON_COGNITO_USER_POOLS, API_KEY, AWS_LAMBDA, OPENID_CONNECT) to Gen2 equivalents (iam, userPool, apiKey, lambda, oidc)
- `logging` — field log level, exclude verbose content, retention
- `schema` — raw GraphQL schema as a template literal; `${env}` references are replaced with `${branchName}`

Constructed with `envName` which is used in the table mapping's `branchName` property.

## Relationship to Other Components

- Called by `DataGenerator` — receives typed options, returns AST nodes
- No dependency on `Gen1App` — purely transforms input to AST
- Uses `renderResourceTsFile()` from `resource.ts` for the standard resource file structure
