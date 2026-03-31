# Single-Shot Prompt — detectTemplateDrift rewrite (Issue #14570)

You are modifying `detect-template-drift.ts` to fix a bug where CloudFormation's `IncludeNestedStacks: true` causes the entire changeset to fail when any nested stack has an EarlyValidation error. The fix: create individual changesets per nested stack instead of one root changeset with nested included.

## Your task

Implement ALL of the following changes in a single session. Read all relevant files first, plan your approach, then execute.

## What to change

### 1. Root changeset with IncludeNestedStacks: false
Create a changeset on the root stack with `IncludeNestedStacks: false`. This checks root-level resources (DeploymentBucket, AuthRole, UnauthRole) and detects Modify on nested stack resources (template hash changes). Include root results in final output.

### 2. Enumerate nested stacks
Call `DescribeStackResourcesCommand` on the root stack, filter for `AWS::CloudFormation::Stack`, skip resources with `DELETE` in status.

### 3. Per-nested-stack changesets
For each nested stack: get resolved params via `DescribeStacks` on `PhysicalResourceId`, read cached template from local build dir, create individual changeset. Use `Bottleneck` (already in codebase) with `maxConcurrent: 3`.

### 4. Handle EarlyValidation as drift
When a nested changeset fails with `EarlyValidation::ResourceExistenceCheck`, treat as drift (NOT skip). Surface the failure as a change entry.

### 5. Collect partial results
One nested stack failure must NOT discard others. Add `skippedStacks?: string[]` to `TemplateDriftResults`. Return all collected changes alongside skipped list.

### 6. Fix console URLs
Fix `cfnChangesetConsoleUrl` in `drift-formatter.ts`. Correct format: `https://{region}.console.aws.amazon.com/cloudformation/home?region={region}#/stacks/{stackId}/changesets/{changeSetId}/changes`. Do NOT delete changesets before user can inspect. Cleanup on next run.

### 7. Paginate DescribeChangeSet
Handle `NextToken` in DescribeChangeSet responses to avoid silently truncating results.

### 8. DeletionPolicy drift filter
`amplify lock` adds DeletionPolicy: Retain to stateful resources. Filter out changes where the only difference is a DeletionPolicy addition. Reference: `detect-stack-drift.ts` has `isAmplifyAuthRoleDenyToAllowChange` as example.

### 9. Update tests
Update `drift-formatter.test.ts` if formatter interface changes. Add unit tests for new pure functions. Ensure all existing tests pass.

## Key files

All paths relative to repo root (`/local/home/paceben/workspace/scratch/14570-method-b/`):

- **File to modify**: `packages/amplify-cli/src/commands/drift-detection/detect-template-drift.ts` (349 lines)
- **Reference pattern**: `packages/amplify-cli/src/commands/drift-detection/detect-stack-drift.ts` — already handles nested stacks independently. Follow same patterns.
- **Formatter**: `packages/amplify-cli/src/commands/drift-detection/services/drift-formatter.ts`
- **Types/services**: `packages/amplify-cli/src/commands/drift-detection/services/index.ts`
- **CloudFormation service**: `packages/amplify-cli/src/commands/drift-detection/services/cloudformation-service.ts`
- **Tests**: `packages/amplify-cli/src/__tests__/commands/drift-detection/`

## CRITICAL rules

- MODIFY existing code. Do NOT rewrite from scratch. Preserve helper functions and patterns.
- Reuse `cleanupOldDriftChangesets` — call it per nested stack.
- Reuse `waitUntilChangeSetCreateComplete` SDK waiter — do NOT replace with manual polling.
- Preserve backward compatibility with `TemplateDriftResults` (add fields, don't remove without updating consumers).
- Keep changes proportional. If you can fix something in 5 lines, don't rewrite 50.

## Verification

After implementing, run:
```bash
cd packages/amplify-cli && npx tsc --noEmit && npx jest --testPathPattern="drift-detection" --no-coverage --passWithNoTests
```

Then commit all changes with a descriptive message.

## Live testing (optional)

Discussions app: `amplify-discussions-main-c39a5` in us-east-1 (locked + refactored).
```bash
aws cloudformation describe-stack-resources \
  --stack-name amplify-discussions-main-c39a5 --region us-east-1 \
  --query "StackResources[?ResourceType=='AWS::CloudFormation::Stack']"
```
