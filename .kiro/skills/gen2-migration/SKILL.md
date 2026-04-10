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

2. Identify which test apps exercise the buggy code path. Read their `_snapshot.pre.generate/`
   and/or `_snapshot.pre.refactor/` files to understand the input configuration. Read the
   corresponding `_snapshot.post.*` files to understand the current expected output.

3. Determine what the correct expected output should be after the fix. Present the proposed
   change to the expected output to the user and get approval before writing code.

4. Make the code change in `packages/amplify-cli/src/commands/gen2-migration/`.

5. Determine if the fix requires a new or updated E2E validation test in the affected app's
   `tests/` directory. These tests run against deployed stacks to verify the migrated app
   works correctly (API queries, storage operations, auth flows). See existing app tests
   for the pattern (e.g., `amplify-migration-apps/project-boards/tests/`).

6. Ask the user for confirmation before running E2E tests — they take a long time and
   require AWS credentials. If approved, run on the affected apps to regenerate snapshots:

   ```bash
   cd amplify-migration-apps/<app-name>
   UPDATE_SNAPSHOTS=1 npm run test:e2e
   ```

7. Run `yarn build && yarn test` in `packages/amplify-cli/` to verify nothing else broke.
   If tests fail at this point, only test code changes should be needed — the production
   code was already validated by the E2E run.

### Implement a New Feature

Same workflow as Fix a Bug, with one addition: the `_snapshot.pre.generate/` inputs need
to be updated or created to reflect the new Gen1 app configuration. Read
`amplify-migration-apps/README.md` ("Adding an App" / "Modifying an App" sections) for
how to deploy, configure, and capture the `pre.generate` snapshot using the snapshot
capture tool. Once the inputs are in place, follow steps 1–7 from Fix a Bug.
