# assess

The assess subcommand evaluates migration readiness for a Gen1 application. It reads the user's `amplify-meta.json`, queries the generate and refactor steps for each discovered resource, and renders a flat table showing support status per resource.

Unlike other gen2-migration subcommands, assess does not follow the `AmplifyMigrationStep` lifecycle (`validate → execute → rollback`). It is read-only and has no side effects.

## Key Responsibilities

- Discovers all resources from `amplify-meta.json` via `Gen1App.discover()`
- Creates an `Assessment` collector and passes it to the generate and refactor steps' `assess()` methods
- Each step iterates the discovered resources and records support via `assessment.record()`
- Renders a single flat table with Category, Resource, Service, Generate, and Refactor columns
- Displays a verdict: `✔ Migration can proceed.` or `✘ Migration blocked.`

## Architecture

The assess command is handled as a special case in the gen2-migration dispatcher, intercepted after the shared config extraction but before the step lifecycle:

```mermaid
flowchart TD
    CLI["amplify gen2-migration assess"] --> DISPATCH["Dispatcher extracts appId, envName, etc."]
    DISPATCH --> ASSESSOR["AmplifyMigrationAssessor"]
    ASSESSOR --> ASSESSMENT["Assessment collector"]
    ASSESSOR --> GEN["GenerateStep.assess(assessment)"]
    ASSESSOR --> REF["RefactorStep.assess(assessment)"]
    GEN -->|"record per resource"| ASSESSMENT
    REF -->|"record per resource"| ASSESSMENT
    ASSESSMENT --> DISPLAY["assessment.display()"]
    DISPLAY --> TABLE["Flat table + verdict"]
```

### `AmplifyMigrationAssessor`

[`src/commands/gen2-migration/assess.ts`](../../../../packages/amplify-cli/src/commands/gen2-migration/assess.ts)

Standalone class (not a step) that orchestrates the assessment. Creates generate and refactor step instances, calls `assess()` on each, then renders the result.

### `Assessment`

[`src/commands/gen2-migration/_assessment.ts`](../../../../packages/amplify-cli/src/commands/gen2-migration/_assessment.ts)

Collector that steps contribute to during `assess()`. Each step calls `record('generate' | 'refactor', resource, response)` for every discovered resource. The `display()` method produces the terminal output.

### `SupportResponse`

```typescript
interface SupportResponse {
  readonly supported: boolean;
  readonly notes: readonly string[];
}
```

- `supported: true`, empty notes → `✔`
- `supported: true`, non-empty notes → `⚠` with notes
- `supported: false` → `✘` with status label

### `DiscoveredResource`

```typescript
interface DiscoveredResource {
  readonly category: string;
  readonly resourceName: string;
  readonly service: string;
  readonly key: ResourceKey;
}
```

Produced by `Gen1App.discover()`, which iterates all categories in `amplify-meta.json` and extracts `(category, resourceName, service, key)` tuples. The `key` is a typed `category:service` pair from `SUPPORTED_RESOURCE_KEYS`, or `'unsupported'` for pairs the tool has no migration logic for. Skips internal categories (`providers`, `hosting`). Throws `AmplifyError` if a resource in a non-skipped category is missing the `service` field.

## Blocker Condition

Migration is blocked if any resource has `refactor.supported === false`. Missing generate support is not a blocker — the user can write Gen2 code manually.

## Supported Resources

The same switch cases in each step's `assess()` and `execute()` methods define what's supported:

| Category  | Service                 | Generate | Refactor  |
| --------- | ----------------------- | -------- | --------- |
| auth      | Cognito                 | ✔        | ✔         |
| auth      | Cognito-UserPool-Groups | ✔        | ✘         |
| storage   | S3                      | ✔        | ✔         |
| storage   | DynamoDB                | ✔        | ✔         |
| api       | AppSync                 | ✔        | ✔ (no-op) |
| api       | API Gateway             | ✔        | ✔ (no-op) |
| analytics | Kinesis                 | ✔        | ✔         |
| function  | Lambda                  | ✔        | ✔ (no-op) |

Any other `(category, service)` pair gets `ResourceKey = 'unsupported'` and is marked unsupported for both steps.

## ResourceKey and Exhaustive Switches

`SUPPORTED_RESOURCE_KEYS` is a const array of all `category:service` pairs the tool supports. `ResourceKey` is the union of those pairs plus `'unsupported'`. Every switch on `resource.key` in the generate and refactor steps must handle all members — the ESLint `switch-exhaustiveness-check` rule enforces this at compile time. Adding a new pair to `SUPPORTED_RESOURCE_KEYS` forces every consumer to handle it.

## AI Development Notes

- The assess command reuses the same config extraction as other steps (appId, envName, stackName, region, logger) — no duplication.
- Adding support for a new resource type requires adding the pair to `SUPPORTED_RESOURCE_KEYS` in `gen1-app.ts`, then handling the new case in both `assess()` and `execute()` in the relevant step. The compiler enforces exhaustiveness.
- The `Assessment` class owns rendering — it produces a flat table with dynamic column widths and status text baked into the Generate/Refactor cells.
- `Gen1App.discover()` skips internal categories (`providers`, `hosting`) and throws on resources missing a `service` field.
