# Amplify Custom Resource Migration Tool Implementation Context

## Project Goal
Migrate all Gen1 custom CDK stacks from `amplify/backend/custom/<resource-name>/cdk-stack.ts` to Gen2's `backend.createStack()` pattern. Focus on CDK stacks only (CloudFormation templates excluded from initial scope).

## Current State Analysis

### What Currently Works ✅
- **Authentication Migration**: Cognito User Pools and Identity Pools migrate perfectly
- **GraphQL APIs**: Successfully migrated with proper data resources
- **Basic Project Structure**: Creates proper Gen 2 file structure
- **Package Dependencies**: Installs correct Gen 2 packages
- **Environment Handling**: Preserves environment configurations

### Critical Failures ❌
- **Custom CDK Resources**: Intentionally broken with `throw new Error()` statements
- **CDK Stacks**: Modified to `cdk.NestedStack` and AmplifyHelpers removed
- **Custom Infrastructure**: All custom CDK code becomes non-functional

## Architecture Understanding

### Gen 1 Custom Resource Structure
```
amplify/backend/custom/
├── notifications/
│   ├── cdk-stack.ts          # CDK Stack class
│   └── parameters.json
└── analytics/
    ├── cdk-stack.ts
    └── parameters.json
```

### Gen 2 Custom Resource Structure
```
amplify/
├── backend.ts                 # Updated with custom resource calls
└── custom/
    ├── notifications/
    │   └── resource.ts        # Converted to Construct
    └── analytics/
        └── resource.ts
```

## Key Conversion Patterns

### Custom Resource Migration (CRITICAL)
**Gen 1 CDK Stack → Gen 2 Construct + backend.createStack():**
```typescript
// Gen 1: CDK Stack class
export class cdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
    super(scope, id, props);
    
    new cdk.CfnParameter(this, 'env', {
      type: 'String',
      description: 'Current Amplify CLI env name',
    });

    const amplifyProjectInfo = AmplifyHelpers.getProjectInfo();
    const snsTopicResourceName = `sns-topic-${amplifyProjectInfo.projectName}-${cdk.Fn.ref('env')}`;
    
    const topic = new sns.Topic(this, 'sns-topic', {
      topicName: snsTopicResourceName,
    });

    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });
  }
}

// Gen 2: Construct class + backend.createStack()
// File: amplify/custom/notifications/resource.ts
export class NotificationsStack extends Construct {
  public readonly topic: sns.Topic;
  
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const projectName = process.env.AMPLIFY_PROJECT_NAME || 'myproject';
    const snsTopicResourceName = `sns-topic-${projectName}-${process.env.AMPLIFY_ENV}`;
    
    this.topic = new sns.Topic(this, 'sns-topic', {
      topicName: snsTopicResourceName,
    });
  }
}

// File: amplify/backend.ts
const notificationsStack = new NotificationsStack(
  backend.createStack('notifications'),
  'NotificationsStack'
);

backend.addOutput({
  custom: {
    snsTopicArn: notificationsStack.topic.topicArn,
  },
});
```

### Transformation Rules

| Gen1 Pattern | Gen2 Pattern | Action |
|-------------|-------------|--------|
| `export class cdkStack extends cdk.Stack` | `export class NotificationsStack extends Construct` | Convert to Construct |
| `constructor(scope, id, props?, amplifyResourceProps?)` | `constructor(scope, id, props?)` | Simplify constructor |
| `super(scope, id, props)` | `super(scope, id)` | Remove props from super |
| `new cdk.CfnParameter(this, 'env', {...})` | Remove entirely | Delete |
| `cdk.Fn.ref('env')` | `process.env.AMPLIFY_ENV` | Replace |
| `AmplifyHelpers.getProjectInfo().projectName` | `process.env.AMPLIFY_PROJECT_NAME` (or hardcode) | Replace |
| `AmplifyHelpers.getProjectInfo().envName` | `process.env.AMPLIFY_ENV` | Replace |
| `AmplifyHelpers.addResourceDependency(...)` | Manual import + reference | **Needs investigation** |
| `new cdk.CfnOutput(this, 'name', {value, description})` | Collect and add to `backend.addOutput()` | Transform |
| `this` (inside constructor) | `this` (same) | No change |

## Technical Implementation Requirements

### Migration Flow
1. **Scan**: Find all custom resources in `amplify/backend/custom/`
2. **Parse**: Extract class, imports, constructor body from `cdk-stack.ts`
3. **Transform**: Apply transformation rules (Stack → Construct, env refs, etc.)
4. **Extract Outputs**: Collect `cdk.CfnOutput` declarations
5. **Generate**: Create `amplify/custom/<name>/resource.ts` files
6. **Update Backend**: Add imports and `backend.createStack()` calls to `backend.ts`
7. **Add Outputs**: Generate `backend.addOutput()` with collected outputs

## Supported Resource Types

### Universal Approach
- All CDK constructs are preserved as-is
- Only the wrapper changes (Stack → Construct)
- Works with any AWS service (Lambda, DynamoDB, S3, SNS, API Gateway, EventBridge, SQS, CloudFront, etc.)
- No resource-specific migration logic needed

## Dependencies and APIs

### Key Packages
- `typescript` - AST parsing and code generation
- `@aws-amplify/cli-core` - Amplify CLI utilities
- `aws-cdk-lib` - CDK constructs (preserved in migration)

### Critical Patterns
- `backend.createStack()` - Creates stack for custom resources
- `backend.addOutput()` - Exports custom resource outputs
- `Construct` base class - Replaces `cdk.Stack`
- TypeScript AST parsing - Extract and transform code

## Success Criteria

### Complete Migration Requirements
1. **Migrate all custom resources** from `amplify/backend/custom/`
2. **Generate valid Gen2 TypeScript code** that compiles
3. **Convert Stack → Construct** properly
4. **Remove CfnParameter for 'env'**
5. **Replace environment references** (`cdk.Fn.ref('env')` → `process.env.AMPLIFY_ENV`)
6. **Transform CfnOutputs** → `backend.addOutput()`
7. **Update backend.ts** with custom resource calls
8. **Preserve all CDK constructs** and configurations
9. **Handle multiple custom resources**
10. **Provide guidance** for `AmplifyHelpers.addResourceDependency()` (manual step)

### Testing Standards
- Real Gen1 custom CDK stacks (SNS, SQS, Lambda, DynamoDB, S3, etc.)
- Multiple custom resources in one project
- Environment variable references
- CfnOutput declarations
- AmplifyHelpers usage patterns
- End-to-end code generation validation

## Technical Constraints

### Amplify Gen2 Architecture
- Custom resources use `backend.createStack()` pattern
- CDK constructs wrapped in `Construct` class (not `Stack`)
- Environment variables accessed via `process.env.AMPLIFY_ENV`
- Outputs added via `backend.addOutput()`

### Migration Tool Architecture
- Must preserve all original CDK constructs
- Cannot break existing working migrations (Auth, GraphQL)
- TypeScript AST parsing for code transformation
- Focus on CDK stacks only (CloudFormation excluded)

## Known Limitations & Manual Steps

### AmplifyHelpers.addResourceDependency()
**Status**: Needs investigation

**Gen1 Pattern**:
```typescript
const dependencies = AmplifyHelpers.addResourceDependency(this, category, resourceName, [
  { category: "function", resourceName: "myFunction" }
]);
const arn = cdk.Fn.ref(dependencies.function.myFunction.Arn);
```

**Gen2 Pattern** (needs confirmation):
```typescript
// Option 1: Direct import
import { myFunction } from '../function/resource';
const arn = myFunction.resources.lambda.functionArn;

// Option 2: Backend reference
const arn = backend.myFunction.resources.lambda.functionArn;
```

**Migration Strategy**:
- Detect `AmplifyHelpers.addResourceDependency()` calls
- Generate TODO comment with manual instructions
- Provide example code for common patterns
