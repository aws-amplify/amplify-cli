# Amplify Gen2 Migration E2E System

Automation system for end-to-end testing of the Amplify Gen1-to-Gen2 migration workflow. It deploys a Gen1 app, runs the migration CLI commands, deploys the Gen2 output, and validates both stacks with test scripts at each stage.

## Usage

```bash
# Set AMPLIFY_PATH to your development Amplify CLI (optional - falls back to monorepo build, then global install)
export AMPLIFY_PATH=$(pwd)/.bin/amplify-dev

# Migrate an app using a named AWS profile
npx tsx src/cli.ts --app project-boards --profile default

# Verbose logging
npx tsx src/cli.ts --app project-boards --profile default --verbose
```

### CLI Options

| Option      | Alias | Description                                                                        |
| ----------- | ----- | ---------------------------------------------------------------------------------- |
| `--app`     | `-a`  | App to migrate (required). Must match a directory under `amplify-migration-apps/`. |
| `--profile` |       | AWS profile to use (required).                                                     |
| `--verbose` | `-v`  | Enable debug-level logging.                                                        |

## Migration Workflow

The CLI executes the following steps for a given app:

1. Copy app source to a temp directory (excluding `_snapshot*` and `node_modules`)
2. `amplify init` — initialize the Gen1 project
3. Configure categories by restoring the pre-generate snapshot into the `amplify/` directory
4. `npm install`
5. `amplify push` — deploy the Gen1 stack
6. Run `post-push` npm script (app-specific fixups)
7. Run `test:gen1` — validate the Gen1 deployment
8. `amplify gen2-migration assess`
9. `amplify gen2-migration lock`
10. Checkout a new `gen2-<env>` branch
11. `amplify gen2-migration generate`
12. `npm install`
13. Run `post-generate` npm script (app-specific fixups)
14. `npx ampx sandbox --once` — deploy the Gen2 stack
15. Run `test:gen1` and `test:gen2` — validate both stacks
16. Checkout `main` branch (refactor requires Gen1 files)
17. `amplify gen2-migration refactor` — move stateful resources to Gen2
18. Checkout `gen2-<env>` branch
19. Run `post-refactor` npm script (app-specific fixups)
20. Run `test:gen1` and `test:gen2` — validate both stacks
21. Redeploy Gen2 sandbox to pick up post-refactor changes
22. Run `test:gen1` and `test:gen2` — final validation

Test scripts run at multiple points to verify that both stacks remain functional throughout the migration.

The system runs npm scripts defined in each app's `package.json`:

- `post-push` — after `amplify push`
- `post-generate` — after `gen2-migration generate`
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

| Field                  | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `lock.skipValidations` | Pass `--skip-validations` to `gen2-migration lock`. |

If the file does not exist, defaults are used.

For details on the app layout, test scripts, and migration scripts, see the [amplify-migration-apps README](../../amplify-migration-apps/README.md).

## Package Architecture

```
src/
├── cli.ts                          # CLI entry point and migration workflow orchestration
└── core/
    ├── app.ts                      # App class — owns the full lifecycle of a migration app
    ├── git.ts                      # Git operations (init, commit, checkout)
    └── logger.ts                   # Logging with file output
```

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

Logs are written to both console and file. File logs go to `$TMPDIR/amplify-gen2-migration-e2e-system/logs/<deployment-name>.log`.

## FAQ

### The security token included in the request is invalid

Re-authenticate and get new credentials for your working environment.

### CDK failed to publish assets

Likely a problem with your CDKToolkit bootstrap stack. Check it in your AWS account.

### AppSync API limit exceeded

AppSync has a limit of 50 APIs per account/region. Delete unused ones before retrying.

### Amplify init fails

Check which `amplify` binary you are using. The Amplify console also has a limit of 25 apps per account/region.
