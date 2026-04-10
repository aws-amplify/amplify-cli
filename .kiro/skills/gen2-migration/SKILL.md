---
name: gen2-migration
description: Development guidance for the Amplify Gen1-to-Gen2 migration tooling — architecture, commands, testing, and snapshot workflows
---

# Gen2 Migration Development

This skill provides context for working on the `amplify gen2-migration` CLI feature,
which migrates Amplify Gen1 applications to Gen2.

## Context

### Documentation

Before changing code, read the relevant docs files. They are the source of truth
for architecture and design decisions:

| Doc                                                                               | Covers                                                           |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `docs/packages/amplify-cli/src/commands/gen2-migration.md`                        | Architecture, CLI interface, Plan lifecycle, subcommand design   |
| `packages/amplify-gen2-migration-e2e-system/README.md`                            | E2E automation system, CLI options, migration workflow steps     |
| `packages/amplify-cli/src/__tests__/commands/gen2-migration/_framework/README.md` | Test framework, mock clients, snapshot comparison, customization |
| https://docs.amplify.aws/gen1/react/tools/cli/                                    | Amplify Gen1 CLI documentation                                   |
| https://docs.amplify.aws/react/build-a-backend/                                   | Amplify Gen2 backend documentation                               |

### Code

- `packages/amplify-cli/src/commands/gen2-migration/` — CLI commands and core logic
- `packages/amplify-cli/src/__tests__/commands/gen2-migration/` — Snapshot and unit tests
- `packages/amplify-gen2-migration-e2e-system/` — E2E testing automation

### Apps

Each subdirectory under `amplify-migration-apps/` is a test app representing a Gen1 project
with a specific combination of Amplify categories and configurations. See
`amplify-migration-apps/README.md` for the full structure and conventions.

## Development Loop

### Fix a Bug

The snapshot inputs (`_snapshot.pre.*`) don't change — only the code and possibly the
expected outputs (`_snapshot.post.*`) change.

1. Read the relevant Context above for the area you're touching.

2. Analyze the bug by reading the affected app's snapshot files. Read the
   `_snapshot.pre.generate/` and/or `_snapshot.pre.refactor/` files to understand the
   input configuration, and the `_snapshot.post.*` files to identify what's wrong in the
   current output.

3. Reproduce the bug by running the appropriate E2E test:

   ```bash
   cd amplify-migration-apps/<app-name>
   npm run test:e2e
   ```

   After the E2E run, inspect the live Gen1 and Gen2 resources and CloudFormation stack
   events using the AWS CLI to confirm the root cause.

4. Present the root cause analysis to the user.

5. Determine what the correct expected output should be after the fix. Present the proposed
   change to the expected output to the user and get approval before writing code.

6. Make the code change in `packages/amplify-cli/src/commands/gen2-migration/`.

7. Determine if the fix requires a new or updated E2E validation test in the affected app's
   `tests/` directory. These tests run against deployed stacks to verify the migrated app
   works correctly (API queries, storage operations, auth flows). See existing app tests
   for the pattern (e.g., `amplify-migration-apps/project-boards/tests/`).

8. Ask the user for confirmation before running E2E tests — they take a long time and
   require AWS credentials. If approved, run on the affected apps to regenerate snapshots:

   ```bash
   cd amplify-migration-apps/<app-name>
   UPDATE_SNAPSHOTS=1 npm run test:e2e
   ```

9. Run `yarn build && yarn test` in `packages/amplify-cli/` to verify nothing else broke.
   If tests fail at this point, only test code changes should be needed — the production
   code was already validated by the E2E run.

### Implement a New Feature

1. Read the relevant Context above for the area you're extending.

2. Read the existing test apps to find one that covers a similar configuration, or determine
   that a new app is needed.

3. Follow the "Adding an App" or "Modifying an App" instructions from
   `amplify-migration-apps/README.md` to update or create the `_snapshot.pre.generate/`
   inputs. Skip the E2E step — we'll run it after making code changes.

4. Determine what the expected output should be. Present the proposed expected output to
   the user and get approval before writing code.

5. Make the code change in `packages/amplify-cli/src/commands/gen2-migration/`.

6. Determine if the feature requires a new or updated E2E validation test in the affected
   app's `tests/` directory. See existing app tests for the pattern
   (e.g., `amplify-migration-apps/project-boards/tests/`).

7. Ask the user for confirmation before running E2E tests — they take a long time and
   require AWS credentials. If approved, run on the affected apps to regenerate snapshots:

   ```bash
   cd amplify-migration-apps/<app-name>
   UPDATE_SNAPSHOTS=1 npm run test:e2e
   ```

8. Run `yarn build && yarn test` in `packages/amplify-cli/` to verify nothing else broke.
   If tests fail at this point, only test code changes should be needed — the production
   code was already validated by the E2E run.
