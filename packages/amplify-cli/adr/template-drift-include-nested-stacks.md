# ADR: Template Drift Detection with IncludeNestedStacks

> **Created:** 2026-04-21

## Context

### What we're solving

The gen2-migration lock step adds `DeletionPolicy: Retain` to stateful
resources before the refactor step moves them between stacks. If the
refactor fails or the user runs `--rollback`, the lock rollback needs
to verify that no resources have actually drifted — confirming the
environment is still consistent and safe to revert the DeletionPolicy
changes.

Phase 2 drift detection (`detectTemplateDrift`) is the mechanism for
this verification. It creates a CloudFormation changeset with
`IncludeNestedStacks: true` on the root stack and compares the
deployed state against the cached template. If there is no drift
(beyond the expected DeletionPolicy changes from the lock step itself),
lock rollback can proceed safely.

### Two problems

**Problem 1: FAILED changesets are discarded.**

After gen2-migration refactor moves resources (e.g., DynamoDB tables,
S3 buckets) from Gen1 nested stacks to Gen2 stacks, the Gen1 templates
still reference those resources. CloudFormation's `EarlyValidation`
step checks whether referenced resources exist in the target stack and
fails the changeset with:

```
EarlyValidation::ResourceExistenceCheck failed for resource(s) [activity-main]
```

The current code (lines 190-203 of `detect-template-drift.ts`) treats
all FAILED changesets as errors and discards them:

```typescript
if (changeSet.Status === 'FAILED') {
  // ...deletes changeset, returns { changes: [], skipped: true }
}
```

Similarly, `analyzeChangeSet` (lines 251-264) bails on FAILED nested
changesets during recursive traversal.

This means Phase 2 reports zero drift for any app that has been through
gen2-migration refactor, even when real template drift exists on
non-failing nested stacks.

**Problem 2: Lock's DeletionPolicy changes are expected drift.**

The lock step modifies templates to add `DeletionPolicy: Retain` to
stateful resources. When Phase 2 compares these modified templates
against the deployed stack, the DeletionPolicy additions appear as
template drift. This is _expected_ — the lock step intentionally made
these changes. The drift detection must distinguish lock's DeletionPolicy
changes from real drift (someone changed something outside of amplify).

This is distinct from the FAILED changeset problem but compounds it:
even when we successfully read changes from a FAILED changeset, we
need to filter out the DeletionPolicy noise to determine if there is
_real_ drift that would make lock rollback unsafe.

### Failure type distinction

Not all FAILED changesets are equal:

- **EarlyValidation failures** (e.g., `ResourceExistenceCheck`): CFN
  still populates the Changes array before failing. The changeset is
  describable and its changes are usable. This is the common case for
  post-migration stacks.

- **Other failures** (e.g., `InsufficientCapabilities`, malformed
  template, IAM errors): CFN may not populate Changes at all. These
  represent real errors, not the expected post-migration state.

The code must handle these differently: proceed with EarlyValidation
failures (read whatever Changes are available), but treat other
failures as genuine errors.

### The 14570 per-nested-stack approach

Issue #14570 proposed replacing `IncludeNestedStacks: true` with a
client-side approach: create independent changesets on each nested stack
using `UsePreviousTemplate: true`, fetch templates from S3, and use
Bottleneck for rate limiting. This was prototyped as Method B across
three parallel worktree experiments.

### Empirical findings

Testing against the live discussions app (amplify-discussions-main-c39a5,
5 nested stacks, 3 of which fail EarlyValidation) revealed:

1. **FAILED changesets contain usable Changes data.** CloudFormation
   populates `Changes` on nested changesets _before_ validation fails.
   `DescribeChangeSet` on a FAILED nested changeset returns the full
   changes array. Confirmed: storageactivity (2 changes),
   storageavatars (6 changes), storagebookmarks (2 changes) — all
   FAILED with EarlyValidation, all with Changes populated.

2. **CFN does not exit early on one nested failure.** When
   `IncludeNestedStacks: true` is set, CloudFormation creates changesets
   for _all_ nested stacks regardless of whether some fail validation.
   The root changeset fails, but all 5 nested changesets are created
   and describable.

   Exact root StatusReason: `Nested change set <ARN> was not
successfully created: Currently in FAILED.` — references only the
   first failing nested changeset. Does NOT contain "EarlyValidation".

   Exact nested EarlyValidation StatusReason: `The following
hook(s)/validation failed: [AWS::EarlyValidation::
ResourceExistenceCheck]. To troubleshoot Early Validation errors,
use the DescribeEvents API for detailed failure information.`

3. **Per-nested-stack approach produces false positives.** Creating an
   independent changeset on a nested stack (e.g., apidiscussions)
   _without_ `IncludeNestedStacks` reports 6 phantom `Modify` changes
   on `AWS::CloudFormation::Stack` resources. These changes do not exist
   when using `IncludeNestedStacks: true` from the root. The root
   approach correctly suppresses parameter-propagation noise that the
   isolated approach cannot.

4. **Template sources are equivalent.** S3 template and deployed
   template are byte-for-byte identical. `UsePreviousTemplate: true`
   and `TemplateBody` fetched from S3 produce identical changeset
   results.

5. **Auth and apidiscussions succeed cleanly.** 2 of 5 nested stacks
   pass changeset creation. Auth shows 7 real changes; apidiscussions
   shows 0.

6. **Nested changeset race condition.** The root changeset fails as
   soon as _any_ nested changeset fails, but other nested changesets
   may still be `CREATE_IN_PROGRESS`. Integration testing confirmed:
   apidiscussions was still in-progress when the root returned FAILED.
   Code must poll each nested changeset to terminal status before
   describing it.

7. **Template format errors are also recoverable.** Amplify AppSync API
   stacks contain model sub-stacks that export names via `Fn::Join` with
   parameter references. With `IncludeNestedStacks: true`, CFN cannot
   resolve intrinsic functions at validation time — all exports appear as
   `{{IntrinsicFunction://Fn::Join}}`, triggering `"Template format
error: duplicate Export names"`. Despite the failure, CFN populates
   Changes before the export validation step. The function was broadened
   from `isEarlyValidationFailure` to `isRecoverableFailure` to handle
   both EarlyValidation and Template format error failures. When a
   recoverable failure produces zero Changes, the stack is treated as
   incomplete (not clean).

8. **Cascading IAM Policy changes from DeletionPolicy modifications.**
   When `DeletionPolicy: Retain` is added to a DynamoDB table, CFN
   flags every IAM Policy whose `PolicyDocument` references that table's
   attributes (e.g., `TodoTable.Arn`) as a Dynamic ResourceAttribute
   re-evaluation. These appear as `Modify` changes on `AWS::IAM::Policy`
   with `Scope: ['Properties']`, `ChangeSource: ResourceAttribute`,
   `Evaluation: Dynamic`, `RequiresRecreation: Never`, and
   `CausingEntity: <TableLogicalId>.Arn`. These are harmless and must
   be filtered alongside direct DeletionPolicy drift.

### Comparison

| Dimension             | IncludeNestedStacks: true | Per-nested (Method B) |
| --------------------- | ------------------------- | --------------------- |
| False positives       | None observed             | 6 phantom changes     |
| Code complexity       | ~30 lines changed         | ~400 lines new        |
| CFN API calls         | 1 CreateChangeSet         | N+1 CreateChangeSet   |
| Rate limiting needed  | No                        | Yes (Bottleneck)      |
| New dependencies      | None                      | bottleneck, S3 client |
| FAILED stack handling | Read Changes anyway       | Same, plus false pos  |
| Sub-nested recursion  | Built-in (ChangeSetId)    | Must re-implement     |

## Decision

Keep `IncludeNestedStacks: true` and read changes from FAILED changesets
instead of discarding them. Filter out expected DeletionPolicy drift
from the lock step. Do not implement the per-nested-stack approach.

### Change 1: Root changeset — always fall through on FAILED

Empirical finding: the root changeset's StatusReason when a nested
stack fails EarlyValidation is:

```
Nested change set <ARN> was not successfully created: Currently in FAILED.
```

This does NOT contain "EarlyValidation" — it just references the first
nested changeset that failed. The root cannot classify the failure type.

Therefore, the root should always fall through to `analyzeChangeSet`
when FAILED (except for "no changes"). Classification happens at the
nested level:

```typescript
// Current: bail on all FAILED (lines 190-203)
if (changeSet.Status === 'FAILED') {
  return { changes: [], skipped: true, skipReason: ... };
}

// Proposed: fall through to analyzeChangeSet for nested inspection
if (changeSet.Status === 'FAILED') {
  if (changeSet.StatusReason?.includes("didn't contain changes")) {
    // No drift — clean result
    return { changes: [], skipped: false };
  }
  // Any other FAILED reason: nested stacks may still have data.
  // Fall through — analyzeChangeSet classifies each nested changeset.
  print.warn(`Root changeset FAILED: ${changeSet.StatusReason}`);
}
```

### Change 2: Nested changeset analysis — classify per-stack

Each nested changeset classifies itself. Three observed StatusReason
patterns:

1. `"The submitted information didn't contain changes..."` — no drift,
   clean skip.
2. `"The following hook(s)/validation failed: [AWS::EarlyValidation::ResourceExistenceCheck]..."` — EarlyValidation failure,
   Changes are populated, read them.
3. `"Only executable from the root change set."` with
   Status=CREATE_COMPLETE — success, read Changes normally.

Any other StatusReason is a genuine error — skip that stack.

```typescript
function isRecoverableFailure(reason?: string): boolean {
  if (!reason) return false;
  if (reason.includes('EarlyValidation')) return true;
  if (reason.includes('Template format error')) return true;
  return false;
}

// In analyzeChangeSet:
if (changeSet.Status === 'FAILED') {
  if (changeSet.StatusReason?.includes("didn't contain changes")
      || changeSet.StatusReason?.includes('No updates')) {
    return result; // genuinely no changes
  }
  if (isRecoverableFailure(changeSet.StatusReason)) {
    if (!changeSet.Changes?.length) {
      // Recoverable failure but 0 Changes — treat as incomplete
      return { changes: [], skipped: true, skipReason: ... };
    }
    // Changes are populated despite FAILED status — fall through
  } else if (isRoot) {
    // Root always falls through — classification happens per-nested-stack
  } else {
    // Unknown failure — treat as error, skip this stack
    return { changes: [], skipped: true, skipReason: ... };
  }
}
```

### Change 3: Partial results instead of all-or-nothing

The current code discards all results if _any_ nested stack analysis
is skipped (lines 343-349). Instead, return available results and track
which stacks were incomplete:

```typescript
// Current: discard everything
if (hasNestedSkipped) {
  return { changes: [], skipped: true, skipReason: '...' };
}

// Proposed: return partial results with metadata
result.incompleteStacks = skippedStacks; // stacks with non-EV failures
return result;
```

### Change 4: Filter expected DeletionPolicy drift

The lock step adds `DeletionPolicy: Retain` to stateful resources.
These show up as Modify changes in the changeset. For lock rollback
to determine whether the environment is safe to revert, these expected
changes must be filtered out.

The filter applies after changeset analysis and before the rollback
safety decision:

Two types of expected changes:

1. **Direct DeletionPolicy changes** — `Action: Modify`,
   `Scope: ['DeletionPolicy']`. CFN reports DeletionPolicy as a
   first-class Scope value.

2. **Cascading IAM Policy changes** — When DeletionPolicy changes on
   a DynamoDB table, CFN flags IAM policies referencing `TableName.Arn`
   as Dynamic ResourceAttribute re-evaluations. These have
   `Action: Modify`, `Scope: ['Properties']`,
   `ChangeSource: ResourceAttribute`, `Evaluation: Dynamic`,
   `RequiresRecreation: Never`, and `CausingEntity` matching
   `*Table.Arn` or `*Table.StreamArn`.

```typescript
function isExpectedLockDrift(change: ResourceChangeWithNested): boolean {
  if (change.Action !== 'Modify') return false;

  // Direct DeletionPolicy change
  if (change.Scope?.length === 1 && change.Scope[0] === 'DeletionPolicy') return true;

  // Cascading IAM Policy change from DeletionPolicy on a DDB table
  if (
    change.ResourceType === 'AWS::IAM::Policy' &&
    change.Scope?.length === 1 &&
    change.Scope[0] === 'Properties' &&
    change.Details?.length
  ) {
    return change.Details.every(
      (d) =>
        d.ChangeSource === 'ResourceAttribute' &&
        d.Evaluation === 'Dynamic' &&
        d.Target?.RequiresRecreation === 'Never' &&
        /Table\.(Arn|StreamArn)$/.test(d.CausingEntity ?? ''),
    );
  }

  return false;
}

// Recursive tree walk — CloudFormation::Stack entries are structural
// wrappers; real drift is at the leaf level.
function hasRealDrift(changes: ResourceChangeWithNested[]): boolean {
  for (const change of changes) {
    if (change.nestedChanges?.length) {
      if (hasRealDrift(change.nestedChanges)) return true;
    } else if (change.ResourceType !== 'AWS::CloudFormation::Stack') {
      if (!isExpectedLockDrift(change)) return true;
    }
  }
  return false;
}
```

If `hasRealDrift` returns false after filtering, lock rollback can
proceed safely. If there is any real drift, lock rollback must abort
— the environment is in an inconsistent state.

### What is NOT changed

- `IncludeNestedStacks: true` stays on the `CreateChangeSetCommand`
- The recursive `analyzeChangeSet` traversal via `ChangeSetId` on
  nested `AWS::CloudFormation::Stack` resources stays the same
- The "no changes" detection (`didn't contain changes`) stays the same
- Changeset cleanup logic stays the same

## Risks

### R1 — Reading Changes from FAILED changesets is undocumented

Reading Changes from EarlyValidation-failed changesets is not
explicitly documented by CloudFormation. Confirmed empirically on the
discussions app (3 FAILED stacks, all with accessible Changes), but
could change without notice.

_Mitigation_: Add an integration test against a known FAILED stack to
verify Changes are populated. If CFN changes this behavior, the test
catches it before it silently regresses in production.

### R2 — Changes on EarlyValidation-failed changesets may be incomplete

CFN may populate _some_ changes before the validation failure but not
all. We could miss real drift on a FAILED stack.

_Mitigation_: This is inherent to the EarlyValidation failure, not our
approach. Per-nested-stack with `UsePreviousTemplate: true` hits the
same EarlyValidation failure on the same stacks. The real fix is to
update the Gen1 templates to reflect the post-migration state
(MigrationPlaceholder resources), which is already part of the refactor
step. Once templates are updated, EarlyValidation passes and this risk
disappears.

### R3 — Recoverable failure classification is string-based

The `isRecoverableFailure` function matches `"EarlyValidation"` and
`"Template format error"` in StatusReason strings. If CFN introduces
new failure modes or changes wording, we may either miss recoverable
failures (treating them as hard errors — safe direction) or
incorrectly treat genuine failures as recoverable (reading incomplete
Changes — unsafe direction). The latter risk is mitigated: recoverable
failures with 0 Changes are treated as incomplete, not clean.

_Mitigation_: Log all failure reasons. Expand the pattern match as
new failure types are observed. Empty-Changes guard ensures
false-recoverable classification fails closed.

### R4 — DeletionPolicy filter accuracy

The filter that distinguishes lock's expected DeletionPolicy changes
from real drift must be precise. A false positive (real drift
classified as expected) would allow lock rollback to proceed when the
environment is inconsistent. A false negative (expected drift
classified as real) would block lock rollback unnecessarily.

The filter has two paths: direct DeletionPolicy scope matching (tight)
and cascading IAM Policy matching (broader — checks `ChangeSource`,
`Evaluation`, `RequiresRecreation`, and `CausingEntity` pattern
`*Table.Arn|StreamArn`). The IAM path could theoretically false-positive
if a non-DeletionPolicy change triggers an identical Dynamic
ResourceAttribute re-evaluation pattern on an IAM policy referencing
a resource whose logical ID ends in "Table". In practice this is
extremely unlikely — the pattern only matches during lock rollback when
DeletionPolicy is the only template modification.

_Mitigation_: The `CausingEntity` regex anchors to `Table.Arn` or
`Table.StreamArn`. Scope is required to be exactly `['Properties']`.
All Details must be Dynamic/ResourceAttribute/Never — any static or
direct modification fails the filter. 28 unit tests cover positive
and negative cases.

## Consequences

### What changes

- `detectTemplateDrift` classifies FAILED changesets by failure type
  instead of discarding them all
- EarlyValidation failures are treated as recoverable — Changes are
  read from the FAILED changeset
- Non-EarlyValidation failures remain hard errors (skipped)
- The all-or-nothing behavior on nested analysis failures is replaced
  with partial results
- `TemplateDriftResults` gains optional metadata about incomplete stacks
- A DeletionPolicy filter is added to distinguish lock's expected
  changes from real drift
- Lock rollback consumes filtered results to make the safe/unsafe
  determination

### What does NOT change

- The `CreateChangeSetCommand` call and its parameters
- The recursive traversal of nested changesets via `ChangeSetId`
- The "no changes" detection path
- The drift formatter (console URL format was fixed separately)
- The Phase 1 (CFN drift detection) and Phase 3 (local drift) paths

### What gets removed

- The entire 14570 per-nested-stack prototype (Method B) is abandoned
- No new dependencies (bottleneck, S3 client for template fetching)
- No new S3 template resolution logic
- No new rate limiting infrastructure
