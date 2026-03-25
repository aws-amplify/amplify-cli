# ADR: `gen2-migration assess` Command

## Status

Proposed

## Context

The `gen2-migration` workflow has four steps: `lock`, `generate`,
`refactor`, and `decommission`. Users currently have no way to know
whether their Gen1 project can be migrated before they start. If an
unsupported feature is discovered mid-migration, the user has already
invested time and may need to roll back.

We need a pre-flight command that reads the user's Gen1 project and
reports exactly which features are supported, which require manual
work, and which block migration entirely.

## Decision

Add a new `assess` subcommand to `gen2-migration` that reads the
user's `amplify-meta.json`, evaluates each resource against the
tool's current capabilities, and displays a per-category assessment
with a summary and migration verdict.

## Requirements

### R1 — Read the user's Gen1 project

The command reads `amplify-meta.json` (via `Gen1App`) to discover
every category, resource, and service the user has configured. Only
categories with at least one resource are displayed.

### R2 — Evaluate support per resource

Each resource is evaluated by asking the generate and refactor steps
directly. Each step owns the knowledge of what it supports — the
assessment does not maintain a separate registry or consult
`STATEFUL_RESOURCES`.

Each step exposes a static `assess` method that accepts a
`DiscoveredResource` (and `Gen1App` where needed) and returns a
`SupportResponse`:

```typescript
interface SupportResponse {
  readonly supported: boolean;
  readonly notes: readonly string[];
}
```

- `supported: true`, empty notes → ✔ (fully supported)
- `supported: true`, non-empty notes → ⚠ (supported with gaps)
- `supported: false` → ✘ (not supported)

The refactor step returns `{ supported: true, notes: [] }` for
categories that have no stateful resources to move (e.g. functions).
This is a no-op — the refactor step knows this internally and the
assessment does not need to reason about CloudFormation resource
types.

### R3 — Evaluate sub-feature support

Sub-feature gaps are reported as `notes` in the `SupportResponse`
returned by each step's `assess` method. For example, the generate
step's assess for a Lambda function with `custom-policies.json`
returns `{ supported: true, notes: ['custom-policies not supported'] }`.

A resource with non-empty notes shows ⚠ instead of ✔ in the
relevant operation column. The notes appear as footnotes beneath
the category table.

### R4 — Display per-category tables

Output is grouped by category. Each category renders a table:

```
Auth
┌──────────────────┬─────────┬──────────┬──────────┐
│ Resource         │ Service │ Generate │ Refactor │
├──────────────────┼─────────┼──────────┼──────────┤
│ userPoolGroups   │ Cognito │    ✔     │    ✔     │
└──────────────────┴─────────┴──────────┴──────────┘
```

Categories with no resources in the user's project are omitted.

### R5 — Display sub-feature warnings

When a resource has unsupported sub-features, a footnote appears
below the category table:

```
Function
┌──────────────────┬─────────┬──────────┬──────────┐
│ Resource         │ Service │ Generate │ Refactor │
├──────────────────┼─────────┼──────────┼──────────┤
│ processOrder     │ Lambda  │    ✔     │    ✔     │
│ sendNotification │ Lambda  │    ⚠     │    ✔     │
└──────────────────┴─────────┴──────────┴──────────┘
  ⚠ sendNotification:
    - custom-policies not supported
```

### R6 — Display summary and verdict

After all category tables, a summary reports:

1. How many resources are fully supported vs total.
2. Resources that lack generate support (warning — user can write
   code manually).
3. Resources that lack refactor support (blocker — stateful data
   at risk).
4. Resources with unsupported sub-features (warning — generated
   code will be incomplete).
5. A final verdict: `✔ Migration can proceed.` or
   `✘ Migration blocked.`

### R7 — Blocker condition

Migration is blocked if and only if at least one resource receives
`{ supported: false }` from the refactor step's `assess` method.

Missing generate support is never a blocker. The user can
acknowledge the gap and write Gen2 code manually after the generate
step.

Non-empty notes (sub-feature gaps) are never a blocker. The
generated code will be incomplete but functional.

### R8 — Example output (fully supported)

```
Assessment for "ecommerce-app" (env: prod)

Auth
┌─────────────────────────┬─────────┬──────────┬──────────┐
│ Resource                │ Service │ Generate │ Refactor │
├─────────────────────────┼─────────┼──────────┼──────────┤
│ userPoolGroups          │ Cognito │    ✔     │    ✔     │
└─────────────────────────┴─────────┴──────────┴──────────┘

Storage
┌─────────────────────────┬──────────┬──────────┬──────────┐
│ Resource                │ Service  │ Generate │ Refactor │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ productImages           │ S3       │    ✔     │    ✔     │
│ ordersTable             │ DynamoDB │    ✔     │    ✔     │
└─────────────────────────┴──────────┴──────────┴──────────┘

Function
┌─────────────────────────┬─────────┬──────────┬──────────┐
│ Resource                │ Service │ Generate │ Refactor │
├─────────────────────────┼─────────┼──────────┼──────────┤
│ processOrder            │ Lambda  │    ✔     │    ✔     │
│ sendNotification        │ Lambda  │    ✔     │    ✔     │
└─────────────────────────┴─────────┴──────────┴──────────┘

Summary: 5/5 resources across 3 categories fully supported.

✔ Migration can proceed.
```

### R9 — Example output (requires manual code)

```
Assessment for "ecommerce-app" (env: prod)

Auth
┌─────────────────────────┬─────────┬──────────┬──────────┐
│ Resource                │ Service │ Generate │ Refactor │
├─────────────────────────┼─────────┼──────────┼──────────┤
│ userPoolGroups          │ Cognito │    ✔     │    ✔     │
└─────────────────────────┴─────────┴──────────┴──────────┘

Function
┌─────────────────────────┬─────────┬──────────┬──────────┐
│ Resource                │ Service │ Generate │ Refactor │
├─────────────────────────┼─────────┼──────────┼──────────┤
│ processOrder            │ Lambda  │    ✔     │    ✔     │
│ sendNotification        │ Lambda  │    ⚠     │    ✔     │
└─────────────────────────┴─────────┴──────────┴──────────┘
  ⚠ sendNotification:
    - custom-policies not supported

Notifications
┌─────────────────────────┬──────────┬──────────┬──────────┐
│ Resource                │ Service  │ Generate │ Refactor │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ pushNotifications       │ Pinpoint │    ✘     │    ✔     │
└─────────────────────────┴──────────┴──────────┴──────────┘

Summary: 2/4 resources across 3 categories fully supported.

⚠ 1 resource does not support code generation:
    Notifications/pushNotifications
  You will need to write Gen2 code for this manually
  after the generate step.

⚠ 1 resource has unsupported sub-features:
    Function/sendNotification (custom-policies)
  Generated code will be incomplete. Review and add
  missing configuration manually after the generate step.

✔ Migration can proceed.
```

### R10 — Example output (migration blocked)

```
Assessment for "ecommerce-app" (env: prod)

Auth
┌─────────────────────────┬─────────┬──────────┬──────────┐
│ Resource                │ Service │ Generate │ Refactor │
├─────────────────────────┼─────────┼──────────┼──────────┤
│ userPoolGroups          │ Cognito │    ✔     │    ✔     │
└─────────────────────────┴─────────┴──────────┴──────────┘

Storage
┌─────────────────────────┬──────────┬──────────┬──────────┐
│ Resource                │ Service  │ Generate │ Refactor │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ productImages           │ S3       │    ✔     │    ✔     │
│ ordersTable             │ DynamoDB │    ✔     │    ✔     │
└─────────────────────────┴──────────┴──────────┴──────────┘

Notifications
┌─────────────────────────┬──────────┬──────────┬──────────┐
│ Resource                │ Service  │ Generate │ Refactor │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ pushNotifications       │ Pinpoint │    ✘     │    ✘     │
└─────────────────────────┴──────────┴──────────┴──────────┘

Geo
┌─────────────────────────┬──────────┬──────────┬──────────┐
│ Resource                │ Service  │ Generate │ Refactor │
├─────────────────────────┼──────────┼──────────┼──────────┤
│ storeLocator            │ Location │    ✘     │    ✔     │
└─────────────────────────┴──────────┴──────────┴──────────┘

Summary: 3/5 resources across 4 categories fully supported.

⚠ 2 resources do not support code generation:
    Notifications/pushNotifications, Geo/storeLocator
  You will need to write Gen2 code for these manually
  after the generate step.

✘ 1 resource has stateful data that cannot be refactored:
    Notifications/pushNotifications
  Automatic migration cannot proceed until refactoring
  support is added for this resource. Stateful resources
  require refactoring to avoid data loss.

✘ Migration blocked.
```

## Implementation Plan

### Shared types

```typescript
/** A resource discovered from amplify-meta.json. */
interface DiscoveredResource {
  readonly category: string; // 'auth', 'storage', etc.
  readonly resourceName: string; // 'userPoolGroups', 'myBucket', etc.
  readonly service: string; // 'Cognito', 'S3', 'Lambda', etc.
}

/** Response from a step's assess method. */
interface SupportResponse {
  readonly supported: boolean;
  readonly notes: readonly string[];
}
```

### `Gen1App.discover()`

New method on `Gen1App` that iterates all categories in
`amplify-meta.json` and returns `DiscoveredResource[]`. Pure local
read, no AWS calls. Both the generate and refactor steps use this
as their starting point for resource iteration.

### Step `assess` methods

Both `AmplifyMigrationGenerateStep` and
`AmplifyMigrationRefactorStep` expose a static `assess` method:

```typescript
// Generate step
static assess(
  gen1App: Gen1App,
  resource: DiscoveredResource,
): SupportResponse

// Refactor step
static assess(
  resource: DiscoveredResource,
): SupportResponse
```

Generate's `assess` needs `Gen1App` because sub-feature detection
requires reading local files (e.g., checking if
`custom-policies.json` exists for a function). Refactor's `assess`
is purely a lookup — "do I have a refactorer for this
category/service?" — and returns `{ supported: true }` for
categories with no stateful resources (no-op).

Each step owns its support knowledge entirely. The assessment does
not maintain a separate registry, consult `STATEFUL_RESOURCES`, or
reason about CloudFormation resource types.

### Refactor step: adopt discover-first pattern

The refactor step currently hardcodes three refactorers
(`AuthForwardRefactorer`, `StorageForwardRefactorer`,
`AnalyticsForwardRefactorer`) and instantiates all three
unconditionally. As part of this work, refactor the step to:

1. Call `gen1App.discover()` to get all resources.
2. For each resource, call its own `assess` to check support.
3. Instantiate refactorers only for supported resources.

This aligns the refactor step with the generate step's existing
"discover all, instantiate some" pattern and makes the `assess`
method the single source of truth for both assessment display and
runtime instantiation.

### Generate step: extract discovery

The generate step already follows the discover-first pattern in
its `execute()` method (reads `amplify-meta.json`, dispatches by
service type). Refactor it to use `gen1App.discover()` and its own
`assess` method, so the same logic drives both assessment and
execution.

### Assessment orchestrator

```typescript
class Assessment {
  constructor(private readonly gen1App: Gen1App, private readonly appName: string, private readonly envName: string) {}

  public evaluate(): AssessmentResult {
    const resources = this.gen1App.discover();
    const assessments = resources.map((r) => ({
      ...r,
      generate: AmplifyMigrationGenerateStep.assess(this.gen1App, r),
      refactor: AmplifyMigrationRefactorStep.assess(r),
    }));
    // group by category, derive blockers/warnings
  }
}
```

### `AssessmentResult`

```typescript
interface ResourceAssessment {
  readonly resource: DiscoveredResource;
  readonly generate: SupportResponse;
  readonly refactor: SupportResponse;
}

interface AssessmentResult {
  readonly appName: string;
  readonly envName: string;
  readonly categories: ReadonlyMap<string, readonly ResourceAssessment[]>;
  readonly blocked: boolean;
  readonly blockers: readonly ResourceAssessment[];
  readonly generateWarnings: readonly ResourceAssessment[];
  readonly subFeatureWarnings: readonly ResourceAssessment[];
}
```

### `AssessmentRenderer`

Separate class that takes an `AssessmentResult` and renders the
tables, footnotes, summary, and verdict to the terminal using
`printer` from `@aws-amplify/amplify-prompts`. Keeping rendering
separate from evaluation makes the assessment logic unit-testable
without mocking terminal output.

### Data flow

```
Gen1App.create()
    │
    ├── Gen1App.discover() → DiscoveredResource[]
    │
    ▼
Assessment.evaluate()
    │
    ├── GenerateStep.assess(gen1App, resource) → SupportResponse
    ├── RefactorStep.assess(resource)          → SupportResponse
    │
    ▼
AssessmentResult
    │
    ▼
AssessmentRenderer.render() → terminal output
```

### Not a migration step

`assess` does not follow the `AmplifyMigrationStep` lifecycle
(`validate → execute → rollback`). It is read-only and has no
side effects. It is implemented as a standalone command handler,
not as a step subclass.

### No AWS calls beyond Gen1App

The assessment does not make AWS calls beyond what `Gen1App`
already does (downloading the cloud backend from S3). All
evaluation logic is local.
