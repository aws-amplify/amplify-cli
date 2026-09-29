# Amplify Gen2 Migration E2E System

Automation system for end-to-end testing of the Amplify Gen1-to-Gen2 migration workflow. It deploys a Gen1 app, runs the migration CLI commands, deploys the Gen2 output, and validates both stacks with test scripts at each stage.

## Usage

```bash
# Set AMPLIFY_PATH to your development Amplify CLI (optional - falls back to monorepo build, then global install)
export AMPLIFY_PATH=$(pwd)/.bin/amplify-dev

# Local dev: migrate an app using a named AWS profile
npx tsx src/cli.ts --app project-boards --profile default

# Verbose logging
npx tsx src/cli.ts --app project-boards --profile default --verbose
```

### CLI Options

| Option       | Alias | Description                                                                        |
| ------------ | ----- | ---------------------------------------------------------------------------------- |
| `--app`      | `-a`  | App to migrate (required). Must match a directory under `amplify-migration-apps/`. |
| `--profile`  |       | AWS profile to use. When set, disables automatic credential refresh.               |
| `--verbose`  | `-v`  | Enable debug-level logging.                                                        |
| `--step`     |       | Stop at a specific step (`deploy` or `migrate`). Defaults to full `e2e` run.       |
| `--teardown` |       | Delete all deployed resources after execution.                                     |

### Credential Refresh

Full migration runs take 30+ minutes, which exceeds typical STS session TTLs. In CI, `CredentialManager` performs a two-hop assume-role chain on each `refresh()` call:

1. CodeBuild container credentials (long-lived) → assume `TEST_ACCOUNT_ROLE` (parent account, 1hr)
2. Parent account credentials → assume `OrganizationAccountAccessRole` in `CHILD_ACCOUNT_ID` (1hr)

Because each `refresh()` starts from the long-lived CodeBuild container credentials, the resulting sessions are always fresh regardless of total migration duration. Spawned subprocesses (Amplify CLI, `ampx sandbox`) pick up the refreshed profile via `AWS_PROFILE`. In `--profile` mode, no refresh happens — the caller-supplied profile is assumed to be long-lived.

## Package Architecture

```
src/
├── cli.ts                          # CLI entry point and migration workflow orchestration
├── index.ts                        # Public exports (App, Teardown)
└── core/
    ├── app.ts                      # App class — owns the full lifecycle of a migration app
    ├── credentials.ts              # CredentialManager — two-hop assume-role + refresh
    ├── git.ts                      # Git operations (init, commit, checkout)
    ├── ini-merge.ts                # Merges credentials into ~/.aws/credentials
    ├── logger.ts                   # Logging with file output
    ├── normalize.ts                # Normalizes run-specific values in snapshot files
    ├── sanitize.ts                 # Sanitizes sensitive values in snapshot files
    ├── snapshot.ts                 # Snapshot capture + post-processing
    └── teardown.ts                 # Teardown class — cleans up deployed resources
```

## Snapshot Post-Processing

After snapshots are captured, when the E2E system is executed with
`UPDATE_SNAPSHOTS=1`, two post-processing steps run before copying
them back to the source app directory:

1. **Normalize** — replaces run-specific values (random env names,
   CFN stack hashes) with deterministic placeholders so
   that snapshot filenames are stable across runs.
2. **Sanitize** — replaces sensitive values (AWS account IDs, API keys,
   resource identifiers from CloudFormation outputs) with safe placeholders
   suitable for public commit.

Order matters — normalize first, then sanitize.

### Normalization

Normalization replaces run-specific values in snapshot filenames
so that filenames are stable across runs.

| Value                   | Replacement            |
| ----------------------- | ---------------------- |
| Deployment name         | `<app-name-no-dashes>` |
| Environment name        | `x`                    |
| Environment hash        | `x`                    |
| Sandbox hash            | `x`                    |
| CFN nested stack hashes | `x`                    |

### Sanitization

Sanitization replaces sensitive values in file content:

| Value                          | Replacement                    |
| ------------------------------ | ------------------------------ |
| AWS Account ID                 | `123456789012`                 |
| Amplify App ID                 | `<app-name-no-dashes>`         |
| Gen1 AppSync API Key (da2-...) | `da2-fakeapikey00000000000000` |
| Gen2 AppSync API Key (da2-...) | `da2-fakeapikey00000000000000` |

## Development

### Building

```bash
# From package root
yarn build

# Or build the full monorepo from the repo root
yarn install && yarn build
```

### Environment Variables

| Variable       | Description                                                                                |
| -------------- | ------------------------------------------------------------------------------------------ |
| `AMPLIFY_PATH` | Path to development Amplify CLI binary. Falls back to monorepo build, then global install. |

### Logging

Logs are written to both console and file. File logs go to `$TMPDIR/amplify-e2e-gen2-migration/logs/<deployment-name>.log`.

## FAQ

### The security token included in the request is invalid

Re-authenticate and get new credentials for your working environment.

### CDK failed to publish assets

Likely a problem with your CDKToolkit bootstrap stack. Check it in your AWS account.

### AppSync API limit exceeded

AppSync has a limit of 50 APIs per account/region. Delete unused ones before retrying.

### Amplify init fails

Check which `amplify` binary you are using. The Amplify console also has a limit of 25 apps per account/region.
