# retain

The retain step applies `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain` to every resource in every Gen1 CloudFormation stack (root + all nested) after a successful migration. This protects the migrated Gen2 environment from unintended impact caused by subsequent edits or deletions of the defunct Gen1 stacks.

It is the final step in the migration lifecycle and is one-way — `--rollback` is rejected at the dispatcher and `rollback()` throws `NotImplementedFault`.

## Architecture

`AmplifyMigrationRetainStep` (`retain.ts`) returns a `Plan` whose operations are:

1. **Unlock** — overwrites the root stack's policy (set by `lock`) with `Allow Update:*` so retain's own change sets can run. There is no restore.
2. **Per-stack retain** — one operation per stack in the hierarchy, walked **root-first** (pre-order) via `paginateListStackResources`.

Each per-stack operation's `describe()` returns a single line (`Apply DeletionPolicy and UpdateReplacePolicy: Retain to resources in <stackName>`). `validate()` returns `undefined`. The real work happens inside `execute()`:

1. Fetch the stack's current template.
2. Mutate every resource in `Resources` by adding `DeletionPolicy: Retain` and `UpdateReplacePolicy: Retain`. Resources of type `AWS::CloudFormation::Stack` (nested-stack references) are skipped — the children are retained via their own per-stack operations.
3. Fetch current parameters via `DescribeStacks` and map them as `{ ParameterKey, UsePreviousValue: true }`.
4. Call `cfn.createChangeSet(...)`. If CloudFormation reports no changes, log and return.
5. Run the returned change set through `isAllowedRetainChangeset` — a strict whitelist accepting only `Modify` actions whose every `Details` entry is either a `DeletionPolicy` or `UpdateReplacePolicy` attribute set to `Retain`, or a harmless Dynamic/Automatic re-evaluation on a nested-stack entry. Any other shape throws `AmplifyError('MigrationError', ...)` with the rendered change set as the resolution.
6. Log `Changeset URL: <url>` for console inspection.
7. Call `cfn.executeChangeSet(...)` and wait for `UPDATE_COMPLETE`.

## Why lazy changeset creation

Change sets are created inside `execute()` rather than during `forward()`. An earlier design pre-created every change set during planning, but CloudFormation transitioned child change sets to `OBSOLETE` whenever a parent's execution initiated an update on the child. Creating and executing each stack's change set back-to-back closes that window.

The trade-off is that the operations summary shown before the confirmation prompt no longer includes per-stack change set URLs, and there is no pre-flight validations table. If a change set fails the whitelist mid-run, the run aborts; stacks already processed keep their retain edits. Rerunning `retain` resumes cleanly — processed stacks return "no retain changes needed" and unprocessed stacks get fresh change sets.

## Why root-first ordering

Nested stacks are declared via the parent's `TemplateURL`. When a parent is updated, CloudFormation may re-synthesize children from that URL and overwrite direct edits. Walking root-first ensures every stack's retain update is the last operation that can affect its own template. See the [nested stacks guide](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-nested-stacks.html) for CloudFormation's update semantics.

## CLI

```bash
amplify gen2-migration retain
```

Standard flags apply (`--skip-validations`, `--validations-only`, `--no-rollback`). `--rollback` is rejected.

## AI Development Notes

- The step is terminal. After `retain`, the user can delete the Gen1 stacks manually and the underlying AWS resources will be preserved.
- Retain is not durable against arbitrary future root-stack updates. The flow assumes the Gen1 stacks are about to be orphaned; nothing should be updating them afterward.
- Validation lives inside `execute()`, not in `Plan.validate()`. `plan.validate()` returns `true` unconditionally because each operation's `validate()` is `undefined`.
- `isAllowedRetainChangeset` accepts the Dynamic/Automatic nested-stack re-evaluation carve-out because CloudFormation always emits it for child `AWS::CloudFormation::Stack` entries whenever the parent is updated, even when our only change is adding retain attributes.
