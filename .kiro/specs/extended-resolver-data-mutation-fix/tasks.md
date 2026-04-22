# Implementation Plan

- [x] 1. Write bug condition exploration test

  - **Property 1: Bug Condition** — Override Loop Matches Extended Resolver Files
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the generated override loop filter matches 6-segment extended resolver files
  - **Scoped PBT Approach**: Use `fast-check` to generate VTL filenames with 6 dot-separated segments (e.g., `TypeName.fieldName.slot.order.req.vtl`). For each generated filename, print the AST produced by `buildResolverForOfLoop()` and inspect the generated `resolverFiles` filter. Assert that the filter expression includes a segment-count guard (`f.split(".").length === 4`) that would exclude 6-segment files.
  - **Test file**: `packages/amplify-cli/src/__tests__/commands/gen2-migration/generate/amplify/data/data.generator.bugfix.test.ts`
  - **Setup**: Add `fast-check` as a devDependency to `packages/amplify-cli/package.json`
  - **How to inspect the AST**: The `buildResolverForOfLoop()` method is private, but `contributeResolverOverrides()` calls it and adds the result via `backendGenerator.addStatement()`. Capture the statement added to `backendGenerator` and use the TypeScript compiler API (`ts.createPrinter()`) to print the generated code. Then assert the printed code contains `f.split(".").length === 4` or an equivalent segment-count check.
  - **Alternative approach**: Since `buildResolverForOfLoop()` is private, test through the public `plan()` + `execute()` path. Set up mock VTL files containing both 4-segment and 6-segment filenames, execute the plan, capture the statements added to `backendGenerator`, and print the generated filter code. Assert the filter excludes 6-segment files.
  - Run test on UNFIXED code — expect FAILURE (the generated filter does NOT contain a segment-count guard)
  - **EXPECTED OUTCOME**: Test FAILS — this confirms the bug exists (the filter matches all `.req.vtl`/`.res.vtl` files regardless of segment count)
  - Document counterexamples found (e.g., `Mutation.createBoard.init.2.req.vtl` passes the generated filter and gets processed as a DataResolverFn override)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)

  - **Property 2: Preservation** — Override Loop Includes 4-Segment Override Files
  - **IMPORTANT**: Follow observation-first methodology
  - **Test file**: `packages/amplify-cli/src/__tests__/commands/gen2-migration/generate/amplify/data/data.generator.bugfix.test.ts` (same file as task 1)
  - Observe: On UNFIXED code, set up mock with only 4-segment override files (e.g., `Query.listProducts.req.vtl`), execute `plan()`, capture the statements added to `backendGenerator`. Print the generated for-of loop code and record the exact output.
  - Observe: On UNFIXED code, set up mock with no VTL files, execute `plan()`, verify no resolver override statements are added to `backendGenerator`.
  - Observe: On UNFIXED code, call `classifyResolverFiles()` with mixed 4-segment and 6-segment files, verify classification is correct (4-segment → overrideFiles, 6-segment → extendedDescriptors).
  - Write property-based test using `fast-check`: For all randomly generated sets of 4-segment override filenames (format `TypeName.fieldName.{req|res}.vtl`), the generated for-of loop code from `contributeResolverOverrides()` contains a `resolverFiles` filter, and the number of statements added to `backendGenerator` is consistent (4 statements: `__dirname`, `resolversDir`, `resolverFiles`, for-of loop).
  - Write property-based test using `fast-check`: For all randomly generated VTL filename sets, `classifyResolverFiles()` correctly classifies 4-segment files as overrides and 6-segment files as extended descriptors (this function is NOT being changed, so it must produce identical results).
  - Verify all preservation tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS — this confirms baseline behavior to preserve
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Fix for override loop filter matching extended resolver files

  - [x] 3.1 Implement the fix in `buildResolverForOfLoop()`

    - Modify the `contributeResolverOverrides()` method in `packages/amplify-cli/src/commands/gen2-migration/generate/amplify/data/data.generator.ts`
    - In the `buildResolverForOfLoop()` private method, add a segment-count guard to the generated `resolverFiles` filter arrow function
    - The current generated filter is: `f => f.endsWith(".req.vtl") || f.endsWith(".res.vtl")`
    - The fixed generated filter should be: `f => (f.endsWith(".req.vtl") || f.endsWith(".res.vtl")) && f.split(".").length === 4`
    - This requires adding an `&&` binary expression with a `===` comparison between `f.split(".").length` and `4` to the existing filter's AST construction
    - Specifically, wrap the existing `endsWith` OR expression in parentheses, then AND it with the new segment-count check
    - _Bug_Condition: isBugCondition(input) where generatedOverrideFilter matches 6-segment extended resolver files because it only checks `.endsWith(".req.vtl") || .endsWith(".res.vtl")` without a segment-count guard_
    - _Expected_Behavior: The generated filter SHALL include `f.split(".").length === 4` so that only 4-segment override files pass the filter_
    - _Preservation: Override resolver behavior for 4-segment files must remain unchanged — the filter must still match all 4-segment `.req.vtl` and `.res.vtl` files_
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 3.1_

  - [x] 3.2 Update moodboard snapshot

    - Update the moodboard app's expected post-generate snapshot to reflect the fixed generated code
    - The snapshot file at `amplify-migration-apps/mood-board/_snapshot.post.generate/amplify/backend.ts` needs to include the segment-count guard in the generated `resolverFiles` filter
    - Run the snapshot test to identify the exact diff and update accordingly
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verify bug condition exploration test now passes

    - **Property 1: Expected Behavior** — Override Loop Excludes Extended Resolver Files
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior (generated filter includes segment-count guard)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed — the generated filter now excludes 6-segment files)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** — Override Loop Includes 4-Segment Override Files
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions — 4-segment override files still pass the filter, classification logic unchanged)
    - Confirm all tests still pass after fix (no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Checkpoint — Ensure all tests pass
  - Run `yarn build && yarn test` in `packages/amplify-cli/` to verify the full test suite passes
  - Ensure the bug condition exploration test (Property 1) passes
  - Ensure the preservation property tests (Property 2) pass
  - Ensure all existing tests in `data.generator.test.ts` still pass
  - Ensure the moodboard snapshot test passes with the updated expected snapshot
  - Ask the user if questions arise
