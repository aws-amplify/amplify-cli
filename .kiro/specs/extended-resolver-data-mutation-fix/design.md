# Extended Resolver Data Mutation Fix — Bugfix Design

## Overview

The extended resolver migration feature generates resolver code that incorrectly mutates data in the migrated Gen2 app. The root cause is that the **generated override resolver loop** (`contributeResolverOverrides`) emits runtime code whose file filter (`f.endsWith(".req.vtl") || f.endsWith(".res.vtl")`) matches **all** VTL files — including 6-segment extended resolver files. This causes extended resolver VTL templates (which contain intentional data-transforming logic for specific pipeline slots) to be incorrectly applied as DataResolverFn mapping template overrides, replacing the default passthrough behavior with data-mutating logic.

A secondary issue is that the generated override loop's filename parsing (`file.replace(".req.vtl", "").replace(".res.vtl", "").split(".")`) extracts only `[typeName, fieldName]` from the split result. For extended resolver files like `Mutation.createBoard.init.2.req.vtl`, this still produces the correct `typeName` and `fieldName` (the extra segments are ignored), so the override silently succeeds — replacing the DataResolverFn's template with VTL logic that was designed for a different pipeline slot.

The fix is to make the generated override loop filter only match 4-segment override files (e.g., `Query.listBoards.req.vtl`) and exclude 6-segment extended resolver files (e.g., `Mutation.createBoard.init.2.req.vtl`).

## Glossary

- **Bug_Condition (C)**: The condition where the generated override resolver loop's runtime file filter matches extended resolver VTL files (6-segment filenames), causing them to be incorrectly applied as DataResolverFn template overrides
- **Property (P)**: The generated override resolver loop SHALL only process 4-segment override files, and extended resolver files SHALL only be processed by the extended resolver code path (AppsyncFunction + splice)
- **Preservation**: Override resolver behavior for 4-segment files, extended resolver AppsyncFunction generation, splice index computation, filename parsing, and classification logic must remain unchanged
- **`contributeResolverOverrides()`**: The method in `data.generator.ts` that generates the runtime `for-of` loop processing VTL files as DataResolverFn template overrides
- **`buildResolverForOfLoop()`**: The private method that constructs the AST for the override resolver processing loop, including the file filter
- **Override Resolver**: A VTL file with 4 dot-separated segments (`TypeName.fieldName.req.vtl`) that replaces the DataResolverFn's mapping template
- **Extended Resolver**: A VTL file with 6 dot-separated segments (`TypeName.fieldName.slot.order.req.vtl`) that creates a separate AppsyncFunction spliced into the pipeline

## Bug Details

### Bug Condition

The bug manifests when the migration tool processes a Gen1 app that has both override resolver files (4-segment) and extended resolver files (6-segment) in the same resolvers directory. The generated runtime code in `backend.ts` includes a `resolverFiles` filter that matches all `.vtl` files ending in `.req.vtl` or `.res.vtl`, regardless of segment count. Extended resolver VTL files pass this filter and get processed by the override loop, which replaces the DataResolverFn's mapping template S3 location with the extended resolver's VTL content.

**Formal Specification:**

```
FUNCTION isBugCondition(input)
  INPUT: input of type { vtlFiles: string[], generatedOverrideFilter: string }
  OUTPUT: boolean

  LET extendedFiles = vtlFiles.filter(f => f.split('.').length === 6)
  LET filterMatchesExtended = extendedFiles.some(f =>
    f.endsWith('.req.vtl') OR f.endsWith('.res.vtl')
  )

  RETURN extendedFiles.length > 0
         AND filterMatchesExtended
         AND generatedOverrideFilter === "f.endsWith('.req.vtl') || f.endsWith('.res.vtl')"
END FUNCTION
```

### Examples

- `Mutation.createBoard.init.2.req.vtl` (6 segments) passes the `.req.vtl` filter, gets processed as an override, and its VTL logic (which prepends a time-of-day emoji to the board name via `$ctx.stash.defaultValues`) replaces the DataResolverFn's request template. Result: `createBoard` mutation modifies board names.
- `Mutation.createBoard.finish.1.res.vtl` (6 segments) passes the `.res.vtl` filter, gets processed as an override, and its VTL logic (which appends `" (new!)"` to the board name) replaces the DataResolverFn's response template. Result: `createBoard` mutation returns modified board names.
- `Query.listBoards.res.vtl` (4 segments) is a legitimate override file whose VTL logic prepends `"📌 "` to board names. This is correctly classified as an override — the data mutation is the **intended Gen1 behavior** for this override. The test expects `board.name` to equal the original name, which means the expected snapshot should NOT include this override, OR the test expectation is wrong. **Investigation needed**: the expected snapshot `backend.ts` does not contain any override or extended resolver code, suggesting the expected behavior is that these VTL files should be processed but the test app's expected snapshot needs updating.
- `Query.listBoards.req.vtl` (4 segments) is a legitimate override file that caps results at 50. This is correctly classified and should be applied as an override.

**Clarification on the two bugs:**

1. **Extended resolver files processed as overrides** (the filter bug): `Mutation.createBoard.init.2.req.vtl` and `Mutation.createBoard.finish.1.res.vtl` are extended resolver files that should ONLY be processed by the extended resolver code path (AppsyncFunction + splice). The override loop should skip them.

2. **Override resolver files contain data-mutating VTL** (by design): `Query.listBoards.res.vtl` is a legitimate override that prepends "📌 " to board names. This is the Gen1 app's intended behavior. The migration tool correctly applies this override. The E2E test expects `found.name === name` (unmodified), which means the test is validating that the Gen2 app behaves identically to the Gen1 app **without** the override. This suggests the expected snapshot needs to include the override code, or the VTL files are test fixtures designed to verify that the migration tool handles them correctly.

**Root cause focus**: The primary bug is #1 — the generated override loop filter must exclude extended resolver files. Bug #2 is the expected Gen1 behavior and is not a code defect.

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Override resolver classification (4-segment files classified as overrides) must continue to work
- Extended resolver classification (6-segment files classified as extended) must continue to work
- Extended resolver AppsyncFunction generation (`renderAppsyncFunction`) must continue to work
- Splice index computation (`computeSpliceIndexes`) must continue to work
- Extended resolver filename parsing (`parseExtendedResolverFilename`) must continue to work
- Extended resolver grouping and pairing (`groupExtendedResolvers`) must continue to work
- NoneDataSource declaration generation must continue to work
- VTL file copy operation must continue to copy all VTL files (both override and extended)
- Apps with no VTL resolvers must continue to generate standard pipeline code

**Scope:**
All inputs that do NOT involve the generated override resolver loop's file filter are completely unaffected by this fix. This includes:

- Extended resolver code generation (AppsyncFunction, splice statements)
- Classification logic in `classifyResolverFiles()`
- Filename parsing in `parseExtendedResolverFilename()`
- Splice index computation in `computeSpliceIndexes()`
- DataRenderer methods (`renderAppsyncFunction`, `renderSpliceStatements`, `renderNoneDataSource`)

## Hypothesized Root Cause

Based on the code analysis, the root cause is confirmed (not hypothesized):

1. **Generated override loop filter is too broad**: The `buildResolverForOfLoop()` method in `data.generator.ts` generates runtime code that filters files with `f.endsWith(".req.vtl") || f.endsWith(".res.vtl")`. This matches ALL VTL files regardless of segment count. Extended resolver files like `Mutation.createBoard.init.2.req.vtl` pass this filter and get processed as DataResolverFn template overrides.

2. **The override loop's filename parsing silently succeeds for extended files**: The generated code does `file.replace(".req.vtl", "").replace(".res.vtl", "").split(".")` and destructures `[typeName, fieldName]`. For `Mutation.createBoard.init.2.req.vtl`, this produces `["Mutation", "createBoard", "init", "2"]` — the extra segments are silently ignored, and `typeName="Mutation"`, `fieldName="createBoard"` are correct. So the override silently replaces the DataResolverFn's template with VTL logic designed for a different pipeline slot.

3. **No segment-count guard in the generated runtime code**: The classification logic in `classifyResolverFiles()` correctly distinguishes 4-segment from 6-segment files at generation time, but the generated runtime code in `backend.ts` has no equivalent guard. The generation-time classification drives which code paths are emitted (override vs. extended), but the generated override loop re-discovers files at runtime without the same classification.

**The fix**: Modify `buildResolverForOfLoop()` to generate a file filter that only matches 4-segment override files. The simplest approach is to add a segment-count check to the generated filter: `f.endsWith(".req.vtl") || f.endsWith(".res.vtl")` becomes `(f.endsWith(".req.vtl") || f.endsWith(".res.vtl")) && f.split(".").length === 4`.

## Correctness Properties

Property 1: Bug Condition — Override Loop Excludes Extended Resolver Files

_For any_ set of VTL files where at least one file has 6 dot-separated segments (an extended resolver file), the generated override resolver loop's file filter SHALL exclude that file, ensuring it is NOT processed as a DataResolverFn template override.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation — Override Loop Includes Override Resolver Files

_For any_ set of VTL files where at least one file has exactly 4 dot-separated segments (an override resolver file), the generated override resolver loop's file filter SHALL include that file, preserving the existing override behavior for legitimate override resolvers.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

**File**: `packages/amplify-cli/src/commands/gen2-migration/generate/amplify/data/data.generator.ts`

**Method**: `buildResolverForOfLoop()`

**Specific Changes**:

1. **Add segment-count guard to the generated file filter**: The generated `resolverFiles` filter currently uses `f.endsWith(".req.vtl") || f.endsWith(".res.vtl")`. Add a `f.split(".").length === 4` check so that only 4-segment override files pass the filter. The generated code should become:

   ```typescript
   const resolverFiles = readdirSync(resolversDir).filter(
     (f) => (f.endsWith('.req.vtl') || f.endsWith('.res.vtl')) && f.split('.').length === 4,
   );
   ```

2. **Update the AST construction in `contributeResolverOverrides()`**: The `buildResolverForOfLoop()` method constructs the filter as a TypeScript AST. Add an `&&` binary expression with a `f.split(".").length === 4` check to the existing filter arrow function.

3. **Update the expected snapshot**: The moodboard app's `_snapshot.post.generate/amplify/backend.ts` needs to be updated to include the override and extended resolver code that the migration tool now generates (since the moodboard app has VTL files).

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause analysis.

**Test Plan**: Write tests that verify the generated override loop filter behavior. Create a set of VTL filenames containing both 4-segment and 6-segment files, run them through the code generation, and inspect the generated AST to verify which files the filter matches.

**Test Cases**:

1. **Extended file in override loop**: Generate code with `Mutation.createBoard.init.2.req.vtl` present, verify the generated filter matches it (will fail on unfixed code — the filter DOES match it, confirming the bug)
2. **Override file in override loop**: Generate code with `Query.listBoards.req.vtl` present, verify the generated filter matches it (should pass on both unfixed and fixed code)
3. **Mixed files**: Generate code with both override and extended files, verify the generated filter matches only override files (will fail on unfixed code)

**Expected Counterexamples**:

- The generated filter `f.endsWith(".req.vtl") || f.endsWith(".res.vtl")` matches extended resolver files
- Extended resolver VTL templates get applied as DataResolverFn overrides, causing data mutation

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**

```
FOR ALL input WHERE isBugCondition(input) DO
  result := buildResolverForOfLoop_fixed(input)
  generatedFilter := extractFilterFromAST(result)
  ASSERT generatedFilter excludes 6-segment files
  ASSERT generatedFilter includes 4-segment files
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**

```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT buildResolverForOfLoop_original(input) = buildResolverForOfLoop_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:

- It generates many test cases automatically across the input domain
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for override-only file sets, then write property-based tests capturing that behavior.

**Test Cases**:

1. **Override-only preservation**: Verify that file sets containing only 4-segment files produce identical generated code before and after the fix
2. **No-VTL preservation**: Verify that apps with no VTL files produce identical generated code before and after the fix
3. **Classification preservation**: Verify that `classifyResolverFiles()` produces identical results before and after the fix (this function is not being changed)

### Unit Tests

- Test that the generated filter AST includes a segment-count check
- Test that the generated filter excludes 6-segment extended resolver filenames
- Test that the generated filter includes 4-segment override resolver filenames
- Test edge cases: files with 3 segments, 5 segments, 7 segments (should all be excluded)

### Property-Based Tests

- Generate random sets of VTL filenames (mix of 4-segment and 6-segment) and verify the generated filter only matches 4-segment files
- Generate random 4-segment override filenames and verify they all pass the generated filter (preservation)
- Generate random 6-segment extended resolver filenames and verify none pass the generated filter (fix)

### Integration Tests

- Run the full migration tool on the moodboard app and verify the generated `backend.ts` contains correct override and extended resolver code
- Verify the moodboard snapshot matches the expected output after the fix
- Verify the E2E tests pass with the fixed migration output
