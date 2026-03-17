# ADR-004: Unified Validation Model for gen2-migration

## Status

Proposed

## Context

The gen2-migration tool currently has three separate validation mechanisms:

1. **Step-level validations** (`executeValidate`/`rollbackValidate` on `AmplifyMigrationStep`).
   These run before planning and are skippable via `--skip-validations`. They check
   environment preconditions like drift, lock status, deployment status, and working
   directory cleanliness. They throw on failure; the orchestrator catches the throw and
   re-throws with a hint to use `--skip-validations`.

2. **Operation-level validations** (`validate()` on `AmplifyMigrationOperation`).
   These run after planning, before execution. They are not skippable. Today most
   implementations are no-ops (`async () => { return; }`).

3. **Implicit planning-time validations** (throws inside `CategoryRefactorer.plan()`).
   For example, `plan()` throws `InvalidStackError` if only one of source/target stack
   IDs is found. These crash the program on the first category that exhibits the problem,
   preventing the user from seeing issues in other categories.

### Problems

- **Three mechanisms for one concept.** Validation is validation regardless of when it
  runs. Having three separate paths makes the system harder to reason about and extend.

- **Planning-time throws are not aggregatable.** When `CategoryRefactorer.plan()` throws
  on the first bad category, the user has to fix it, re-run, discover the next problem,
  fix it, re-run, etc. The tool should report all problems upfront.

## Requirements

### R1 — Single validation mechanism

All validations — environment preconditions, planning-time checks, and pre-execution
checks — flow through one mechanism.

### R2 — Aggregate reporting

When multiple validations fail, the user sees all failures at once, not just the first
one.

### R3 — Validations are skippable via `--skip-validations`

All operation-level validations are skippable. Conditions that cannot be skipped are
planning errors, not validations.

### R4 — Validations run before any mutation

No `execute()` runs until all validations across all operations have been evaluated.

### R5 — Planning errors are aggregated

When a step plans multiple categories and some fail, the user sees all planning
failures at once. `plan()` throws for conditions it cannot recover from, but the
step catches and aggregates these across all planners before surfacing them.

## Decision

Two changes:

1. **Operation-level validation becomes the single validation mechanism.** [R1]
   `validate()` on `AmplifyMigrationOperation` returns a `ValidationResult` instead
   of throwing. Step-level validations (`executeValidate`/`rollbackValidate`) are
   removed; those checks become operations in the operations list. A new `Plan`
   object encapsulates the operations array and exposes `describe()`, `validate()`,
   and `execute()` to the orchestrator.

2. **Planning errors are aggregated by the step.** [R5]
   `plan()` throws a typed `Gen2MigrationPlanningError` for conditions it cannot
   plan around. The step catches these across all planners and throws a single
   aggregated error. This is separate from the operation validation mechanism —
   if you can't plan, there's nothing to validate or execute.

### User-facing flow

```
Planning... done

Validating...

Lock status                                              ✔ Passed
Deployment status                                        ✔ Passed
Drift detection                                          ✔ Passed

Operations Summary

  • Update source stack 'auth-abc123' with resolved references
  • Move Gen2 resources to holding stack 'auth-abc123-holding'
  • Refactor resources from Gen1 to Gen2

Implications

  • Move stateful resources from your Gen1 app to be managed by your Gen2 app

(You can rollback this command by running: 'amplify gen2-migration refactor --rollback')

Do you want to continue? (y/n)
```

When planning fails, the user sees the aggregated errors and the process stops:

```
Planning...
  ✘ auth: Category exists in source but not destination stack
  ✘ storage: Category exists in source but not destination stack

Planning failed. Resolve the errors above before proceeding.
```

When validations fail, each validation gets its own section with a name (bold in
the terminal), a status, and an optional report indented below:

```
Validating...

Lock status                                              ✔ Passed
Deployment status                                        ✔ Passed
Drift detection                                          ✘ Failed

  Resource              Property           Expected        Actual
  ─────────────────────────────────────────────────────────────────
  UserPool              MfaConfiguration   OFF             ON
  UserPoolClient        ExplicitAuthFlows  ALLOW_REFRESH   ALLOW_USER_SRP
  S3Bucket              VersioningConfig   Enabled         Suspended

Validations failed. Resolve the errors above or re-run with '--skip-validations'.
```

### `Plan`

Steps currently return `AmplifyMigrationOperation[]` from `execute()`/`rollback()`.
Instead they return a `Plan` that encapsulates the operations array:

```typescript
class Plan {
  constructor(private readonly operations: AmplifyMigrationOperation[]) {}

  /** Descriptions of what the operations will do. */
  async describe(): Promise<string[]> {
    const descriptions: string[] = [];
    for (const op of this.operations) {
      descriptions.push(...(await op.describe()));
    }
    return descriptions;
  }

  /** Runs all validations, returns all results. */
  async validate(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    for (const op of this.operations) {
      results.push(await op.validate());
    }
    return results;
  }

  /** Executes all operations sequentially. */
  async execute(): Promise<void> {
    for (const op of this.operations) {
      await op.execute();
    }
  }
}
```

The orchestrator interacts only with `Plan` — individual operations are an internal
detail. The orchestrator flow becomes:

```typescript
const plan = rollingBack ? await step.rollback() : await step.execute();

// Operations summary
for (const line of await plan.describe()) {
  printer.info(`• ${line}`);
}

// Implications + confirmation prompt (unchanged)
// ...

// Validate [R1, R2, R4]
const results = await plan.validate();
renderValidationResults(results);

const failures = results.filter((r) => !r.valid);
if (failures.length > 0 && !skipValidations) {
  throw new AmplifyError('MigrationError', {
    message: failures.map((r) => r.name).join(', ') + ' failed',
    resolution: `Resolve the errors or re-run with '--skip-validations'`,
  });
}

// Execute
await plan.execute();
```

What gets removed from the orchestrator:

- The `validate()` helper function (step-level validation wrapper)
- `executeValidate()` and `rollbackValidate()` on `AmplifyMigrationStep`
- `CachedAmplifyMigrationStep`
- `runOperations()` (replaced by `plan.validate()` + `plan.execute()`)

### `ValidationResult`

```typescript
interface ValidationResult {
  /** Label shown on the status line (e.g., "Lock status", "Drift detection"). */
  readonly name: string;
  /** Whether the validation passed. */
  readonly valid: boolean;
  /** Optional detailed output shown indented below the status line. */
  readonly report?: string;
}
```

`validate()` on `AmplifyMigrationOperation` changes from `Promise<void>` to
`Promise<ValidationResult>`.

### Step-level validations become operations

Validations that currently live in `executeValidate()`/`rollbackValidate()` (drift
detection, lock status, deployment status, working directory cleanliness) become
operations in the `Plan`. Their `execute()` is a no-op — the validation is the
entire point.

### Planning error aggregation

`plan()` throws a typed `Gen2MigrationPlanningError` when it cannot formulate a
plan. This is the right semantic — if you can't gather enough information to plan,
throwing is the honest response.

The step that orchestrates multiple planners (e.g., `AmplifyMigrationRefactorStep`)
catches these errors, continues planning remaining categories, and throws a single
aggregated error after all planners have been attempted:

```typescript
private async plan(
  refactorers: Refactorer[],
): Promise<Plan> {
  const operations: AmplifyMigrationOperation[] = [];
  const planningErrors: Gen2MigrationPlanningError[] = [];

  for (const refactorer of refactorers) {
    try {
      operations.push(...(await refactorer.plan()));
    } catch (error) {
      if (error instanceof Gen2MigrationPlanningError) {
        planningErrors.push(error);
      } else {
        throw error; // unexpected error — propagate immediately
      }
    }
  }

  if (planningErrors.length > 0) {
    throw new AmplifyError('MigrationError', {
      message: planningErrors.map((e) => e.message).join('\n'),
    });
  }

  return new Plan(operations);
}
```

Unexpected errors (network failures, SDK errors) are not
`Gen2MigrationPlanningError` and propagate immediately — they indicate something
is broken, not a validatable condition.

## Consequences

### What changes

- `AmplifyMigrationOperation.validate()` returns `Promise<ValidationResult>` instead
  of `Promise<void>`.
- Steps return `Plan` instead of `AmplifyMigrationOperation[]`.
- `AmplifyMigrationStep.executeValidate()` and `rollbackValidate()` are removed.
- The `validate()` function in `gen2-migration.ts` is removed.
- `runOperations()` is removed (replaced by `plan.validate()` + `plan.execute()`).
- `--validations-only` is trivially supported: call `plan.validate()` and stop.
- `CachedAmplifyMigrationStep` is removed.
- `CategoryRefactorer.plan()` throws `Gen2MigrationPlanningError` for precondition
  failures. The step catches and aggregates these across all planners.
- Step implementations (lock, generate, refactor, decommission) move their
  precondition checks into operations in the `Plan`.
- `--skip-validations` skips all validation failures. Conditions that must not be
  skipped are modeled as planning errors, not validations.

### What stays the same

- The `AmplifyMigrationOperation` interface keeps its three methods (`describe`,
  `validate`, `execute`), but is now an internal detail behind `Plan`.
- The `Planner` interface is unchanged.
- The two-pass structure (validate all, then execute all) is preserved inside `Plan`.
- `--skip-validations` flag semantics are preserved for the user, but the mechanism
  is simpler: all validations are skippable, non-skippable conditions are planning
  errors.

### Migration path

Since this code hasn't been published yet, this is a breaking change to internal
interfaces only. All step implementations and their tests need to be updated in a
single pass.
