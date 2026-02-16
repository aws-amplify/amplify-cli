# Custom Resource Migration Tool

Migrates Gen1 custom CDK stacks to Gen2's `backend.createStack()` pattern.

## Structure

```
codegen-custom-resources/
├── types.ts                           # Shared TypeScript types
├── scanner/
│   └── custom-resource-scanner.ts     # Finds Gen1 custom resources
├── parser/
│   ├── cdk-stack-parser.ts            # Parses CDK stack files
│   └── pattern-detector.ts            # Detects Gen1 patterns
├── transformer/
│   └── code-transformer.ts            # Transforms Gen1 → Gen2
├── generator/
│   ├── gen2-file-generator.ts         # Generates resource.ts files
│   └── backend-updater.ts             # Generates backend.ts updates
└── index.ts                           # Main orchestrator
```

## Usage

```typescript
import { CustomResourceMigrator } from './codegen-custom-resources';

const migrator = new CustomResourceMigrator();
await migrator.migrateCustomResources(gen1ProjectRoot, gen2ProjectRoot);
```

## What It Does

1. **Scans** `amplify/backend/custom/` for all custom resources
2. **Parses** each `cdk-stack.ts` file using TypeScript AST
3. **Transforms** Gen1 patterns to Gen2:
   - `cdk.Stack` → `Construct`
   - `cdk.Fn.ref('env')` → `process.env.AMPLIFY_ENV`
   - `AmplifyHelpers.getProjectInfo()` → environment variables
   - Removes `cdk.CfnParameter` for 'env'
   - Extracts `cdk.CfnOutput` declarations
4. **Generates** `amplify/custom/<name>/resource.ts` files
5. **Creates** `CUSTOM_RESOURCES_BACKEND_UPDATES.md` with backend.ts instructions

## Transformation Example

### Gen1 Input
```typescript
export class cdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    
    new cdk.CfnParameter(this, 'env', { type: 'String' });
    const name = `topic-${cdk.Fn.ref('env')}`;
    const topic = new sns.Topic(this, 'Topic', { topicName: name });
    new cdk.CfnOutput(this, 'topicArn', { value: topic.topicArn });
  }
}
```

### Gen2 Output
```typescript
export class NotificationsStack extends Construct {
  public readonly topic: any;

  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const name = `topic-${process.env.AMPLIFY_ENV}`;
    const topic = new sns.Topic(this, 'Topic', { topicName: name });
  }
}
```

## Tests

Run tests:
```bash
npm test -- codegen-custom-resources
```

Test coverage:
- Scanner: Finding custom resources
- Parser: Extracting class and constructor
- Pattern Detector: Identifying Gen1 patterns
- Transformer: Converting Gen1 → Gen2
- Integration: End-to-end migration
