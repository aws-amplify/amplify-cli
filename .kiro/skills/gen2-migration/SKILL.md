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
| `packages/amplify-e2e-gen2-migration/README.md`                                   | E2E automation system, CLI options, migration workflow steps     |
| `packages/amplify-cli/src/__tests__/commands/gen2-migration/_framework/README.md` | Test framework, mock clients, snapshot comparison, customization |
| https://docs.amplify.aws/gen1/react/tools/cli/                                    | Amplify Gen1 CLI documentation                                   |
| https://docs.amplify.aws/react/build-a-backend/                                   | Amplify Gen2 backend documentation                               |

### Code

- `packages/amplify-cli/src/commands/gen2-migration/` — CLI commands and core logic
- `packages/amplify-cli/src/__tests__/commands/gen2-migration/` — Snapshot and unit tests
- `packages/amplify-e2e-gen2-migration/` — E2E testing automation

### Apps

Each subdirectory under `amplify-migration-apps/` is a test app representing a Gen1 project
with a specific combination of Amplify categories and configurations. See
`amplify-migration-apps/README.md` for the full structure and conventions.

### E2E System

#### Phases

The E2E runs the following phases in order:

1. Gen1 init/push
2. Gen1 tests
3. Capture `pre.generate` snapshot
4. Assess
5. Lock
6. Generate
7. Capture `post.generate` snapshot
8. Post-generate script
9. Sandbox deploy
10. Post-sandbox script
11. Gen1 tests + Gen2 tests (pre-refactor)
12. Capture `pre.refactor` snapshot
13. Refactor
14. Capture `post.refactor` snapshot
15. Gen1 tests + Gen2 tests (post-refactor)
16. Post-refactor script
17. Sandbox redeploy
18. Gen1 tests + Gen2 tests (final)
19. Shared data tests

#### App directory

The E2E logs the working directory for the app (look for `App directory:` in the output). This directory persists after the run
completes or fails. You can `cd` into it and run frontend tests directly
(e.g., `npm run test:gen1`, `npm run test:gen2`).

#### Snapshots

The E2E logs the directory where on-the-fly snapshots are captured for the run (look for
the `Snapshot directory:` line in the output). You can inspect the files in that directory
to see the state of the app at each phase.

#### Log file

The E2E prints `Logging to:` at the start with the path to a log file. To check progress,
`tail -n 50` (or more) that log file.

To avoid filling your context window, delegate E2E output reading to a sub-agent — have it
tail the log file and summarize the current phase, pass/fail status, and any errors.

**Do not stop polling.** This workflow is autonomous — no user is watching. When the E2E is
still running, keep polling the log file until it either completes or fails. Do not pause
and wait for user input between polls. If the E2E fails, analyze the failure and act on it.
If it succeeds, move on to the next step.

#### Duration

E2E runs take a long time — typically 30+ minutes. Expect long polling intervals when
monitoring progress.

#### AWS queries

Use read-only AWS CLI commands whenever you need information about live resources that
isn't available locally — stack status, Lambda configurations, Cognito user pool settings,
S3 bucket policies, etc. Stick to describe/list/get operations only.

#### Rebuild before running

If you changed migration code in `packages/amplify-cli/`, rebuild the CLI with
`yarn build` in that package before running the E2E. The E2E invokes the locally built
CLI, so stale builds will mask your fix.

#### Idempotency

The E2E is idempotent — previous runs won't interfere with the next one.

## Development Loop

Run these steps sequentially — do not stop and wait for user input between steps. Keep
going until the loop is complete. Do not skip any step.

#### 1. Research

Read the relevant Context above for the area you're touching.

#### 2. Find a test app

Read each app's `_snapshot.pre.generate/` files to determine whether an existing app
covers the scenario. If no existing app exercises the affected code path, follow the
[Adding an App](../amplify-migration-apps/README.md#adding-an-app) or
[Modifying an App](../amplify-migration-apps/README.md#modifying-an-app) instructions
before proceeding.

> **Note:** The `_snapshot.pre.generate/` directory may be newer than the other snapshot
> directories. This happens when the user has recaptured the input snapshot (e.g., after
> changing the Gen1 app configuration) but hasn't regenerated the remaining snapshots yet
> because the bug still needs to be fixed first. Don't treat a mismatch between
> `_snapshot.pre.generate/` and the other snapshots as an error.

#### 3. Add frontend tests

If the change is observable from the app's frontend (e.g., an auth flow, an API query,
a storage operation), add or update a test in the app's `tests/` directory that exercises
the behavior. These tests run against deployed stacks at multiple points during the E2E
(pre-refactor, post-refactor, final Gen2). See existing app tests for the pattern
(e.g., `amplify-migration-apps/project-boards/tests/`).

#### 4. Validate tests against Gen1

Run `npm run deploy` in the app directory. This deploys the Gen1 backend and runs the
frontend tests against it. Tests must pass here if they cover pre-existing Gen1 behavior —
if they don't, the test itself is wrong. Tests that cover Gen2-only behavior can be skipped
at this stage.

#### 5. Reproduce and RCA (bug fixes)

For bug fixes, reproduce the bug by running the E2E without `UPDATE_SNAPSHOTS`:

```bash
cd amplify-migration-apps/<app-name>
npm run test:e2e
```

Analyze the failure and write the root cause analysis to an `rca.md` file in the app
directory. Compare with similar apps that have the same category but don't exhibit the
bug — understanding why it manifests in one app and not another is often the key to the
root cause (e.g., a post-generate script or `resourceGroupName` override may mask the
issue in other apps).

> **Note:** For new features, skip this step.

#### 6. Commit

Commit the frontend tests, `rca.md`, and any app changes. This is a restore point — if
later steps go sideways, you can come back to this state.

#### 7. Implement

Make the code change in `packages/amplify-cli/src/commands/gen2-migration/`.

#### 8. Run E2E

Run the E2E on the affected app to validate the change and regenerate snapshots. If it
fails, fix the issue and rerun until it passes:

```bash
cd amplify-migration-apps/<app-name>
UPDATE_SNAPSHOTS=1 npm run test:e2e
```

#### 9. Unit tests

Run `yarn build && yarn test` in `packages/amplify-cli/` to verify nothing else broke.
If tests fail at this point, only test code changes should be needed — the production
code was already validated by the E2E run.

> **Note:** If you added a new app, you'll need to add snapshot test entries. See
> [Snapshot Testing](../amplify-migration-apps/README.md#snapshot-testing) for details.
