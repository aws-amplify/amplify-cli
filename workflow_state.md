# Amplify Custom Resource Migration Tool Development Workflow State

## Project Status: **IMPLEMENTATION PLAN FINALIZED**

## Completed Analysis ✅

### Migration Tool Testing
- [x] **Custom CDK Resources** - Currently broken with `throw new Error()` statements
- [x] **GraphQL API Test** - SUCCESS (properly migrated)
- [x] **Authentication Test** - SUCCESS (properly migrated)

### Root Cause Analysis ✅
- [x] **Tool Behavior Identified** - Intentionally breaks custom resources
- [x] **Gen2 Architecture Understood** - Uses `backend.createStack()` pattern
- [x] **Transformation Rules Defined** - Stack → Construct conversion
- [x] **Migration Plan Created** - See custom-resource-migration-plan.md

## Implementation Plan 🚧

### Phase 1: Parser (Week 1)
**Goal**: Extract all information from Gen1 CDK stacks

- [ ] **Task 1.1**: Custom Resource Scanner
  - [ ] Scan `amplify/backend/custom/` for all custom resources
  - [ ] Find `cdk-stack.ts` in each subdirectory
  - [ ] Build list of resources to migrate

- [ ] **Task 1.2**: CDK Stack Parser
  - [ ] Parse TypeScript files using TS Compiler API
  - [ ] Extract class name and imports
  - [ ] Extract constructor body
  - [ ] Identify constructor parameters

- [ ] **Task 1.3**: Pattern Detector
  - [ ] Detect `cdk.CfnParameter` for 'env'
  - [ ] Detect `cdk.Fn.ref('env')` calls
  - [ ] Detect `AmplifyHelpers.getProjectInfo()` calls
  - [ ] Detect `AmplifyHelpers.addResourceDependency()` calls
  - [ ] Detect `cdk.CfnOutput` declarations

**Deliverables**:
- `custom-resource-scanner.ts`
- `cdk-stack-parser.ts`
- `pattern-detector.ts`
- Unit tests with real Gen1 examples

### Phase 2: Transformer (Week 1-2)
**Goal**: Transform Gen1 patterns to Gen2 patterns

- [ ] **Task 2.1**: Code Transformer
  - [ ] Convert `cdk.Stack` → `Construct`
  - [ ] Simplify constructor signature
  - [ ] Remove `super(scope, id, props)` props parameter
  - [ ] Preserve constructor body

- [ ] **Task 2.2**: Environment Replacer
  - [ ] Remove `new cdk.CfnParameter(this, 'env', {...})`
  - [ ] Replace `cdk.Fn.ref('env')` → `process.env.AMPLIFY_ENV`
  - [ ] Replace `AmplifyHelpers.getProjectInfo().projectName` → `process.env.AMPLIFY_PROJECT_NAME`
  - [ ] Replace `AmplifyHelpers.getProjectInfo().envName` → `process.env.AMPLIFY_ENV`

- [ ] **Task 2.3**: Output Extractor
  - [ ] Find all `cdk.CfnOutput` declarations
  - [ ] Extract output name, value, and description
  - [ ] Store for backend.addOutput() generation

- [ ] **Task 2.4**: Dependency Handler
  - [ ] Detect `AmplifyHelpers.addResourceDependency()` usage
  - [ ] Generate TODO comments with manual instructions
  - [ ] Provide example code snippets

**Deliverables**:
- `code-transformer.ts`
- `environment-replacer.ts`
- `output-extractor.ts`
- Unit tests for transformation logic

### Phase 3: Generator (Week 2)
**Goal**: Generate Gen2 file structure

- [ ] **Task 3.1**: Gen2 File Generator
  - [ ] Generate `amplify/custom/<resource-name>/resource.ts`
  - [ ] Create Construct class with proper imports
  - [ ] Export public properties for outputs
  - [ ] Preserve proper formatting and indentation

- [ ] **Task 3.2**: Backend Updater
  - [ ] Update `amplify/backend.ts`
  - [ ] Add import statements for custom resources
  - [ ] Add `backend.createStack()` calls
  - [ ] Instantiate custom resource constructs

- [ ] **Task 3.3**: Output Generator
  - [ ] Generate `backend.addOutput()` calls
  - [ ] Map CfnOutputs to Gen2 output format
  - [ ] Preserve output structure and naming

**Deliverables**:
- `gen2-file-generator.ts`
- `backend-updater.ts`
- `output-generator.ts`
- Integration tests

### Phase 4: Testing & Edge Cases (Week 2-3)
**Goal**: Validate migrations work correctly

- [ ] **Task 4.1**: Test Fixtures
  - [ ] Simple custom resources (SNS, SQS)
  - [ ] Complex custom resources (Lambda + DynamoDB + S3)
  - [ ] Multiple custom resources
  - [ ] CfnOutputs
  - [ ] Environment variable references
  - [ ] AmplifyHelpers usage

- [ ] **Task 4.2**: Integration Testing
  - [ ] End-to-end migration tests
  - [ ] Validate generated code compiles
  - [ ] Test with real Gen1 projects
  - [ ] Edge case handling

- [ ] **Task 4.3**: Validation
  - [ ] TypeScript compilation checks
  - [ ] Import statement validation
  - [ ] Output format validation
  - [ ] Error message quality

**Deliverables**:
- Integration test suite
- Real-world migration validation
- Error handling and recovery

## Success Metrics

### Completion Criteria
- [ ] Migrate all custom resources from `amplify/backend/custom/`
- [ ] Generate valid Gen2 TypeScript code
- [ ] Convert `cdk.Stack` → `Construct`
- [ ] Remove `cdk.CfnParameter` for 'env'
- [ ] Replace `cdk.Fn.ref('env')` → `process.env.AMPLIFY_ENV`
- [ ] Replace `AmplifyHelpers.getProjectInfo()` → environment variables
- [ ] Transform `cdk.CfnOutput` → `backend.addOutput()`
- [ ] Update `backend.ts` with custom resource calls
- [ ] Generated code compiles without errors
- [ ] Preserve all CDK constructs and configurations
- [ ] Handle multiple custom resources
- [ ] Provide guidance for `AmplifyHelpers.addResourceDependency()` (manual step)

### Test Coverage Targets
- [ ] Unit tests for parser, transformer, generator
- [ ] Integration tests with real Gen1 stacks
- [ ] Multiple custom resources in one project
- [ ] Environment variable references
- [ ] CfnOutput declarations
- [ ] AmplifyHelpers usage patterns

## Technical Implementation

### File Structure
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

## Next Actions
1. **Start with Phase 1 (Parser)** - Extract information from Gen1 CDK stacks
2. **Create test fixtures** - Real Gen1 custom resources for validation
3. **Implement Phase 2 (Transformer)** - Apply transformation rules
4. **Implement Phase 3 (Generator)** - Generate Gen2 files
5. **Test end-to-end** - Validate with real projects

## Timeline: 3 Weeks
- **Week 1**: Parser + Pattern Detection
- **Week 2**: Transformer + Generator
- **Week 3**: Testing + Edge Cases + Documentation

## Notes
- **Focus on CDK stacks only** - CloudFormation templates excluded from initial scope
- **Universal approach** - No resource-specific migration logic needed
- **Simple transformation** - Stack → Construct, preserve all CDK code
- **Manual steps for edge cases** - AmplifyHelpers.addResourceDependency() needs investigation
