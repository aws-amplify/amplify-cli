---
name: add-gen2-migration-generate-snapshot-test
description: >
  Use when adding a new snapshot test for the gen2-migration generate command.
  Handles migration app setup, expected snapshot directory validation, test case
  registration, and mock client troubleshooting.
---

## Workflow

1. Read `amplify-migration-apps/README.md`, specifically the "Adding a Snapshot Test | `generate`" section. Follow those instructions.
2. Read `packages/amplify-cli/src/__tests__/commands/gen2-migration/_framework/README.md` for test framework and mock client details.
3. Add the test case to `packages/amplify-cli/src/__tests__/commands/gen2-migration/generate/codegen-head/command-handlers.test.ts`.
4. Run the test and make the necessary changes until it passes.

## Rules

- Ask the user for the app name and whether it uses Amplify Hosting before writing the test case.
- Do NOT generate the `amplify` or `_snapshot.post.generate/` directories — they must come from an actual migration run. If it doesn't exist, tell the user to run the migration first.
- Do NOT make production code changes to fix test failures. Only adjust mocks or test configuration.
- Do NOT make any behavioral changes to the expectation directory. This behavior was created and validated by the user already and must not change. You can however make syntax changes or ones needed due to the santiation process.
- Only make code changes to the test itself or the test framework code.

## Guidelines

- Do NOT create TypeScript interfaces for Amplify Gen1 configuration structures (e.g., `cli-inputs.json`, `team-provider-info.json`, CloudFormation template shapes). These configs are numerous, inconsistent, and loosely typed. Use `any` with eslint-disable comments instead.
