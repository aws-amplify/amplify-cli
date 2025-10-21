# Amplify Custom Resource Migration Tool Plan

## Executive Summary
The current Amplify Gen 1 → Gen 2 migration tool intentionally breaks custom resources with error throws, requiring manual migration. This plan outlines the implementation strategy to ensure **any custom resource from Gen1 deploys successfully in Gen2 without errors**.

## Problem Statement

### Current Tool Behavior for Custom Resources
- **Detection**: Tool successfully identifies custom CDK stacks
- **Modification**: Intentionally breaks them with `throw new Error()` 
- **Guidance**: Points to manual migration docs
- **File Changes**: Converts `cdk.Stack` → `cdk.NestedStack`, removes AmplifyHelpers

### Business Impact
- **Developer Experience**: Custom resources become broken and non-deployable
- **Adoption Blocker**: Prevents Gen 2 migration for projects with custom resources
- **Manual Work**: Requires extensive rewriting of custom CDK code

## Solution Architecture

### Core Migration Components

#### 1. Custom Resource Parser
```typescript
interface CustomResourceMigrator {
  parseCDKStack(stackFile: string): CDKConstructs[];
  parseCloudFormationTemplate(templateFile: string): CFNResources[];
  removeErrorThrows(stackFile: string): string;
  extractResourceDefinitions(constructs: CDKConstructs[] | CFNResources[]): ResourceDef[];
  generateGen2Custom(resources: ResourceDef[]): string;
}
```

#### 2. Gen2 Target Mapping System (CRITICAL)
```typescript
interface Gen2TargetMapper {
  mapLambda(lambda: CDKLambda): DefineFunction | DefineCustom;
  mapDynamoDB(table: CDKTable): DefineCustom;
  mapS3Bucket(bucket: CDKS3): DefineCustom;
  mapOutputs(outputs: CDKOutputs): Gen2Exports;
  mapEnvironment(env: string): Gen2EnvRef;
  mapCrossResourceDeps(deps: AmplifyDependency[]): Gen2ResourceRefs;
}
```

**Gen1 → Gen2 Mapping Patterns:**
- `lambda.Function` / `AWS::Lambda::Function` → `defineFunction()` (if simple) or `defineCustom()` (if complex)
- `dynamodb.Table` / `AWS::DynamoDB::Table` → `defineCustom()` with CDK constructs
- `s3.Bucket` / `AWS::S3::Bucket` → `defineCustom()` with CDK constructs
- `cdk.CfnOutput` / `Outputs` section → Export statements in Gen2 backend
- `cdk.Fn.ref('env')` / `!Ref AWS::StackName` → `process.env.AMPLIFY_ENV`
- `AmplifyHelpers.addResourceDependency()` / `!Ref` / `!GetAtt` → Resource reference imports

#### 3. Environment & Dependency Migration
```typescript
interface EnvironmentMigrator {
  mapGen1EnvVars(envRefs: CDKEnvRef[]): Gen2EnvPattern[];
  mapAmplifyHelpers(helpers: AmplifyHelper[]): Gen2ResourceRef[];
  handleCDKIntrinsics(intrinsics: CDKIntrinsic[]): Gen2Equivalent[];
}
```

**Critical Mappings:**
- `${cdk.Fn.ref('env')}` / `!Ref AWS::StackName` → `process.env.AMPLIFY_ENV`
- `AmplifyHelpers.getProjectInfo()` / `!Ref AWS::Region` → Static project context
- `AmplifyHelpers.addResourceDependency()` / `!Ref` / `!GetAtt` → Import statements
- CloudFormation intrinsic functions (`!Sub`, `!Join`, `!Split`) → Template literal equivalents

#### 4. Resource-Specific Migrators
```typescript
interface SpecificResourceMigrator {
  detectResourceType(resourcePath: string): ResourceType;
  parseCDKStack(stackFile: string): CDKResourceDefinition;
  parseCloudFormationResource(cfnResource: CFNResource): CDKResourceDefinition;
  generateGen2Resource(definition: ResourceDefinition): string;
}
```

**Supported Resource Types (Priority Order):**
1. **Lambda Functions** - Most common custom resource
2. **DynamoDB Tables** - Data storage
3. **S3 Buckets** - File storage
4. **SNS Topics** - Messaging
5. **API Gateway** - REST APIs
6. **EventBridge** - Event routing
7. **SQS** - Message queues
8. **CloudFront** - CDN distributions

#### 5. Universal Migration Engine
```typescript
interface UniversalMigrator {
  parseCDKStack(stackFile: string): CDKConstructs[];
  parseCloudFormationTemplate(templateFile: string): CFNResources[];
  extractOutputs(constructs: CDKConstructs[] | CFNResources[]): ResourceOutputs;
  generateDefineCustom(constructs: CDKConstructs[] | CFNResources[]): string;
}
```

## Implementation Phases

### Phase 1: Gen2 Target Mapping (Week 1)
**Goal**: Implement critical Gen1 → Gen2 mapping patterns

**Deliverables:**
- [ ] Gen2TargetMapper interface implementation
- [ ] All 8 resources → `defineFunction()`/`defineCustom()` decision logic
  - Lambda → `defineFunction()` (simple) or `defineCustom()` (complex)
  - DynamoDB → `defineCustom()` (always)
  - S3 → `defineCustom()` (always)  
  - SNS → `defineCustom()` (always)
  - API Gateway → `defineCustom()` (always)
  - EventBridge → `defineCustom()` (always)
  - SQS → `defineCustom()` (always)
  - CloudFront → `defineCustom()` (always)
- [ ] Environment variable mapping (`cdk.Fn.ref('env')` / `!Ref AWS::StackName` → Gen2 patterns)
- [ ] AmplifyHelpers migration (`getProjectInfo()`, `addResourceDependency()`)
- [ ] CloudFormation intrinsic function mapping (`!Sub`, `!Join`, `!GetAtt`, `!Ref`)
- [ ] CDK Output / CloudFormation Outputs → Gen2 Export mapping
- [ ] Cross-resource dependency resolution (CDK + CloudFormation)
- [ ] CloudFormation template parser implementation

**Success Criteria:**
- All Gen1 patterns have Gen2 equivalents
- Environment variables map correctly
- Cross-resource dependencies preserved

### Phase 2: Resource-Specific Migration (Week 2)
**Goal**: Migrate top 8 custom resources using TypeScript compiler API

**Deliverables:**
- [ ] Lambda function migration (CDK constructs)
- [ ] DynamoDB table migration with all configurations
- [ ] S3 bucket migration with policies and triggers
- [ ] SNS topic migration with subscriptions
- [ ] API Gateway migration with routes and authorizers
- [ ] EventBridge rules and targets migration
- [ ] SQS queue migration with policies
- [ ] CloudFront distribution migration

**Success Criteria:**
- Each resource migrates with complete configuration preservation
- All outputs and cross-references maintained
- 85% of real-world custom resources fully supported

### Phase 3: Universal Migration Engine (Week 3)
**Goal**: Handle remaining resource types with smart fallback chain

**Deliverables:**
- [ ] Smart fallback chain implementation
- [ ] Pattern matching system for known configurations
- [ ] Universal CDK stack parser using TypeScript compiler API
- [ ] Cross-resource dependency ordering system
- [ ] Output extraction and mapping system
- [ ] Enhanced error recovery with auto-retry
- [ ] Guided manual steps generator with code snippets

**Success Criteria:**
- Smart fallback chain handles complex migration scenarios
- 95% coverage with enhanced error recovery
- Remaining 5% get detailed manual steps with code examples

## Technical Implementation

### Key Algorithms

#### Custom Resource Migration Flow
```typescript
function migrateCustomResource(resource: CustomResource): MigrationResult {
  // Remove error throws first
  const cleanedStack = removeErrorThrows(resource.stackFile);
  
  // Try resource-specific migration
  if (hasSpecificMigrator(resource.type)) {
    return migrateSpecific(resource);
  }
  
  // Try universal migration with validation
  const universal = migrateUniversal(resource);
  if (validateMigration(universal)) {
    return universal;
  }
  
  // Generate guided manual steps
  return generateGuidedManualSteps(resource);
}
```

#### Gen2 Code Generation
```typescript
function generateGen2CustomResource(constructs: CDKConstructs[]): string {
  return `
export const customResource = defineCustom({
  name: "${resourceName}",
  stack(stack) {
    ${mapConstructsToGen2(constructs)}
    return ${generateOutputObject(constructs)};
  },
});
  `;
}
```

### File Structure
```
migration-tool/
├── src/
│   ├── parsers/
│   │   ├── cdk-parser.ts               # TypeScript AST parsing
│   │   ├── cloudformation-parser.ts    # CloudFormation YAML/JSON parsing
│   │   └── custom-resource-parser.ts
│   ├── mappers/
│   │   ├── gen2-target-mapper.ts       # Critical mapping logic
│   │   ├── environment-mapper.ts
│   │   ├── dependency-mapper.ts
│   │   └── cloudformation-mapper.ts    # CloudFormation → CDK mapping
│   ├── migrators/
│   │   ├── resource-specific/
│   │   │   ├── lambda-migrator.ts
│   │   │   ├── dynamodb-migrator.ts
│   │   │   ├── s3-migrator.ts
│   │   │   └── [other-resources].ts
│   │   └── universal-migrator.ts
│   └── generators/
│       ├── custom-resource-generator.ts
│       └── backend-generator.ts
```

## Quality Assurance & Testing

### Testing Strategy
1. **Unit Tests**: Each parser, mapper, and migrator component
2. **Integration Tests**: End-to-end custom resource migration scenarios
3. **Regression Tests**: Ensure existing functionality preserved
4. **Real-world Tests**: Production custom resource migration validation

### Test Fixtures
```
test/
├── fixtures/
│   ├── gen1-custom-resources/
│   │   ├── cdk-stacks/                 # CDK TypeScript stacks
│   │   ├── cloudformation-templates/   # CloudFormation YAML/JSON
│   │   ├── lambda-functions/           # Your exact use case
│   │   ├── dynamodb-tables/
│   │   ├── s3-buckets/
│   │   ├── complex-dependencies/       # Cross-resource refs
│   │   └── edge-cases/                 # AmplifyHelpers, env vars
│   └── expected-gen2/
│       ├── lambda-defineFunction/
│       ├── lambda-defineCustom/
│       └── other-resources/
├── integration/
│   ├── migration-end-to-end.test.ts
│   ├── cloudformation-migration.test.ts
│   └── error-recovery.test.ts
└── performance/
    └── large-projects.test.ts
```

### Validation & Error Recovery
```typescript
interface MigrationValidator {
  validatePreMigration(resource: CustomResource): ValidationResult;
  validatePostMigration(gen2Code: string): ValidationResult;
  validateDeployment(gen2Project: string): DeploymentResult;
}

interface ErrorRecovery {
  detectFailureReason(error: MigrationError): FailureType;
  suggestFix(failure: FailureType): AutoFix | ManualSteps;
  retryWithFix(resource: CustomResource, fix: AutoFix): MigrationResult;
}
```

## Success Metrics

- **Custom Resource Coverage**: 95% of custom resources migrate successfully
- **Zero Manual Fixes**: No broken `throw new Error()` statements
- **Environment Preservation**: All Gen1 environment variables work in Gen2
- **Dependency Preservation**: Cross-resource references maintained
- **Performance**: <30 seconds for custom resource migration
- **Test Coverage**: 90%+ unit test coverage for all migration logic
- **Error Rate**: <5% of migrations require manual intervention
- **Deployment Success**: 95%+ of migrated resources deploy successfully

## Risk Mitigation

### Technical Risks
- **CDK Version Compatibility**: Test against multiple CDK versions
- **Complex Dependencies**: Extensive test coverage for cross-resource refs
- **Environment Variables**: Validate all Gen1 → Gen2 env mappings
- **Edge Cases**: Test AmplifyHelpers, intrinsic functions, custom patterns

### Mitigation Strategies
- **Comprehensive Test Suite**: 50+ real-world custom resource examples
- **Validation Pipeline**: Pre/post migration validation with deployment testing
- **Error Recovery**: Automatic retry with fixes for common failures
- **Rollback Capability**: Restore original Gen1 state if migration fails

## Timeline: 4 Weeks (Including Testing)
- **Week 1**: Gen2 Target Mapping + Unit Tests
- **Week 2**: Resource-Specific Migration + Integration Tests
- **Week 3**: Universal Migration Engine + Error Recovery
- **Week 4**: End-to-end Testing + Production Validation

This approach ensures custom resources migrate reliably with comprehensive testing coverage.
