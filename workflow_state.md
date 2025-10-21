# Amplify Custom Resource Migration Tool Development Workflow State

## Project Status: **ANALYSIS COMPLETE - READY FOR IMPLEMENTATION**

## Completed Analysis ✅

### Migration Tool Testing (2024-01-XX)
- [x] **Lambda Custom Resource Test** - FAILED (intentionally broken with error throws) - Analysis complete
- [x] **DynamoDB Custom Resource Test** - FAILED (intentionally broken with error throws) - Analysis complete  
- [x] **S3 Custom Resource Test** - FAILED (intentionally broken with error throws) - Analysis complete
- [x] **GraphQL API Test** - SUCCESS (properly migrated) - Analysis complete
- [x] **Authentication Test** - SUCCESS (properly migrated) - Analysis complete
- [x] **Multiple Custom Resources Test** - FAILED (all broken with error throws) - Analysis complete

### Root Cause Analysis ✅
- [x] **Tool Behavior Identified** - Intentionally breaks custom resources with `throw new Error()`
- [x] **Architecture Gaps Documented** - Missing Gen2 target mapping for custom resources
- [x] **Conversion Patterns Defined** - Gen1 → Gen2 mapping patterns documented
- [x] **Success Criteria Established** - Zero manual fixes for custom resources

## Implementation Plan 🚧

### Phase 1: Gen2 Target Mapping (Week 1) - CRITICAL FOUNDATION
- [ ] **Task 1.1**: Gen2TargetMapper interface implementation
  - [ ] Subtask: Create core mapping interface
  - [ ] Subtask: Define resource type detection logic
  - [ ] Subtask: Implement mapping decision tree
- [ ] **Task 1.2**: All 8 resources → `defineFunction()`/`defineCustom()` decision logic
  - [ ] Subtask: Lambda → `defineFunction()` (simple) or `defineCustom()` (complex)
  - [ ] Subtask: DynamoDB → `defineCustom()` (always)
  - [ ] Subtask: S3 → `defineCustom()` (always)
  - [ ] Subtask: SNS → `defineCustom()` (always)
  - [ ] Subtask: API Gateway → `defineCustom()` (always)
  - [ ] Subtask: EventBridge → `defineCustom()` (always)
  - [ ] Subtask: SQS → `defineCustom()` (always)
  - [ ] Subtask: CloudFront → `defineCustom()` (always)
- [ ] **Task 1.3**: Environment variable mapping
  - [ ] Subtask: `cdk.Fn.ref('env')` / `!Ref AWS::StackName` → `process.env.AMPLIFY_ENV`
  - [ ] Subtask: Handle environment-specific configurations
  - [ ] Subtask: Map project context variables
  - [ ] Subtask: CloudFormation intrinsic function mapping (`!Sub`, `!Join`, `!GetAtt`, `!Ref`)
- [ ] **Task 1.4**: AmplifyHelpers migration
  - [ ] Subtask: `getProjectInfo()` → Static project context
  - [ ] Subtask: `addResourceDependency()` → Import statements
  - [ ] Subtask: Handle cross-resource references
  - [ ] Subtask: CloudFormation reference migration (`!Ref`, `!GetAtt` → resource imports)
- [ ] **Task 1.5**: CDK Output / CloudFormation Outputs → Gen2 Export mapping
  - [ ] Subtask: Parse `cdk.CfnOutput` statements
  - [ ] Subtask: Parse CloudFormation `Outputs` section
  - [ ] Subtask: Generate Gen2 export statements
  - [ ] Subtask: Preserve output descriptions and values
- [ ] **Task 1.6**: CloudFormation template parser implementation
  - [ ] Subtask: YAML/JSON CloudFormation template parsing
  - [ ] Subtask: Resource extraction from CloudFormation templates
  - [ ] Subtask: Parameter and condition handling

### Phase 2: Resource-Specific Migration (Week 2) - TOP 8 RESOURCES
- [ ] **Task 2.1**: Lambda function migration
  - [ ] Subtask: Parse CDK Lambda constructs
  - [ ] Subtask: Extract runtime, handler, code configuration
  - [ ] Subtask: Generate `defineFunction()` or `defineCustom()` based on complexity
- [ ] **Task 2.2**: DynamoDB table migration
  - [ ] Subtask: Parse table configurations (keys, GSIs, streams)
  - [ ] Subtask: Generate `defineCustom()` with preserved settings
  - [ ] Subtask: Handle table policies and permissions
- [ ] **Task 2.3**: S3 bucket migration
  - [ ] Subtask: Extract bucket policies and CORS settings
  - [ ] Subtask: Migrate lifecycle rules and versioning
  - [ ] Subtask: Handle bucket notifications and triggers
- [ ] **Task 2.4**: SNS topic migration
  - [ ] Subtask: Parse topic configurations and subscriptions
  - [ ] Subtask: Generate `defineCustom()` with SNS constructs
  - [ ] Subtask: Preserve access policies and delivery settings
- [ ] **Task 2.5**: API Gateway migration
  - [ ] Subtask: Parse REST API configurations
  - [ ] Subtask: Handle routes, authorizers, and integrations
  - [ ] Subtask: Generate `defineCustom()` with API Gateway constructs
- [ ] **Task 2.6**: EventBridge rules migration
  - [ ] Subtask: Parse event rules and targets
  - [ ] Subtask: Generate `defineCustom()` with EventBridge constructs
  - [ ] Subtask: Preserve rule patterns and schedules
- [ ] **Task 2.7**: SQS queue migration
  - [ ] Subtask: Parse queue configurations and policies
  - [ ] Subtask: Handle dead letter queues and visibility timeouts
  - [ ] Subtask: Generate `defineCustom()` with SQS constructs
- [ ] **Task 2.8**: CloudFront distribution migration
  - [ ] Subtask: Parse distribution configurations
  - [ ] Subtask: Handle origins, behaviors, and cache policies
  - [ ] Subtask: Generate `defineCustom()` with CloudFront constructs

### Phase 3: Universal Migration Engine (Week 3) - FALLBACK SYSTEM
- [ ] **Task 3.1**: Smart fallback chain implementation
  - [ ] Subtask: Pattern matching for known configurations
  - [ ] Subtask: Generic CDK construct detection
  - [ ] Subtask: Fallback to universal `defineCustom()` generation
- [ ] **Task 3.2**: Universal CDK stack parser
  - [ ] Subtask: TypeScript AST parsing for CDK constructs
  - [ ] Subtask: Extract construct properties and configurations
  - [ ] Subtask: Handle complex CDK patterns and inheritance
- [ ] **Task 3.3**: Cross-resource dependency ordering
  - [ ] Subtask: Analyze resource dependencies
  - [ ] Subtask: Generate proper import order
  - [ ] Subtask: Handle circular dependency detection
- [ ] **Task 3.4**: Enhanced error recovery
  - [ ] Subtask: Automatic retry with fixes for common failures
  - [ ] Subtask: Detailed error messages with context
  - [ ] Subtask: Guided manual steps generator with code snippets

### Phase 4: Testing & Validation (Week 4) - PRODUCTION READINESS
- [ ] **Task 4.1**: Test fixture creation
  - [ ] Subtask: Gen1 custom resources for all 8 resource types
  - [ ] Subtask: Complex dependencies and cross-resource references
  - [ ] Subtask: Edge cases (AmplifyHelpers, environment variables)
- [ ] **Task 4.2**: Automated testing pipeline
  - [ ] Subtask: Unit tests for each parser, mapper, and migrator
  - [ ] Subtask: Integration tests for end-to-end migration scenarios
  - [ ] Subtask: Performance tests for large projects
- [ ] **Task 4.3**: Validation & deployment testing
  - [ ] Subtask: Pre-migration validation
  - [ ] Subtask: Post-migration code validation
  - [ ] Subtask: Actual deployment testing of migrated resources
- [ ] **Task 4.4**: Error recovery testing
  - [ ] Subtask: Test auto-retry mechanisms
  - [ ] Subtask: Validate manual step generation
  - [ ] Subtask: Test rollback capabilities

## Success Metrics

### Completion Criteria
- [ ] **Any Custom Resource Deploys Successfully**: All migrated resources must deploy without errors
- [ ] **95% Custom Resource Coverage**: Top 8 resource types migrate successfully
- [ ] **Zero Manual Fixes**: No broken `throw new Error()` statements
- [ ] **Environment Preservation**: All Gen1 environment variables work in Gen2
- [ ] **Dependency Preservation**: Cross-resource references maintained
- [ ] **Performance**: <30 seconds for custom resource migration

### Test Coverage Targets
- [ ] **Unit Tests**: 90%+ code coverage for all migration logic
- [ ] **Integration Tests**: End-to-end custom resource migration scenarios
- [ ] **Real-world Tests**: Production custom resource migration validation
- [ ] **Error Rate**: <5% of migrations require manual intervention
- [ ] **Deployment Success**: 95%+ of migrated resources deploy successfully

## Technical Implementation

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

## Next Actions
1. **Start with Phase 1 (Gen2 Target Mapping)** - Critical foundation for all custom resource migration
2. **Focus on Lambda first** - Most common custom resource and your exact use case
3. **Create comprehensive test fixtures** - Real Gen1 custom resources for validation
4. **Implement incremental validation** - Ensure each phase works before moving to next

## Notes
- **Laser focus on custom resources only** - GraphQL and Auth already work
- **Gen2 target mapping is critical** - Without it, migration is impossible
- **Lambda gets special treatment** - Only resource with `defineFunction()` option
- **All other resources use `defineCustom()`** - Amplify Gen2 architectural limitation
- **Realistic success rate: 90-95%** - 5-10% edge cases will get manual guidance
