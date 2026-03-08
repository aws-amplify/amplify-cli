# Migration Test Framework

This framework provides the infrastructure for snapshot-testing the `gen2-migration generate`
and `gen2-migration refactor` commands against real Amplify Gen1 app configurations. It handles
environment setup, AWS SDK mocking, and snapshot comparison so that individual test cases remain concise.

For instructions on adding new snapshot tests, see the
[Amplify Migration Apps README](../../../../../../../amplify-migration-apps/README.md#snapshot-testing).

## Architecture

```
_framework/
├── app.ts              # MigrationApp — the main entry point
├── clients.ts          # MockClients — orchestrates all service mocks
├── directories.ts      # Directory diffing and copying utilities
├── report.ts           # Report — human-readable snapshot diff output
├── snapshot.ts         # Snapshot — comparison and updating
├── clients/            # Per-service AWS SDK mock implementations
│   ├── amplify.ts
│   ├── appsync.ts
│   ├── cloudformation.ts
│   ├── cloudwatch-events.ts
│   ├── cognito-identity.ts
│   ├── cognito-identity-provider.ts
│   ├── dynamodb.ts
│   ├── lambda.ts
│   ├── s3.ts
│   └── sts.ts
```

## Core Components

### MigrationApp (`app.ts`)

The central class that represents a migration app under test. It:

- Reads the app's `amplify-meta.json`, `team-provider-info.json`, and root CloudFormation template.
- Exposes the app's ID, region, environment name, and helper methods for accessing resources.
- Sets up mock SDK clients via `MockClients`.
- Provides `MigrationApp.run()` to execute a test callback in an isolated temp directory.
- Exposes `snapshots.generate` and `snapshots.refactor` for comparing output against expected directories.

### MockClients (`clients.ts`)

Orchestrates mock AWS SDK clients for all services the migration codegen calls. Each mock
derives its responses from local files in the app's snapshot input directories
(`_snapshot.pre.generate/` and `_snapshot.pre.refactor/`), so tests run without
AWS credentials while still exercising realistic data paths.

### Snapshot (`snapshot.ts`)

Manages snapshot comparison and updating for a migration app. Each `MigrationApp` has two
snapshots: `snapshots.generate` and `snapshots.refactor`. Provides:

- `compare(actualDir)` — diffs the actual codegen output against the expected snapshot directory
  and returns a `Report`.
- `update(actualDir)` — replaces the expected snapshot with the actual output (used with `--updateSnapshot`).

### Report (`report.ts`)

A human-readable report of differences between actual and expected snapshot output, returned
by `Snapshot.compare()`. Provides:

- `hasChanges` — whether any differences were found.
- `print()` — outputs a color-coded terminal report showing extra, missing, and modified files with diffs.

### Directory Utilities (`directories.ts`)

- `diff()` — recursively compares two directories, returning `FileDiff` entries for missing, extra,
  and modified files (with jest-diff output for content changes).
- `copySync()` — recursive directory copy with ignore pattern support.

## Mock Clients

Each mock in `clients/` follows the same pattern: it receives a `MigrationApp` instance and uses
the app's local files to construct realistic responses. The table below summarizes what each mock
reads and returns.

| Mock                          | Source Files                                                                                           | What It Provides                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `AmplifyMock`                 | `amplify-meta.json`, `team-provider-info.json`                                                         | Backend environment info, app metadata, build spec         |
| `AppSyncMock`                 | `amplify-meta.json`, `api/<name>/cli-inputs.json`                                                      | GraphQL API config, auth types, API listing                |
| `CloudFormationMock`          | CloudFormation templates via `templatePathForStack()`                                                  | Stack resources with physical IDs, nested stack parameters |
| `CloudWatchEventsMock`        | (none)                                                                                                 | Empty/default responses                                    |
| `CognitoIdentityMock`         | `auth/<name>/cli-inputs.json`, `amplify-meta.json`                                                     | Identity pool config                                       |
| `CognitoIdentityProviderMock` | `auth/<name>/cli-inputs.json`, auth CloudFormation template, `amplify-meta.json`                       | User pool config, MFA, triggers, groups, client settings   |
| `LambdaMock`                  | `function/<name>/<name>-cloudformation-template.json`, `function-parameters.json`, `amplify-meta.json` | Function config with resolved environment variables        |
| `S3Mock`                      | `storage/<name>/` CloudFormation template, `amplify-meta.json`                                         | Bucket notification config, encryption, versioning         |
| `DynamoDBMock`                | `storage/<name>/` CloudFormation template, `amplify-meta.json`                                         | Table schema, key schema, GSIs, throughput, stream config  |
| `STSMock`                     | (none)                                                                                                 | Hardcoded caller identity (account ID `123456789012`)      |

## Adding a New Mock Client

If the migration codegen starts calling a new AWS service:

1. Create a new file in `clients/` following the existing pattern (receive a `MigrationApp` in the constructor).
2. Use `mockClient()` from `aws-sdk-client-mock` to mock the service client.
3. Derive responses from local app files where possible.
4. Register the new mock in `MockClients` (`clients.ts`).
5. Expose it on `MigrationApp.clients` if tests need direct access.

## Customizing an App Within a Test

The `testSnapshot` helper accepts an optional `customize` callback that runs before the migration
codegen executes. This lets you modify mock client behavior for a specific test without affecting
other tests that use the same app.

The callback receives the `MigrationApp` instance, giving you access to `app.clients` where you
can override or extend any mock response.

Prefer extending the mock clients in `clients/` to derive values from local files over using
`customize`. The `customize` escape hatch should only be used when a value genuinely cannot be
extracted from the app's local files (e.g., it only exists at deploy time in the live AWS
environment). Keeping mock logic in the framework ensures all apps benefit from it automatically,
whereas `customize` overrides are per-test and easy to forget when the framework evolves.

```typescript
test('my-app with custom auth', async () => {
  await testSnapshot('my-app', { buildSpec: BUILDSPEC }, async (app) => {
    // Override the Cognito mock to return a different MFA config
    app.clients.cognitoIdentityProvider.on(GetUserPoolMfaConfigCommand).resolves({
      MfaConfiguration: 'ON',
      SoftwareTokenMfaConfiguration: { Enabled: true },
    });
  });
});
```

The `customize` callback runs after the app environment is set up but before the migration codegen,
so your overrides are in place when the code under test makes AWS SDK calls.
