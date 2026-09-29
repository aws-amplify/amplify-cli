# Amplify Migration Apps

This directory contains example Amplify Gen1 applications used to test the Gen2 migration tooling.
Each app represents a Gen1 project with different combinations of Amplify categories
(auth, api, function, storage, ...) and configurations. The migration tooling (`amplify gen2-migration`)
transforms these Gen1 projects into Gen2 code, and we use snapshot tests to verify the output is correct.

## Migration Process

Follow `README.md` in each individual app for configuration, deployment, and migration instructions.

## Disclaimer

- Not all apps currently support migration end-to-end.
- These apps do not necessarily exhibit (nor intend to) Amplify or AWS best practices.
  They were designed solely for the purpose of testing migration scenarios and covering as
  many features as possible.

## App Structure

Each app directory follows this layout:

```
<app-name>/
├── backend/                          # Backend assets (schema, function code, configure.sh)
├── migration/
│   ├── config.json                   # E2E system configuration (optional)
│   ├── post-generate.ts              # Fixups after gen2-migration generate
│   ├── post-push.ts                  # Fixups after amplify push (optional)
│   ├── post-refactor.ts              # Fixups after gen2-migration refactor
│   └── post-rollback.ts             # Reverses post-refactor fixups after rollback (optional)
├── tests/                            # Jest test suites for validating deployed stacks
│   ├── signup.ts                     # Cognito user provisioning (app-specific)
│   ├── jest.setup.ts                 # Jest setup (retry config)
│   ├── api.test.ts                   # GraphQL / REST API tests
│   ├── storage.test.ts               # S3 / DynamoDB storage tests
│   └── ...                           # Additional category-specific test files
├── jest.config.js                    # Jest configuration
├── _snapshot.pre.generate/           # Input for `gen2-migration generate` test (Gen1 app state)
├── _snapshot.post.generate/          # Expected output of `gen2-migration generate`
├── _snapshot.pre.refactor/           # Input for `gen2-migration refactor` test (CFN templates)
├── _snapshot.post.refactor/          # Expected output of `gen2-migration refactor`
├── src/                              # Frontend source code (not present in backend-only apps)
├── .gitignore                        # Git ignore rules
├── package.json                      # Standard NodeJS based manifest
├── README.md                         # Deployment and migration instructions
└── ...                               # App-specific source files
```

The Gen1 Amplify project structure (the `amplify/` directory) lives inside
`_snapshot.pre.generate/`, not at the top level. The top level only contains
snapshot directories, the app manifest, and source files needed for deployment.

### `backend/`

Contains the backend source assets for the app: the GraphQL schema, Lambda function code,
and a `configure.sh` script that copies them into the Gen1 `amplify/` directory structure.
The configure script uses `$BASH_SOURCE`-relative paths so it works regardless of the
caller's working directory.

### `migration/`

Contains E2E configuration and lifecycle hook scripts for the app.

**`config.json`** — read by the [E2E system](../packages/amplify-e2e-gen2-migration/) at runtime. Each key corresponds to a migration step and accepts a `StepConfig` object:

```json
{
  "lockForward": { "skipValidations": true },
  "lockRollback": { "skipValidations": false },
  "refactorForward": { "skip": true },
  "refactorRollback": { "skipValidations": true },
  "generate": { "skipValidations": true }
}
```

| Field              | Type         | Description                                                  |
| ------------------ | ------------ | ------------------------------------------------------------ |
| `lockForward`      | `StepConfig` | Config for `gen2-migration lock`.                            |
| `lockRollback`     | `StepConfig` | Config for `gen2-migration lock --rollback`.                 |
| `refactorForward`  | `StepConfig` | Config for `gen2-migration refactor`.                        |
| `refactorRollback` | `StepConfig` | Config for `gen2-migration refactor --rollback`.             |
| `generate`         | `StepConfig` | Config for `gen2-migration generate`.                        |

`StepConfig` fields:

| Field             | Type      | Description                            |
| ----------------- | --------- | -------------------------------------- |
| `skipValidations` | `boolean` | Pass `--skip-validations` to the step. |
| `skip`            | `boolean` | Skip the step entirely.                |

If the file does not exist, defaults are used (no skips, no skip-validations).

**Hook npm scripts** — every app's `package.json` must define these 7 scripts. The E2E invokes them by name (`npm run <hook>`) at lifecycle points; the script's implementation is up to the app. Use `"true"` to no-op, or `"npx tsx migration/<hook>.ts"` to run a TypeScript hook file under `migration/`. Hook TS files accept `appPath` as a CLI argument.

- `pre-push` — before `amplify push` (after init + configure)
- `post-push` — after `amplify push`
- `post-generate` — after `gen2-migration generate` + `npm install`
- `pre-sandbox` — before `npx ampx sandbox --once`
- `post-sandbox` — after the first Gen2 sandbox deploy
- `post-refactor` — after `gen2-migration refactor`
- `post-rollback` — after `gen2-migration refactor --rollback` (reverses `post-refactor` fixups)

**Test npm scripts** — defined in the app's `package.json`, invoked by the E2E at validation points:

- `test:gen1` — Jest tests against the Gen1 config
- `test:gen2` — Jest tests against the Gen2 config
- `test:shared` — Jest tests validating stateful resources are shared between Gen1 and Gen2

Set any script to `"true"` in `package.json` to no-op.

### `_snapshot.pre.generate/`

A copy of the Gen1 app as it exists before running `gen2-migration generate`. This is the
test input — the framework copies it to a temp directory and runs the migration against it.

```
_snapshot.pre.generate/
├── amplify/                           # Full Gen1 Amplify project
│   ├── #current-cloud-backend/        # Last-deployed state (CFN templates, amplify-meta.json)
│   ├── backend/                       # Local backend definitions (auth, api, function, storage)
│   ├── team-provider-info.json        # Per-environment configuration
│   └── cli.json                       # CLI configuration
├── .gitignore
└── package.json
```

The `#current-cloud-backend/` directory is particularly important — it contains `amplify-meta.json`
(the central registry of all deployed resources) and the CloudFormation templates that the mock
clients use to derive realistic AWS SDK responses.

### `_snapshot.post.generate/`

The expected output of `gen2-migration generate`. This is what the Gen2 project should look like
after the migration codegen runs.

```
_snapshot.post.generate/
├── amplify/                           # Gen2 TypeScript backend definition
│   ├── auth/                          # Auth resource definitions
│   ├── data/                          # Data/API resource definitions
│   ├── function/                      # Lambda function definitions
│   ├── backend.ts                     # Main backend entry point
│   ├── package.json                   # Amplify backend dependencies
│   └── tsconfig.json                  # TypeScript configuration
├── .gitignore                         # Updated .gitignore for Gen2
├── amplify.yml                        # Build spec (only for hosted apps)
└── package.json                       # Updated project dependencies
```

### `_snapshot.pre.refactor/`

CloudFormation templates, outputs, parameters, and descriptions downloaded from both the Gen1
and Gen2 deployed stacks. The refactor command uses these to plan how to move resources between
stacks. All files are flat (no subdirectories), with four files per stack:

```
_snapshot.pre.refactor/
├── <gen1-root-stack>.template.json
├── <gen1-root-stack>.outputs.json
├── <gen1-root-stack>.parameters.json
├── <gen1-root-stack>.description.txt
├── <gen1-nested-stack>.template.json   # One set per nested stack (auth, api, function, storage, ...)
├── ...
├── <gen2-root-stack>.template.json
├── <gen2-nested-stack>.template.json   # One set per nested stack (auth, data, function, storage, ...)
└── ...
```

Stack names follow Amplify naming conventions:
- Gen1: `amplify-<appname>-<env>-<hash>-<category><resource>-<cfnid>`
- Gen2: `amplify-<appid>-<branch>-branch-<hash>-<category><cfnid>-<cfnid>`

### `_snapshot.post.refactor/`

The expected refactor operations — the CloudFormation API calls the migration tool would make
to move resources from Gen1 stacks to Gen2 stacks. Files use hashed filenames (10-char hex)
to avoid Windows MAX_PATH limits. A `filename-mapping.json` maps each hash to its logical name.

```
_snapshot.post.refactor/
├── filename-mapping.json               # Maps hashed filenames → logical names
├── 809e6c5310.json                     # e.g. update.<gen1-auth-stack>.template.json
├── 3b1a56c1ce.json                     # e.g. update.<gen1-auth-stack>.parameters.json
├── ...
```

The `filename-mapping.json` values follow two naming conventions:

**`update.*`** — `UpdateStack` calls that prepare stacks before a refactor:

```
update.<stack-name>.template.json      # Modified template for the stack
update.<stack-name>.parameters.json    # Parameters for the update call
```

Comparing `update.<stack-name>.template.json` against `_snapshot.pre.refactor/<stack-name>.template.json`
shows the changeset applied during the update — what was added, removed, or modified in the template
as part of the refactor resolution.

**`refactor.*`** — `CreateStackRefactor` calls that move resources between stacks:

```
refactor.__from__.<source-stack>.__to__.<target-stack>.source.template.json
refactor.__from__.<source-stack>.__to__.<target-stack>.target.template.json
refactor.__from__.<source-stack>.__to__.<target-stack>.mappings.json
```

The source and target stack names in the file name correspond to stacks in `_snapshot.pre.refactor/`.
For example, a file named `refactor.__from__.<gen1-auth-stack>.__to__.<gen2-auth-stack>.mappings.json`
describes moving auth resources from the Gen1 auth nested stack to the Gen2 auth nested stack.

- `source.template.json` — the modified Gen1 stack template with the migrated resources removed.
  Compare this against the original template in `_snapshot.pre.refactor/<gen1-stack>.template.json`
  to see exactly which resources are being extracted.
- `target.template.json` — the modified Gen2 stack template with the migrated resources added.
  Compare this against `_snapshot.pre.refactor/<gen2-stack>.template.json` to see what was injected.
- `mappings.json` — an array of `{ Source, Destination }` entries that map each logical resource ID
  in the source stack to its new logical resource ID in the target stack. This is what CloudFormation
  uses to transfer the physical resources without recreating them.

Some refactors target a `-holding` stack (visible in the target stack name). Resources are first
moved from the Gen2 stack to the holding stack (to make room), then from the Gen1 stack to the
Gen2 stack. The holding stack persists as the final destination for the Gen2 stateful resources.

## Normalization and Sanitization

After snapshots are captured, they must be normalized and sanitized before committing.
See the [E2E system README](../packages/amplify-e2e-gen2-migration/README.md#snapshot-post-processing)
for details on what each step does.

To run them manually on a single app:

```console
cd amplify-migration-apps/<app-name>
npx tsx ../normalize.ts
npx tsx ../sanitize.ts
```

Order matters — normalize first, then sanitize.

## Snapshot Capture Tool

The [`snapshot.ts`](./snapshot.ts) script at the root of this directory captures snapshot
directories from a deployed Amplify app. It requires AWS credentials with access to the
deployed app's CloudFormation stacks and Amplify resources.

```console
npx tsx snapshot.ts <step> <app-dir> [deployed-app-path] [gen2-stack-name]
```

Where `<step>` is one of:

| Step             | Description                                                                 | Required args                          |
| ---------------- | --------------------------------------------------------------------------- | -------------------------------------- |
| `pre.generate`   | Copies the Gen1 app's `amplify/`, `.gitignore`, and `package.json`          | `deployed-app-path`                    |
| `post.generate`  | Copies the Gen2 output (`amplify/`, `.gitignore`, `amplify.yml`)            | `deployed-app-path`                    |
| `pre.refactor`   | Downloads Gen1 and Gen2 CloudFormation templates from deployed stacks       | `gen2-stack-name`                      |
| `post.refactor`  | Copies the refactor operations from `.amplify/gen2-migration/refactor.operations` | `deployed-app-path`                    |

Examples:

```console
# Capture the Gen1 input state before running generate
npx tsx snapshot.ts pre.generate fitness-tracker /path/to/deployed/fitness-tracker

# Capture the expected generate output
npx tsx snapshot.ts post.generate fitness-tracker /path/to/deployed/fitness-tracker

# Download CloudFormation templates for refactor input (requires AWS credentials)
npx tsx snapshot.ts pre.refactor fitness-tracker /path/to/deployed/fitness-tracker amplify-fitnesstracker-gen2main-branch-abc1234567

# Capture the expected refactor output
npx tsx snapshot.ts post.refactor fitness-tracker /path/to/deployed/fitness-tracker
```

## Adding an App

1. Create a new directory under `<app-name>` that contains the frontend code for your Gen1 application. 
Make sure to follow the existing patterns and add tests as well.
2. Run `amplify init`.
3. Configure the backend using Gen1 CLI.
4. Run `amplify push`.
5. Add validation tests under `<app-name>/tests/` that exercise the new app's capabilities
   (API queries, auth flows, storage operations, etc.). Follow the patterns in existing apps
   like `project-boards/tests/` or `fitness-tracker/tests/`.
6. Use the [Snapshot Capture Tool](#snapshot-capture-tool) to capture the `pre.generate` snapshot.

    ```console
    npx tsx snapshot.ts pre.generate <app-name>

7. Run `UPDATE_SNAPSHOTS=1 npm run test:e2e` to execute the full migration flow and capture
   the remaining snapshots (`post.generate`, `pre.refactor`, `post.refactor`). The E2E may
   fail if the new app exercises a bug in the migration tooling. In that case the snapshots
   will not be updated — fix the bug first, then re-run.

## Modifying an App

1. `cd` into a specific app and run `npm run deploy`.
2. Locate the deployed app directory in output logs and `cd` into it.
3. Update the backend using Gen1 CLI.
4. Run `amplify push`.
5. Add or update validation tests under `<app-name>/tests/` to cover the modified
   capabilities. Follow the patterns in existing apps like `project-boards/tests/`.
6. Use the [Snapshot Capture Tool](#snapshot-capture-tool) to capture the `pre.generate` snapshot.

    ```console
    npx tsx snapshot.ts pre.generate <app-name>

7. Run `UPDATE_SNAPSHOTS=1 npm run test:e2e` to execute the full migration flow and capture
   the remaining snapshots (`post.generate`, `pre.refactor`, `post.refactor`). The E2E may
   fail if the app change exercises a bug in the migration tooling. In that case the
   snapshots will not be updated — fix the bug first, then re-run.

## Snapshot Testing

Each migration app should have two corresponding snapshot tests that verify the expected output of our two main commands:

- `gen2-migration generate`
- `gen2-migration refactor`

These tests are the primary safety net for catching regressions in the migration tool.

### How It Works

Each snapshot test:

1. Copies the app's input files to a temporary directory.
2. Runs the migration command against the app.
3. Compares the output against the expected files.
4. Fails if there are any differences.

The test [framework](../packages/amplify-cli/src/__tests__/commands/gen2-migration/_framework/)
handles environment setup, mock SDK clients, and snapshot comparison automatically.
It reads the app's `amplify-meta.json`, `team-provider-info.json`, and CloudFormation templates
to derive realistic mock responses for AWS SDK calls (e.g., Cognito, Lambda, S3). This means
the mocks are generic and driven by each app's actual configuration — no real AWS credentials
are needed, and adding a new app automatically gets correct mocks without extra setup.

### Adding a Snapshot Test | `generate`

To add a snapshot test that validates the `gen2-migration generate` command for a new app,
add a new test to [`generate.test.ts`](../packages/amplify-cli/src/__tests__/commands/gen2-migration/generate.test.ts):

```typescript
// For apps WITH Amplify Hosting:
test('<app-name> snapshot', async () => {
  await testSnapshot('<app-name>', { buildSpec: BUILDSPEC });
});

// For backend-only apps (no hosting):
test('<app-name> snapshot', async () => {
  await testSnapshot('<app-name>');
});
```

### Adding a Snapshot Test | `refactor`

To add a snapshot test that validates the `gen2-migration refactor` command for a new app,
add a new test to [`refactor.test.ts`](../packages/amplify-cli/src/__tests__/commands/gen2-migration/refactor.test.ts):

```typescript
test('<app-name> snapshot', async () => {
  await testSnapshot('<app-name>');
});
```

### Running the Snapshot Tests

```console
cd packages/amplify-cli
npx jest --no-coverage src/__tests__/commands/gen2-migration/generate.test.ts -t '<app-name> snapshot'
npx jest --no-coverage src/__tests__/commands/gen2-migration/refactor.test.ts -t '<app-name> snapshot'
```

The tests should pass with no differences. They could fail for two reasons:

1. Our [mock clients](../packages/amplify-cli/src/__tests__/commands/gen2-migration/_framework/README.md#mock-clients) don't handle the configuration of this specific app.
2. The test is so particular that it needs specific [customization](../packages/amplify-cli/src/__tests__/commands/gen2-migration/_framework/README.md#customizing-an-app-within-a-test).

Follow the links above to make the necessary changes for the tests to pass.

### Updating an Existing Snapshot

When the migration tool code changes and you need to update expected snapshots:

> [!TIP]
> When you're implementing a new feature, manually update the expected 
> state and ask Kiro to implement the necessary code changes.

```console
cd packages/amplify-cli
npx jest --no-coverage src/__tests__/commands/gen2-migration/generate.test.ts --updateSnapshot
```

This updates all snapshots. You can also target a specific app:

```console
npx jest --no-coverage src/__tests__/commands/gen2-migration/generate.test.ts -t '<app-name> snapshot' --updateSnapshot
```

Always review the diff after updating to make sure the changes are intentional.

> [!NOTE]
> When updating snapshots, the first run with `--updateSnapshot` will still report a failure
> because it detects the diff before writing the updated files. Run the tests a second time
> (without `--updateSnapshot`) to verify the snapshots are now correct.

### Full Snapshot Update Workflow

When you run the E2E with `UPDATE_SNAPSHOTS=1`, it updates the app's `_snapshot.*` directories
on disk. However, the unit tests in `packages/amplify-cli` also compare against those same
snapshot files. You must update both to stay in sync:

```console
# 1. Run E2E to capture new snapshots from a real deployment
cd amplify-migration-apps/<app-name>
UPDATE_SNAPSHOTS=1 npm run test:e2e

# 2. Update unit test snapshots to match
cd packages/amplify-cli
npx jest --no-coverage src/__tests__/commands/gen2-migration/generate.test.ts --updateSnapshot
npx jest --no-coverage src/__tests__/commands/gen2-migration/refactor.test.ts --updateSnapshot
```

If you skip step 2, the unit tests will fail because they produce slightly different output than the actual E2E run (mock SDK responses vs real AWS responses).

## Integration Testing (E2E)

The [E2E system](../packages/amplify-e2e-gen2-migration/) automates the full migration
workflow for a single app: Gen1 deploy, migration, Gen2 deploy, and validation at each stage.
It deploys real AWS resources, so you need valid credentials.

```bash
# Build the Amplify CLI (if using the development binary)
cd packages/amplify-cli && yarn build

# Optionally point to your dev CLI (falls back to monorepo build, then global install)
export AMPLIFY_PATH=$(pwd)/.bin/amplify-dev

# Run the full migration for a specific app
cd amplify-migration-apps/<app-name>
npm run test:e2e
```

The system automatically runs npm scripts from the app's `package.json` at the right
points in the workflow. See the [E2E system README](../packages/amplify-e2e-gen2-migration/README.md) for
more details.

## Teardown

If an E2E run fails or you need to manually clean up deployed resources, use the
[`teardown.ts`](./teardown.ts) script. It discovers all CloudFormation stacks matching
the deployment name, reverses deletion protection (DeletionPolicy, DynamoDB
DeletionProtectionEnabled, Cognito DeletionProtection), and deletes all stacks, S3
bucket contents, and the Amplify console app.

```console
cd amplify-migration-apps
npx tsx teardown.ts <deploymentName> <profile>
```

The `deploymentName` is the time-based name assigned during the E2E run (look for
`Deployment name:` in the E2E output). The `profile` is the AWS CLI profile with
credentials for the account where the app was deployed.

