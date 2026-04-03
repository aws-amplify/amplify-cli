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
2. `amplify init` - initialize the Gen1 project
3. Configure categories by restoring the pre-generate snapshot into the `amplify/` directory
4. `amplify push` - deploy the Gen1 stack
5. Run `frontest.ts` against the Gen1 config to validate the deployment
6. `amplify gen2-migration assess`
7. `amplify gen2-migration lock`
8. `amplify gen2-migration generate`
9. Run `migration/post-generate.ts` (app-specific fixups)
10. `npx ampx sandbox --once` - deploy the Gen2 stack
11. Run `frontest.ts` against both Gen1 and Gen2 configs
12. `amplify gen2-migration refactor` - move stateful resources to Gen2
13. Run `migration/post-refactor.ts` (app-specific fixups)
14. Redeploy Gen2 sandbox to pick up post-refactor changes
15. Run `frontest.ts` against both configs again

Test scripts run at multiple points to verify that both stacks remain functional throughout the migration.

The system automatically runs app-specific scripts from the `migration/` directory at the
appropriate points in the workflow. If a script does not exist, the step is silently skipped:

- `migration/post-push.ts` — after `amplify push` (configured via `migration/config.json`)
- `migration/post-generate.ts` — after `gen2-migration generate`
- `migration/post-refactor.ts` — after `gen2-migration refactor`

Similarly, `frontest.ts` is run automatically after each deployment if the file exists.

### Migration Config

Each app can optionally include a `migration/config.json` to customize the E2E workflow:

```json
{
  "postPush": "migration/post-push.ts",
  "lock": { "skipValidations": true }
}
```

| Field                  | Description                                                       |
| ---------------------- | ----------------------------------------------------------------- |
| `postPush`             | Path (relative to app root) to a script run after `amplify push`. |
| `lock.skipValidations` | Pass `--skip-validations` to `gen2-migration lock`.               |

If the file does not exist, defaults are used (no post-push script, no skip-validations).

For details on the app layout, test scripts, and migration scripts, see the [amplify-migration-apps README](../../amplify-migration-apps/README.md).

## Package Architecture

```
src/
+-- cli.ts                          # CLI entry point (yargs-based)
+-- core/
|   +-- amplify-initializer.ts      # Amplify project initialization
|   +-- gen2-migration-executor.ts  # Gen2 migration command orchestration
+-- utils/
    +-- git.ts                      # Git operations (init, commit, checkout)
    +-- logger.ts                   # Logging with file output
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
