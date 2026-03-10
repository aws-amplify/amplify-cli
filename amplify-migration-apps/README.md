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
├── _snapshot.pre.generate/           # Input for `gen2-migration generate` test (Gen1 app state)
├── _snapshot.post.generate/          # Expected output of `gen2-migration generate`
├── _snapshot.pre.refactor/           # Input for `gen2-migration refactor` test (CFN templates)
├── _snapshot.post.refactor/          # Expected output of `gen2-migration refactor`
├── src/                              # Frontend source code (not present in backend-only apps)
├── .gitignore                        # Git ignore rules
├── package.json                      # Standard NodeJS based manifest
├── README.md                         # Deployment and migration instructions
└── ...                               # App-specific source files (schema, configs, etc.)
```

The Gen1 Amplify project structure (the `amplify/` directory) lives inside
`_snapshot.pre.generate/`, not at the top level. The top level only contains
snapshot directories, the app manifest, and any source files needed for
deployment (e.g., `schema.graphql`, `configure.sh`).

> Some apps don't have `_snapshot.post.refactor/` because refactor doesn't work
> for them yet.

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
to move resources from Gen1 stacks to Gen2 stacks. Contains two types of files:

`update.*` files represent `UpdateStack` calls that prepare stacks before or after a refactor:

```
update.<stack-name>.template.json      # Modified template for the stack
update.<stack-name>.parameters.json    # Parameters for the update call
```

Comparing `update.<stack-name>.template.json` against `_snapshot.pre.refactor/<stack-name>.template.json`
shows the changeset applied during the update — what was added, removed, or modified in the template
as part of the refactor resolution.

`refactor.*` files represent `CreateStackRefactor` calls that move resources between stacks:

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

## Sanitization

Sensitive values must be replaced with safe placeholder values before they are committed.
Each app's `package.json` includes a `sanitize` script that invokes the shared `sanitize.ts`
at the root of this directory. This runs automatically on commit via the Husky pre-commit hook,
so you don't need to run it manually. If you do want to run it yourself:

```console
cd amplify-migration-apps/<app-name>
npm run sanitize
```

The script extracts values from `amplify-meta.json` and replaces them across all snapshot files:

| Value            | Placeholder                        |
| ---------------- | ---------------------------------- |
| AWS Account ID   | `123456789012`                     |
| Amplify App ID   | `<app-name-no-dashes>`             |
| AppSync API Key  | `da2-fakeapikey00000000000000`     |

## Typechecking

Each app has a `typecheck` script that runs `tsc --noEmit` against the generated Gen2 code
in `_snapshot.post.generate/amplify/` to verify the snapshot's TypeScript compiles cleanly.

```console
cd amplify-migration-apps/<app-name>
npm run typecheck
```

## Snapshot Capture Tool

The [`snapshot.ts`](./snapshot.ts) script at the root of this directory captures snapshot
directories from a deployed Amplify app. It requires AWS credentials with access to the
deployed app's CloudFormation stacks and Amplify resources.

```console
npx tsx snapshot.ts <step> <app-name> [deployed-app-path]
```

Where `<step>` is one of:

| Step             | Description                                                                 | Requires `deployed-app-path`? |
| ---------------- | --------------------------------------------------------------------------- | ----------------------------- |
| `pre.generate`   | Copies the Gen1 app's `amplify/`, `.gitignore`, and `package.json`          | Yes                           |
| `post.generate`  | Copies the Gen2 output (`amplify/`, `.gitignore`, `amplify.yml`)            | Yes                           |
| `pre.refactor`   | Downloads Gen1 and Gen2 CloudFormation templates from deployed stacks       | No (reads from AWS directly)  |
| `post.refactor`  | Copies the refactor operations from `.amplify/refactor.operations`          | Yes                           |

Examples:

```console
# Capture the Gen1 input state before running generate
npx tsx snapshot.ts pre.generate fitness-tracker /path/to/deployed/fitness-tracker

# Capture the expected generate output
npx tsx snapshot.ts post.generate fitness-tracker /path/to/deployed/fitness-tracker

# Download CloudFormation templates for refactor input (requires AWS credentials)
npx tsx snapshot.ts pre.refactor fitness-tracker

# Capture the expected refactor output
npx tsx snapshot.ts post.refactor fitness-tracker /path/to/deployed/fitness-tracker
```

## Adding an App

1. Create a new directory under `<app-name>` that contains the entire Gen1 application, as is.
2. Add the following script directives to the `package.json` file:

    ```json
    "scripts": {
      "sanitize": "tsx ../sanitize.ts",
      "typecheck": "cd _snapshot.post.generate/amplify && npx tsc --noEmit"
    }
    ```

3. Add the following to the `package.json` file:

    ```json
    "installConfig": {
      "hoistingLimits": "workspaces"
    },       
    ```

    This ensures dependencies in the app don't interfere or conflict with the main repo dependencies.

4. Use the [Snapshot Capture Tool](#snapshot-capture-tool) to capture all required snapshots.
   Follow the app's migration guide, running the tool at each step:

    ```console
    # Before running generate
    npx tsx snapshot.ts pre.generate <app-name> /path/to/deployed/<app-name>

    # After running generate
    npx tsx snapshot.ts post.generate <app-name> /path/to/deployed/<app-name>

    # Before running refactor (requires AWS credentials)
    npx tsx snapshot.ts pre.refactor <app-name>

    # After running refactor
    npx tsx snapshot.ts post.refactor <app-name> /path/to/deployed/<app-name>
    ```

5. Run the sanitize script to replace sensitive values with placeholders:

    ```console
    cd amplify-migration-apps/<app-name>
    npm run sanitize
    ```

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
add a new test to [`command-handlers.test.ts`](../packages/amplify-cli/src/__tests__/commands/gen2-migration/generate/codegen-head/command-handlers.test.ts):

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
add a new test to [`refactor.test.ts`](../packages/amplify-cli/src/__tests__/commands/gen2-migration/refactor/refactor.test.ts):

```typescript
test('<app-name> snapshot', async () => {
  await testSnapshot('<app-name>');
});
```

### Running the Snapshot Tests

```console
cd packages/amplify-cli
npx jest --no-coverage src/__tests__/commands/gen2-migration/generate/codegen-head/command-handlers.test.ts -t '<app-name> snapshot'
npx jest --no-coverage src/__tests__/commands/gen2-migration/refactor/refactor.test.ts -t '<app-name> snapshot'
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
npx jest --no-coverage src/__tests__/commands/gen2-migration/generate/codegen-head/command-handlers.test.ts --updateSnapshot
```

This updates all snapshots. You can also target a specific app:

```console
npx jest --no-coverage src/__tests__/commands/gen2-migration/generate/codegen-head/command-handlers.test.ts \
  -t '<app-name> snapshot' --updateSnapshot
```

Always review the diff after updating to make sure the changes are intentional.
