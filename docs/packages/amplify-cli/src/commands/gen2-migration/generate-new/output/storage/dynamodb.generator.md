# storage/dynamodb.generator.ts — DynamoDBGenerator

Generates a single DynamoDB table construct and contributes it to backend.ts.

## How It Works

One per DynamoDB table. In `plan()`, it fetches the table definition via `AwsFetcher.fetchTableDescription()` and extracts the key schema, GSIs, billing mode, throughput, and stream configuration. It does not generate a `resource.ts` — DynamoDB tables are rendered as CDK `Table` constructs directly in backend.ts as early statements.

Calls `BackendGenerator.ensureStorageStack(hasS3Bucket)` to emit the shared `storageStack` variable exactly once. When an S3 bucket exists in the same project, the stack is reused from `backend.storage.stack`; otherwise a new stack is created via `backend.createStack('storage')`.

## Relationship to Other Components

- Receives `Gen1App`, `BackendGenerator`, and `resourceName` (no `outputDir` — writes to backend.ts only)
- Uses `DynamoDBRenderer` (pure) for CDK Table construct AST construction
- Shares the `storageStack` variable with other `DynamoDBGenerator` instances via `BackendGenerator.ensureStorageStack()`
- `S3Generator` determines whether `hasS3Bucket` is true for the storage category
