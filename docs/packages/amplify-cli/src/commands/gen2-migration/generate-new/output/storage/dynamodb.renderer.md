# storage/dynamodb.renderer.ts — DynamoDBRenderer

Pure renderer that produces CDK Table construct statements for DynamoDB resources.

## How It Works

`renderTable(table)` accepts a `DynamoDBTableDefinition` and returns `ts.Statement[]`. It generates:

- `new Table(storageStack, 'tableName', { partitionKey, billingMode, ... })` — as a `const` when GSIs exist (for chaining), or as a bare expression statement otherwise
- Sort key, read/write capacity (omitted for PAY_PER_REQUEST), stream configuration
- `table.addGlobalSecondaryIndex({ indexName, partitionKey, sortKey, ... })` calls for each GSI
- A comment with the physical table name for post-refactor reference

The table variable name is sanitized (non-alphanumeric characters replaced with `_`) and derived from the table name minus the trailing hash suffix.

`requiredImports()` returns the CDK imports needed: `Table`, `AttributeType`, `BillingMode`, `StreamViewType` from `aws-cdk-lib/aws-dynamodb`.

## Relationship to Other Components

- Called by `DynamoDBGenerator` — receives typed table definition, returns AST statements
- No dependency on `Gen1App` — purely transforms input to AST
- Statements are added to `BackendGenerator` as early statements (before auth/storage overrides)
