# Simplified Custom Resource Migration Plan

## Goal
Transform Gen1 custom CDK stacks into Gen2's `backend.createStack()` pattern without breaking functionality.

## Current State
- Migration tool detects custom resources
- Intentionally breaks them with `throw new Error()`
- Forces manual migration

## Target State
- Parse Gen1 CDK stacks
- Extract constructs from class constructors
- Generate Gen2-compatible code using `backend.createStack()`

---

## Migration Transform

### Input: Gen1 Custom Stack
```typescript
// amplify/backend/custom/MyCustomStack/cdk-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';

export class MyCustomStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const topic = new sns.Topic(this, 'NotificationTopic', {
      topicName: 'notifications',
      displayName: 'App Notifications'
    });
    
    const queue = new sqs.Queue(this, 'ProcessingQueue', {
      queueName: 'processing-queue',
      visibilityTimeout: cdk.Duration.seconds(300)
    });
    
    new cdk.CfnOutput(this, 'TopicArn', {
      value: topic.topicArn,
      exportName: 'NotificationTopicArn'
    });
  }
}
```

### Output: Gen2 Custom Resources
```typescript
// amplify/data/custom-resources.ts
import { defineBackend } from '@aws-amplify/backend';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as cdk from 'aws-cdk-lib';

export function addCustomResources(backend: ReturnType<typeof defineBackend>) {
  const { stack } = backend.createStack('MyCustomStack');
  
  const topic = new sns.Topic(stack, 'NotificationTopic', {
    topicName: 'notifications',
    displayName: 'App Notifications'
  });
  
  const queue = new sqs.Queue(stack, 'ProcessingQueue', {
    queueName: 'processing-queue',
    visibilityTimeout: cdk.Duration.seconds(300)
  });
  
  new cdk.CfnOutput(stack, 'TopicArn', {
    value: topic.topicArn,
    exportName: 'NotificationTopicArn'
  });
}
```

```typescript
// amplify/backend.ts (updated)
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { addCustomResources } from './data/custom-resources';

const backend = defineBackend({
  auth,
  data
});

addCustomResources(backend);
```

---

## Implementation

### Core Components

#### 1. CDK Stack Parser
```typescript
interface StackParser {
  parseFile(filePath: string): ParsedStack;
  extractConstructor(classDeclaration: ClassDeclaration): ConstructorBody;
  extractImports(sourceFile: SourceFile): ImportStatement[];
}

interface ParsedStack {
  className: string;
  imports: ImportStatement[];
  constructorBody: string;
  constructs: CDKConstruct[];
}
```

#### 2. Code Transformer
```typescript
interface CodeTransformer {
  replaceThisWithStack(code: string): string;
  removeSuperCall(code: string): string;
  extractConstructs(constructorBody: string): CDKConstruct[];
}
```

#### 3. Gen2 Generator
```typescript
interface Gen2Generator {
  generateCustomResourceFile(parsed: ParsedStack): string;
  updateBackendFile(customResourcePath: string): string;
}
```

### Transformation Rules

| Gen1 Pattern | Gen2 Pattern |
|-------------|-------------|
| `extends cdk.Stack` | Function with `backend.createStack()` |
| `this` (in constructor) | `stack` |
| `super(scope, id, props)` | Remove |
| `constructor(...)` body | Function body |
| Class file | Exported function |

---

## Implementation Steps

### Phase 1: Parser (Week 1)
**Goal**: Extract constructs from Gen1 CDK classes

**Tasks**:
- [ ] Parse TypeScript CDK stack files using TS compiler API
- [ ] Extract class constructor body
- [ ] Identify all CDK construct instantiations
- [ ] Extract import statements
- [ ] Handle CloudFormation templates (if any)

**Deliverables**:
- `cdk-stack-parser.ts` - Parse Gen1 stack files
- `construct-extractor.ts` - Extract CDK constructs from constructor
- Unit tests with 10+ real Gen1 stack examples

### Phase 2: Transformer (Week 1)
**Goal**: Transform Gen1 code to Gen2 format

**Tasks**:
- [ ] Replace `this` → `stack`
- [ ] Remove `super()` calls
- [ ] Remove class wrapper
- [ ] Preserve all construct code
- [ ] Handle `cdk.CfnOutput` statements
- [ ] Map environment variables (`cdk.Fn.ref('env')` → `process.env.AMPLIFY_ENV`)

**Deliverables**:
- `code-transformer.ts` - Transform Gen1 → Gen2 patterns
- `environment-mapper.ts` - Map Gen1 env vars to Gen2
- Unit tests for transformation logic

### Phase 3: Generator (Week 1)
**Goal**: Generate Gen2 files

**Tasks**:
- [ ] Generate `custom-resources.ts` file
- [ ] Create exported function wrapper
- [ ] Include all necessary imports
- [ ] Update `backend.ts` to call custom resource function
- [ ] Preserve file structure and naming

**Deliverables**:
- `gen2-generator.ts` - Generate Gen2 files
- `backend-updater.ts` - Update backend.ts
- Integration tests with end-to-end migration

### Phase 4: Integration & Testing (Week 1)
**Goal**: Validate migrations work in real Gen2 projects

**Tasks**:
- [ ] Test with 20+ real Gen1 custom stacks
- [ ] Validate generated code compiles
- [ ] Test deployment to AWS
- [ ] Handle edge cases (AmplifyHelpers, cross-resource refs)
- [ ] Error handling and validation

**Deliverables**:
- End-to-end integration tests
- Real-world migration validation
- Error recovery mechanisms

---

## File Structure

```
migration-tool/
├── src/
│   ├── parsers/
│   │   ├── cdk-stack-parser.ts          # Parse Gen1 CDK stacks
│   │   └── construct-extractor.ts       # Extract CDK constructs
│   ├── transformers/
│   │   ├── code-transformer.ts          # Transform Gen1 → Gen2
│   │   └── environment-mapper.ts        # Map env variables
│   ├── generators/
│   │   ├── gen2-generator.ts            # Generate Gen2 files
│   │   └── backend-updater.ts           # Update backend.ts
│   └── migrator.ts                      # Main orchestrator
├── test/
│   ├── fixtures/
│   │   ├── gen1-stacks/                 # Real Gen1 examples
│   │   └── expected-gen2/               # Expected outputs
│   ├── unit/
│   │   ├── parser.test.ts
│   │   ├── transformer.test.ts
│   │   └── generator.test.ts
│   └── integration/
│       └── end-to-end.test.ts
```

---

## Edge Cases to Handle

### 1. AmplifyHelpers References
```typescript
// Gen1
AmplifyHelpers.addResourceDependency(this, 'auth', 'userPool');

// Gen2
// Import auth resource directly
import { auth } from '../auth/resource';
// Use backend.auth reference
```

### 2. Environment Variables
```typescript
// Gen1
const envName = cdk.Fn.ref('env');

// Gen2
const envName = process.env.AMPLIFY_ENV;
```

### 3. Cross-Stack References
```typescript
// Gen1
const apiId = cdk.Fn.importValue('ApiId');

// Gen2
import { data } from '../data/resource';
const apiId = backend.data.resources.graphqlApi.apiId;
```

### 4. Multiple Custom Stacks
Generate separate functions for each stack, all called from `backend.ts`.

---

## Success Criteria

- ✅ Parse 100% of Gen1 CDK stack files
- ✅ Extract all CDK constructs without loss
- ✅ Generate valid Gen2 TypeScript code
- ✅ Preserve all resource configurations
- ✅ Handle imports correctly
- ✅ Map environment variables
- ✅ Generated code compiles without errors
- ✅ Deployed resources match Gen1 behavior
- ✅ 95%+ of custom resources migrate successfully
- ✅ Clear error messages for unsupported patterns

---

## Timeline: 4 Weeks

- **Week 1**: Parser implementation + unit tests
- **Week 2**: Transformer implementation + unit tests  
- **Week 3**: Generator implementation + integration tests
- **Week 4**: Real-world testing + edge case handling

---

## Key Differences from Previous Plan

1. **No resource-specific migrators** - Universal approach for all CDK constructs
2. **No `defineCustom()`** - Use Gen2's actual `backend.createStack()` pattern
3. **Simple transformation** - Extract and reformat, not rebuild
4. **Leverages existing Gen2 features** - No new abstractions needed
5. **Realistic timeline** - 4 weeks instead of complex phased approach
