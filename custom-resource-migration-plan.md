# Custom CDK Resource Migration Plan (Gen1 → Gen2)

## Goal
Migrate all Gen1 custom CDK stacks from `amplify/backend/custom/<resource-name>/cdk-stack.ts` to Gen2's `backend.createStack()` pattern.

---

## Migration Transform

### Gen1 Input Structure
```
amplify/backend/custom/
├── notifications/
│   ├── cdk-stack.ts          # CDK Stack class
│   └── parameters.json
└── analytics/
    ├── cdk-stack.ts
    └── parameters.json
```

### Gen2 Output Structure
```
amplify/
├── backend.ts                 # Updated with custom resource calls
└── custom/
    ├── notifications/
    │   └── resource.ts        # Converted to Construct
    └── analytics/
        └── resource.ts
```

---

## Transformation Rules

| Gen1 Pattern | Gen2 Pattern | Action |
|-------------|-------------|---------|
| `export class cdkStack extends cdk.Stack` | `export class NotificationsStack extends Construct` | Convert to Construct |
| `constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps)` | `constructor(scope: Construct, id: string, props?: NotificationsStackProps)` | Simplify constructor |
| `super(scope, id, props)` | `super(scope, id)` | Remove props from super |
| `new cdk.CfnParameter(this, 'env', {...})` | Remove entirely | Delete |
| `cdk.Fn.ref('env')` | `process.env.AMPLIFY_ENV` | Replace |
| `AmplifyHelpers.getProjectInfo().projectName` | `process.env.AMPLIFY_PROJECT_NAME` (or hardcode) | Replace |
| `AmplifyHelpers.getProjectInfo().envName` | `process.env.AMPLIFY_ENV` | Replace |
| `AmplifyHelpers.addResourceDependency(...)` | Manual import + reference | **Needs investigation** |
| `new cdk.CfnOutput(this, 'name', {value, description})` | Collect and add to `backend.addOutput()` | Transform |
| `this` (inside constructor) | `this` (same) | No change |

---

## Step-by-Step Migration

### Step 1: Parse Gen1 Custom Resources
- Scan `amplify/backend/custom/` directory
- For each subdirectory, find `cdk-stack.ts`
- Parse TypeScript file using TS Compiler API
- Extract:
  - Class name
  - Imports
  - Constructor body
  - CfnOutputs

### Step 2: Transform Code
For each custom resource:

1. **Convert class declaration**
   ```typescript
   // Gen1
   export class cdkStack extends cdk.Stack {
   
   // Gen2
   export class NotificationsStack extends Construct {
   ```

2. **Simplify constructor signature**
   ```typescript
   // Gen1
   constructor(scope: Construct, id: string, props?: cdk.StackProps, amplifyResourceProps?: AmplifyHelpers.AmplifyResourceProps) {
     super(scope, id, props);
   
   // Gen2
   constructor(scope: Construct, id: string, props?: NotificationsStackProps) {
     super(scope, id);
   ```

3. **Remove CfnParameter for 'env'**
   ```typescript
   // Gen1 - DELETE THIS
   new cdk.CfnParameter(this, 'env', {
     type: 'String',
     description: 'Current Amplify CLI env name',
   });
   ```

4. **Replace environment references**
   ```typescript
   // Gen1
   const name = `resource-${cdk.Fn.ref('env')}`;
   
   // Gen2
   const name = `resource-${process.env.AMPLIFY_ENV}`;
   ```

5. **Replace AmplifyHelpers.getProjectInfo()**
   ```typescript
   // Gen1
   const projectName = AmplifyHelpers.getProjectInfo().projectName;
   const envName = AmplifyHelpers.getProjectInfo().envName;
   
   // Gen2
   const projectName = process.env.AMPLIFY_PROJECT_NAME || 'myproject';
   const envName = process.env.AMPLIFY_ENV;
   ```

6. **Extract CfnOutputs**
   ```typescript
   // Gen1
   new cdk.CfnOutput(this, 'snsTopicArn', {
     value: topic.topicArn,
     description: 'The arn of the SNS topic',
   });
   
   // Gen2 - Store for later, return from construct
   // Will be added to backend.addOutput()
   ```

7. **Handle AmplifyHelpers.addResourceDependency()**
   ```typescript
   // Gen1
   const dependencies: AmplifyDependentResourcesAttributes = AmplifyHelpers.addResourceDependency(
     this,
     amplifyResourceProps.category,
     amplifyResourceProps.resourceName,
     [{ category: "function", resourceName: "myFunction" }]
   );
   const myFunctionArn = cdk.Fn.ref(dependencies.function.myFunction.Arn);
   
   // Gen2 - TODO: Need to figure out how to reference Amplify resources
   // Likely: import { myFunction } from '../function/resource';
   // Then: myFunction.resources.lambda.functionArn
   ```

### Step 3: Generate Gen2 Files

#### 3a. Generate Custom Resource File
Create `amplify/custom/<resource-name>/resource.ts`:

```typescript
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export type NotificationsStackProps = {
  // Add any custom props here
};

export class NotificationsStack extends Construct {
  public readonly topic: sns.Topic;
  
  constructor(scope: Construct, id: string, props?: NotificationsStackProps) {
    super(scope, id);
    
    const snsTopicResourceName = `sns-topic-myproject-${process.env.AMPLIFY_ENV}`;
    this.topic = new sns.Topic(this, 'sns-topic', {
      topicName: snsTopicResourceName,
    });

    this.topic.addSubscription(new subs.EmailSubscription('<your-email-address>'));
  }
}
```

#### 3b. Update backend.ts
Add to `amplify/backend.ts`:

```typescript
import { NotificationsStack } from './custom/notifications/resource';

const backend = defineBackend({
  auth,
  data
});

// Add custom resources
const notificationsStack = new NotificationsStack(
  backend.createStack('notifications'),
  'NotificationsStack'
);

// Add outputs
backend.addOutput({
  custom: {
    notificationsTopicArn: notificationsStack.topic.topicArn,
  },
});
```

---

## Implementation Plan

### Phase 1: Parser (Week 1)
**Goal**: Extract all information from Gen1 CDK stacks

**Tasks**:
- [ ] Scan `amplify/backend/custom/` for all custom resources
- [ ] Parse each `cdk-stack.ts` using TypeScript Compiler API
- [ ] Extract class name, imports, constructor body
- [ ] Identify all patterns to transform:
  - CfnParameter declarations
  - `cdk.Fn.ref('env')` calls
  - `AmplifyHelpers.getProjectInfo()` calls
  - `AmplifyHelpers.addResourceDependency()` calls
  - `cdk.CfnOutput` declarations
- [ ] Build AST representation of the stack

**Deliverables**:
- `custom-resource-scanner.ts` - Find all custom resources
- `cdk-stack-parser.ts` - Parse Gen1 CDK stacks
- `pattern-detector.ts` - Detect transformation patterns

### Phase 2: Transformer (Week 1-2)
**Goal**: Transform Gen1 patterns to Gen2 patterns

**Tasks**:
- [ ] Convert `cdk.Stack` → `Construct`
- [ ] Simplify constructor signature
- [ ] Remove `cdk.CfnParameter` for 'env'
- [ ] Replace `cdk.Fn.ref('env')` → `process.env.AMPLIFY_ENV`
- [ ] Replace `AmplifyHelpers.getProjectInfo()` → environment variables
- [ ] Extract `cdk.CfnOutput` declarations
- [ ] Handle `AmplifyHelpers.addResourceDependency()` (manual guidance for now)
- [ ] Preserve all other CDK constructs unchanged

**Deliverables**:
- `code-transformer.ts` - Transform Gen1 → Gen2 code
- `environment-replacer.ts` - Replace env references
- `output-extractor.ts` - Extract CfnOutputs

### Phase 3: Generator (Week 2)
**Goal**: Generate Gen2 file structure

**Tasks**:
- [ ] Generate `amplify/custom/<resource-name>/resource.ts` for each custom resource
- [ ] Generate proper TypeScript class with Construct base
- [ ] Export public properties for outputs
- [ ] Update `amplify/backend.ts` with:
  - Import statements for custom resources
  - `backend.createStack()` calls
  - `backend.addOutput()` with collected outputs
- [ ] Preserve proper indentation and formatting

**Deliverables**:
- `gen2-file-generator.ts` - Generate Gen2 files
- `backend-updater.ts` - Update backend.ts
- `output-generator.ts` - Generate backend.addOutput() calls

### Phase 4: Testing & Edge Cases (Week 2-3)
**Goal**: Validate migrations work correctly

**Tasks**:
- [ ] Test with simple custom resources (SNS, SQS)
- [ ] Test with complex custom resources (Lambda + DynamoDB + S3)
- [ ] Test with multiple custom resources
- [ ] Test with CfnOutputs
- [ ] Test with environment variable references
- [ ] Handle AmplifyHelpers.addResourceDependency() edge cases
- [ ] Validate generated code compiles
- [ ] Test deployment to AWS

**Deliverables**:
- Integration tests with real Gen1 projects
- Edge case handling
- Error messages for unsupported patterns

---

## Known Limitations & Manual Steps

### 1. AmplifyHelpers.addResourceDependency()
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

### 2. AmplifyHelpers.getProjectInfo()
**Status**: Partially solved

**Mapping**:
- `projectName` → `process.env.AMPLIFY_PROJECT_NAME` (if available) or hardcode
- `envName` → `process.env.AMPLIFY_ENV`

**Migration Strategy**:
- Replace with environment variables
- Add comment if project name needs to be hardcoded

---

## File Structure

```
packages/amplify-cli/src/commands/gen2-migration/custom-resources/
├── scanner/
│   └── custom-resource-scanner.ts       # Find all Gen1 custom resources
├── parser/
│   ├── cdk-stack-parser.ts              # Parse Gen1 CDK stacks
│   └── pattern-detector.ts              # Detect transformation patterns
├── transformer/
│   ├── code-transformer.ts              # Main transformation logic
│   ├── environment-replacer.ts          # Replace env references
│   └── output-extractor.ts              # Extract CfnOutputs
├── generator/
│   ├── gen2-file-generator.ts           # Generate Gen2 files
│   ├── backend-updater.ts               # Update backend.ts
│   └── output-generator.ts              # Generate backend.addOutput()
└── index.ts                             # Main orchestrator
```

---

## Success Criteria

- ✅ Migrate all custom resources from `amplify/backend/custom/`
- ✅ Generate valid Gen2 TypeScript code
- ✅ Convert `cdk.Stack` → `Construct`
- ✅ Remove `cdk.CfnParameter` for 'env'
- ✅ Replace `cdk.Fn.ref('env')` → `process.env.AMPLIFY_ENV`
- ✅ Replace `AmplifyHelpers.getProjectInfo()` → environment variables
- ✅ Transform `cdk.CfnOutput` → `backend.addOutput()`
- ✅ Update `backend.ts` with custom resource calls
- ✅ Generated code compiles without errors
- ✅ Preserve all CDK constructs and configurations
- ✅ Handle multiple custom resources
- ⚠️ Provide guidance for `AmplifyHelpers.addResourceDependency()` (manual step)

---

## Timeline: 3 Weeks

- **Week 1**: Parser + Pattern Detection
- **Week 2**: Transformer + Generator
- **Week 3**: Testing + Edge Cases + Documentation

---

## Example Migration

### Gen1 Input
```typescript
// amplify/backend/custom/notifications/cdk-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as AmplifyHelpers from '@aws-amplify/cli-extensibility-helper';
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

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

    topic.addSubscription(new subs.EmailSubscription('<your-email-address>'));
    
    new cdk.CfnOutput(this, 'snsTopicArn', {
      value: topic.topicArn,
      description: 'The arn of the SNS topic',
    });
  }
}
```

### Gen2 Output

**File 1: amplify/custom/notifications/resource.ts**
```typescript
import { Construct } from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export class NotificationsStack extends Construct {
  public readonly topic: sns.Topic;
  
  constructor(scope: Construct, id: string) {
    super(scope, id);
    
    const projectName = process.env.AMPLIFY_PROJECT_NAME || 'myproject';
    const snsTopicResourceName = `sns-topic-${projectName}-${process.env.AMPLIFY_ENV}`;
    
    this.topic = new sns.Topic(this, 'sns-topic', {
      topicName: snsTopicResourceName,
    });

    this.topic.addSubscription(new subs.EmailSubscription('<your-email-address>'));
  }
}
```

**File 2: amplify/backend.ts (additions)**
```typescript
import { NotificationsStack } from './custom/notifications/resource';

const backend = defineBackend({
  auth,
  data
});

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
