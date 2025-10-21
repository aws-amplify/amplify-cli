# Amplify Custom Resource Migration Tool Implementation Context

## Project Goal
Ensure any custom resource from a Gen 1 Amplify project migrates to Gen 2 and deploys successfully without deployment errors. Currently, all custom resources are intentionally broken with error throws.

## Current State Analysis

### What Currently Works ✅
- **Authentication Migration**: Cognito User Pools and Identity Pools migrate perfectly
- **GraphQL APIs**: Successfully migrated with proper data resources
- **Basic Project Structure**: Creates proper Gen 2 file structure
- **Package Dependencies**: Installs correct Gen 2 packages
- **Environment Handling**: Preserves environment configurations

### Critical Failures ❌
- **Custom Resources**: Intentionally broken with `throw new Error()` statements
- **CDK Stacks**: Modified to `cdk.NestedStack` and AmplifyHelpers removed
- **Custom Lambda Functions**: Broken error throws prevent deployment
- **Custom Infrastructure**: All custom CDK code becomes non-functional

## Architecture Understanding

### Gen 1 Custom Resource Structure
```
amplify/backend/custom/[name]/
├── cdk-stack.ts                       # CDK stack with constructs
├── template.json                      # CloudFormation template (alternative)
├── template.yaml                      # CloudFormation template (alternative)
├── parameters.json                    # Stack parameters
└── build/                             # Compiled outputs
```

### Gen 2 Custom Resource Structure
```
amplify/custom/[name]/
├── resource.ts                        # defineCustom() pattern
└── [optional-files]/                  # Supporting files
```

## Key Conversion Patterns

### Custom Resource Migration (CRITICAL)
**Gen 1 CDK Stack → Gen 2 defineCustom():**
```typescript
// Gen 1: Current broken state after migration tool
export class cdkStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    throw new Error('Follow https://docs.amplify.aws/react/start/migrate-to-gen2/ to update the resource dependency');
    // Original CDK code here...
  }
}

// Gen 2: Target working state
export const customResource = defineCustom({
  name: "customLambda",
  stack(stack) {
    const lambda = new Function(stack, 'CustomLambda', {
      runtime: Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: Code.fromInline(`...`),
      functionName: `custom-lambda-${process.env.AMPLIFY_ENV}`
    });
    return { lambdaArn: lambda.functionArn };
  },
});
```

**Gen 1 CloudFormation Template → Gen 2 defineCustom():**
```yaml
# Gen 1: CloudFormation template
Resources:
  CustomLambda:
    Type: AWS::Lambda::Function
    Properties:
      Runtime: nodejs18.x
      Handler: index.handler
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            return { statusCode: 200 };
          };
      FunctionName: !Sub "custom-lambda-${AWS::StackName}"
Outputs:
  LambdaArn:
    Value: !GetAtt CustomLambda.Arn

# Gen 2: Target working state (same as above)
```

### Environment Variable Migration
**Gen 1 → Gen 2 Mappings:**
- `cdk.Fn.ref('env')` / `!Ref AWS::StackName` → `process.env.AMPLIFY_ENV`
- `AmplifyHelpers.getProjectInfo()` / `!Ref AWS::Region` → Static project context
- `AmplifyHelpers.addResourceDependency()` / `!Ref` / `!GetAtt` → Import statements
- CloudFormation intrinsic functions:
  - `!Sub "${AWS::StackName}"` → `process.env.AMPLIFY_ENV`
  - `!Join ["-", ["prefix", !Ref "AWS::StackName"]]` → `\`prefix-${process.env.AMPLIFY_ENV}\``
  - `!GetAtt Resource.Property` → `resource.property`

### Resource Type Decision Logic
**Lambda Functions:**
- Simple Lambda → `defineFunction()` (Amplify-managed)
- Complex Lambda → `defineCustom()` (full CDK control)

**All Other Resources:**
- DynamoDB → `defineCustom()` (always)
- S3 → `defineCustom()` (always)
- SNS → `defineCustom()` (always)
- API Gateway → `defineCustom()` (always)
- EventBridge → `defineCustom()` (always)
- SQS → `defineCustom()` (always)
- CloudFront → `defineCustom()` (always)

## Technical Implementation Requirements

### Gen2 Target Mapping System (CRITICAL)
```typescript
interface Gen2TargetMapper {
  mapLambda(lambda: CDKLambda | CFNLambda): DefineFunction | DefineCustom;
  mapDynamoDB(table: CDKTable | CFNTable): DefineCustom;
  mapS3Bucket(bucket: CDKS3 | CFNS3): DefineCustom;
  mapOutputs(outputs: CDKOutputs | CFNOutputs): Gen2Exports;
  mapEnvironment(env: string): Gen2EnvRef;
  mapCrossResourceDeps(deps: AmplifyDependency[] | CFNRefs[]): Gen2ResourceRefs;
  mapCloudFormationIntrinsics(intrinsics: CFNIntrinsic[]): Gen2Equivalent[];
}
```

### Migration Flow
1. **Detect Resource Type**: Determine if CDK stack or CloudFormation template
2. **Parse Resources**: Extract constructs from Gen 1 CDK files or CloudFormation templates
3. **Remove Error Throws**: Clean up intentionally broken code (CDK only)
4. **Map to Gen2**: Use target mapping to determine Gen2 pattern
5. **Generate Code**: Create proper `defineCustom()` or `defineFunction()`
6. **Register Backend**: Add to `defineBackend()` call

## Supported Resource Types (Priority Order)

### Phase 1: Top 8 Resources (85% Coverage)
1. **Lambda Functions** - Most common custom resource
2. **DynamoDB Tables** - Data storage
3. **S3 Buckets** - File storage
4. **SNS Topics** - Messaging
5. **API Gateway** - REST APIs
6. **EventBridge** - Event routing
7. **SQS** - Message queues
8. **CloudFront** - CDN distributions

### Phase 2: Universal Fallback (95% Coverage)
- Pattern matching for known configurations
- Generic CDK construct handling
- Manual step generation for edge cases

## Dependencies and APIs

### Key Packages
- `@aws-amplify/backend` - Gen 2 resource definitions
- `aws-cdk-lib` - CDK constructs and utilities
- `typescript` - AST parsing and code generation
- `@aws-amplify/cli-core` - Amplify CLI utilities
- `js-yaml` - CloudFormation YAML parsing
- `jsonschema` - CloudFormation template validation

### Critical Functions
- `defineCustom()` - Primary pattern for custom resources
- `defineFunction()` - Simple Lambda functions only
- `defineBackend()` - Backend resource registry
- TypeScript AST parsing - CDK construct extraction

## Success Criteria

### Complete Migration Requirements
1. **Zero Manual Fixes**: No broken `throw new Error()` statements
2. **Custom Resource Coverage**: 95% of custom resources migrate successfully
3. **Environment Preservation**: All Gen1 environment variables work in Gen2
4. **Dependency Preservation**: Cross-resource references maintained
5. **Performance**: <30 seconds for custom resource migration

### Testing Standards
- Real Gen1 custom resource examples for all 8 resource types (CDK + CloudFormation)
- Complex dependencies and cross-resource references
- Edge cases (AmplifyHelpers, environment variables, CloudFormation intrinsics)
- End-to-end deployment validation
- Error recovery and rollback testing
- CloudFormation template validation and parsing

## Technical Constraints

### Amplify Gen2 Limitations
- Only Lambda has dedicated `defineFunction()` API
- All other resources must use `defineCustom()`
- No direct CloudFormation support (CDK only)
- Environment variables use different patterns

### Migration Tool Architecture
- Must preserve all original functionality
- Cannot break existing working migrations (Auth, GraphQL)
- Must handle CDK version compatibility
- TypeScript AST parsing for complex constructs

## Risk Mitigation

### Known Edge Cases (5-10% of projects)
- Custom CDK patterns not seen before
- Complex AmplifyHelpers usage
- Circular cross-resource dependencies
- Runtime CDK modifications

### Fallback Strategy
- Universal migrator for unknown patterns
- Manual step generation with code snippets
- Clear error messages with guidance
- Rollback capability for failed migrations
