# retain

The retain subcommand applies `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain` to every resource in every Gen1 CloudFormation stack below the root. Once applied, the user can manually delete the Gen1 root stack and every underlying AWS resource (DynamoDB tables, S3 buckets, Cognito pools, AppSync APIs, Lambdas) survives as an orphan.

Unlike the other steps, retain does not touch the root stack. The root's direct resources are Amplify's own IAM plumbing and bootstrap Lambda — not user data. Skipping root also avoids the risk of clobbering child stacks via `TemplateURL` reconciliation during parent updates.

## Key Responsibilities

- Walks the Gen1 stack hierarchy pre-order (parent before children) starting from the root's children; root is excluded.
- For each stack, fetches the template lazily at execute time (not at plan time) and skips the CFN round-trip entirely when every resource already has retain.
- Applies retain to every resource **except** `AWS::CloudFormation::Stack` references. Leaving nested-stack references untouched keeps the parent changeset strictly additive on non-stack attributes and avoids forcing CFN to rewrite child `Properties`.
- Creates a CloudFormation changeset per stack and validates it against a whitelist before executing.
- Rollback is not supported (`NotImplementedFault`). To undo, edit the CloudFormation templates directly.

## Architecture

```mermaid
flowchart TD
    CLI["amplify gen2-migration retain"] --> STEP["AmplifyMigrationRetainStep"]
    STEP --> WALK["walkStackHierarchy(rootStackId)"]
    WALK -->|"pre-order DFS, excluding root"| IDS["stackIds[]"]
    STEP --> CLASSIFY["classifyStacks()"]
    CLASSIFY -->|"Map<stackId, StackContext>"| CTX["context"]
    IDS --> BUILDOP["buildRetainOperation(stackId, ctx)"]
    CTX --> BUILDOP
    BUILDOP -->|"per-stack AmplifyMigrationOperation"| PLAN["Plan"]
    PLAN -->|"execute()"| EXEC["For each stack: fetchTemplate → mutate → createChangeSet → validate → executeChangeSet"]
```

### `AmplifyMigrationRetainStep`

[`src/commands/gen2-migration/retain.ts`](../../../../packages/amplify-cli/src/commands/gen2-migration/retain.ts)

Implements the standard step lifecycle. `forward()` builds a `Plan` of per-stack operations. `rollback()` throws `NotImplementedFault`.

### `walkStackHierarchy`

Recursive pre-order DFS over `AWS::CloudFormation::Stack` resource entries. Returns every stack in the tree except the root. Pre-order is required so parents are processed before children — any parent update triggers CFN's Automatic/Dynamic re-evaluation of nested stack references, which is benign when no `Properties` actually changed but clobbers children if retain is applied in a different order.

### `classifyStacks`

Builds `Map<stackId, StackContext>` that associates each nested stack with its Amplify `DiscoveredResource`. Used purely for UX: `Plan.describe` groups operations under `Resource: <category>/<name> (<service>)` headers, and the execute-time spinner carries matching context labels.

For AppSync, the api-stack is tagged with the api resource, per-model nested stacks carry `modelName`, and the three infrastructure sub-stacks (`ConnectionStack`, `FunctionDirectiveStack`, `CustomResourcesjson`) carry `subStackLabel`.

Stacks not classified fall through to the default `Project` group with stack-name-only labels.

### `buildRetainOperation`

Returns one `AmplifyMigrationOperation` per stack. The operation's `execute()` is lazy — it fetches the template, filters to non-`AWS::CloudFormation::Stack` resources, mutates their `DeletionPolicy` / `UpdateReplacePolicy` to `Retain`, creates the changeset, validates it via `isAllowedRetainChangeset`, and executes it.

Idempotent on reruns: if every target resource already has retain, the whole CFN round-trip is skipped. A second short-circuit handles the case where CFN's own "no changes" detection elides an edit (`Custom::*` resources with empty Properties — see [cloudformation-coverage-roadmap#1543](https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/1543)).

### `isAllowedRetainChangeset`

Whitelists a retain-only changeset. Accepts two kinds of changes:

- Direct `DeletionPolicy` or `UpdateReplacePolicy` edits targeting `Retain`.
- CFN's own no-op Automatic/Dynamic re-evaluations on `AWS::CloudFormation::Stack` references, emitted on every parent update. These are bookkeeping — they don't trigger child reconciliation because no `Properties` value actually changed.

Any other change (Properties edits on non-stack resources, Add, Remove, Replacement=True) throws `MigrationError`.

## Design Notes

### Why skip the root stack

Root's direct resources (`AuthRole`, `UnauthRole`, `DeploymentBucket`, `DeploymentBucketBlockHTTP`, bootstrap Lambda) are Amplify's plumbing, not user data. More importantly, updating root post-refactor risks cascading TemplateURL reconciliation through the entire tree. The root is left alone; the user manually deletes it after retain completes, and CFN cascades through the already-retained children.

### Why skip `AWS::CloudFormation::Stack` entries

Adding retain to a nested stack reference would be a no-op for child protection — the child's own retain state is what matters when the cascade delete hits it. Leaving the reference entry untouched keeps the parent changeset narrow (only non-stack attributes change) and keeps Plan output readable.

### Why lazy

Eager changeset creation at plan time creates N changesets up front; any parent update invalidates later children's changesets (`OBSOLETE`). Lazy creation happens inside each operation's `execute()` in sequence, so each stack's changeset is always fresh relative to the current deployed state.

### Why pre-order

Parent update must land before child update. If a child is retained first and the parent is updated next, CFN emits an Automatic/Dynamic re-evaluation on that child's reference. The re-evaluation is structurally benign (Target.Attribute=Properties, no actual value diff) but ordering matters for operator confidence — pre-order ensures the changeset inventory at each step is understandable.

## AI Development Notes

- The step runs after `lock`, `generate`, `refactor`, and user-side Gen2 sandbox validation in the e2e flow. At that point Gen1 stacks have drifted from their S3 `TemplateURL` (refactor moved resources without re-uploading child templates). Updating intermediates or root post-refactor is unsafe — the "skip `AWS::CloudFormation::Stack` entries in parent templates" rule is what makes updating intermediates safe here.
- `Custom::*` resources with empty `Properties` cannot be retained via a retain-only edit — CFN returns "didn't contain changes" and the `!changeset` branch treats it as a no-op. These resources are inert (no `ServiceToken`), so the gap is cosmetic.
- To undo retain, run the retain templates through CloudFormation manually without the `DeletionPolicy`/`UpdateReplacePolicy` attributes. The step itself has no rollback path.
- When adding a new resource type to `KNOWN_RESOURCE_KEYS`, update `classifyStacks` — the exhaustive switch will force the compiler to flag it.
