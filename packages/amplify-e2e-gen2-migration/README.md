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
| `--verbose`  | `-v`  | Enable debug-level logging.                                                        |
| `--step`     |       | Stop at a specific step (`deploy` or `migrate`). Defaults to `migrate`.            |
| `--teardown` |       | Delete all deployed resources after execution.                                     |

### Credential Refresh

Full migration runs take 30+ minutes, which exceeds typical STS session TTLs. When `TEST_ACCOUNT_ROLE` is used, the CLI re-assumes the role and rewrites `~/.aws/credentials` before every long-running step (`init`, `push`, `assess`, `lock`, `generate`, `refactor`, `retain`, `deployGen2Sandbox`, `teardown`) so sessions don't expire mid-operation. Spawned subprocesses (Amplify CLI, `ampx sandbox`) pick up the refreshed profile via `AWS_PROFILE`. In `--profile` mode, no refresh happens — the caller-supplied profile is assumed to be long-lived.

## Migration Workflow

The CLI executes the following steps for a given app:

1. Copy app source to a temp directory (excluding `_snapshot*` and `node_modules`)
2. `amplify init` — initialize the Gen1 project
3. Configure categories by restoring the pre-generate snapshot into the `amplify/` directory
4. `npm install`
5. Run `pre-push` npm script (app-specific fixups before deployment)
6. `amplify push` — deploy the Gen1 stack
7. Run `post-push` npm script (app-specific fixups)
8. Run `test:gen1` — validate the Gen1 deployment
9. `amplify gen2-migration assess`
10. `amplify gen2-migration lock`
11. Checkout a new `gen2-<env>` branch
12. `amplify gen2-migration generate`
13. `npm install`
14. Run `post-generate` npm script (app-specific fixups)
15. `npx ampx sandbox --once` — deploy the Gen2 stack
16. Run `post-sandbox` npm script (app-specific fixups after first sandbox deploy)
17. Run `test:gen1` and `test:gen2` — validate both stacks
18. Checkout `main` branch (refactor requires Gen1 files)
19. `amplify gen2-migration refactor` — move stateful resources to Gen2
20. Checkout `gen2-<env>` branch
21. Run `post-refactor` npm script (app-specific fixups)
22. Run `test:gen1` and `test:gen2` — validate both stacks
23. Redeploy Gen2 sandbox to pick up post-refactor changes
24. Run `test:gen1` and `test:gen2` — final validation
25. Run shared data tests
26. `amplify gen2-migration retain` — apply retain policies to every resource below root
27. Run `test:gen1` and `test:gen2` — post-retain validation

Test scripts run at multiple points to verify that both stacks remain functional throughout the migration.

The system runs npm scripts defined in each app's `package.json`:

- `pre-push` — before `amplify push`
- `post-push` — after `amplify push`
- `post-generate` — after `gen2-migration generate`
- `post-sandbox` — after the first `npx ampx sandbox --once` deploy
- `post-refactor` — after `gen2-migration refactor`
- `test:gen1` — Jest tests against the Gen1 config (`src/amplifyconfiguration.json`)
- `test:gen2` — Jest tests against the Gen2 config (`amplify_outputs.json`)

Scripts set to `"true"` in `package.json` are effectively no-ops.

### Migration Config

Each app can optionally include a `migration/config.json` to customize the E2E workflow:

```json
{
  "lock": { "skipValidations": true }
}
```

| Field                      | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `lock.skipValidations`     | Pass `--skip-validations` to `gen2-migration lock`.     |
| `refactor.skip`            | Skip the refactor step entirely.                        |
| `refactor.skipValidations` | Pass `--skip-validations` to `gen2-migration refactor`. |

If the file does not exist, defaults are used.

For details on the app layout, test scripts, and migration scripts, see the [amplify-migration-apps README](../../amplify-migration-apps/README.md).

## Package Architecture

```
src/
├── cli.ts                          # CLI entry point and migration workflow orchestration
└── core/
    ├── app.ts                      # App class — owns the full lifecycle of a migration app
    ├── git.ts                      # Git operations (init, commit, checkout)
    ├── normalize.ts                # Normalizes run-specific values in snapshot files
    ├── sanitize.ts                 # Sanitizes sensitive values in snapshot files
    └── logger.ts                   # Logging with file output
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
