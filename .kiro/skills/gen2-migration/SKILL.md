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
| `docs/packages/amplify-cli/src/commands/gen2-migration/assess.md`                 | Assessment, resource discovery, support levels                   |
| `docs/packages/amplify-cli/src/commands/gen2-migration/lock.md`                   | Lock step, drift detection, deletion protection                  |
| `docs/packages/amplify-cli/src/commands/gen2-migration/generate.md`               | Code generation pipeline, directory structure, generators        |
| `docs/packages/amplify-cli/src/commands/gen2-migration/refactor.md`               | CloudFormation stack refactoring, category refactorers           |
| `packages/amplify-e2e-gen2-migration/README.md`                                   | E2E automation system, CLI options, migration workflow steps     |
| `packages/amplify-cli/src/__tests__/commands/gen2-migration/_framework/README.md` | Test framework, mock clients, snapshot comparison, customization |
| `amplify-migration-apps/README.md`                                                | App structure, hooks, snapshots, adding/modifying apps           |
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
