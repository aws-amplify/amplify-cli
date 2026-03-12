# Refactor the Refactor Command — Phases 1-5

## The Payoff

`refactor.ts` went from 354 lines of inline logic (AWS client instantiation, template generation, rollback orchestration, resource mapping validation, analytics) to 73 lines of imports + orchestration. The entry point now creates facades, instantiates category refactorers, and returns their operations. Everything else lives in focused, single-responsibility modules.

## What This PR Does

Rebuilds the `gen2-migration refactor` command's internals in a new `refactor-new/` directory alongside the old code. The old `refactor/` directory is intentionally left intact — Phase 7 (separate PR) deletes it and renames `refactor-new/` to `refactor/`.

### Architecture (30-second version)

- `CategoryRefactorer.plan()` is the orchestrator. It calls abstract methods that subclasses implement, producing a sequence of `RefactorOperation[]` with validate/describe/execute phases.
- `ForwardCategoryRefactorer` moves resources Gen1→Gen2 with a holding stack for Gen2's existing resources.
- `RollbackCategoryRefactorer` moves resources Gen2→Gen1 and restores the holding stack.
- Four stateless resolvers transform CloudFormation templates by tree-walking (no JSON string replacement).
- `StackFacade` is a lazy-loading, caching facade over CloudFormation API calls. Created once per root stack.
- Each category (auth, storage, analytics) has a forward + rollback refactorer that provides resource types, stack discovery, and logical ID mapping.

See `REFACTORING_REFACTOR.md` for the full architecture plan and requirements R1-R8.

## Review Guide

### Scrutinize (~2,500 lines)

- **`refactor-new/` source** (25 files, 2,401 lines) — All new production code. Start with `workflow/category-refactorer.ts` (the base class), then `forward-category-refactorer.ts` and `rollback-category-refactorer.ts`, then the category implementations in `auth/`, `storage/`, `analytics/`.
- **`refactor/refactor.ts` switchover** (net -281 lines) — The entry point rewritten to import from `refactor-new/`. This is where the old and new code connect.

### Skim (~4,000 lines)

- **`refactor-new/` tests** (22 files, 2,860 lines) — 117 test cases covering all source files with logic. Review test names for coverage completeness; the mock setups follow a consistent pattern (aws-sdk-client-mock at the SDK level, real StackFacade instances).
- **`REFACTORING_REFACTOR.md` + `CODING_GUIDELINES.md`** (1,233 lines) — Reference documents. Read `REFACTORING_REFACTOR.md` for architecture context if the code isn't self-explanatory.

### Phase 7 Contract

This PR intentionally leaves the old `refactor/` directory and its 31 tests intact. The old source files (resolvers, generators, etc.) are dead code — nothing imports them except the old tests. The next PR deletes the old directory, renames `refactor-new/` to `refactor/`, and updates all import paths. That PR is a pure deletion + rename with zero logic changes.

The one exception is `refactor/legacy-custom-resource.ts` — extracted from the old `refactor.ts` to handle the `--resourceMappings` flag. It bridges old and new code and will be replaced when a custom resource refactorer is implemented.

## Validation

- `yarn build && yarn test` — 940 tests pass (pre-existing flaky `status.test.ts` excluded)
- `npx jest --testPathPattern="gen2-migration/refactor-new"` — 22 suites, 117 `it()` calls, all green
- All 51 snapshots pass (old e2e snapshot tests validate the new code paths)
- No existing source files or test files modified (except `refactor.ts` switchover)

## Diff Summary

```
51 files changed, +6,726 / -354
  refactor-new/ source:  25 files, +2,401
  refactor-new/ tests:   22 files, +2,860
  refactor.ts switchover: 1 file,  +73 / -354
  legacy-custom-resource: 1 file,  +159
  docs:                   2 files, +1,233
```
