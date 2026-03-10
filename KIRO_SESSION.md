# Kiro Session Retrospective

## Session 1 — Phase 1 & Phase 2 (Foundation + Category Migration)

### Session Overview

Refactoring the `generate` command in the Amplify CLI Gen1→Gen2
migration tool. The work followed a phased plan documented in
`REFACTORING_GENERATE.md`. This session covered Phase 1
(foundation) and Phase 2 (category migration).

### What I Got Right

**The initial foundation was solid.** The `Gen1App` facade,
`Generator` interface, `BackendGenerator`, and
`RootPackageJsonGenerator` were accepted without major structural
pushback. The core abstractions survived the entire session.

**Splitting Gen1App into facade + AwsFetcher.** When the user
pointed out gen1-app.ts was too big, I proposed the right split
(local file reading vs AWS calls) and the user agreed. The
`gen1App.aws.fetchUserPool(resources)` call chain was clean.

**The Generator+Renderer pattern.** Once we established it with
the data category, it became the template for all others. The
pattern of `this.defineData.render(opts)` was a good design that
the user liked and asked me to apply everywhere.

### Where I Needed Steering

- File truncation bugs during large writes
- Coding guideline violations on first pass (visibility
  modifiers, JSDoc format, readonly, assert usage)
- Importing from old `generate/` directory
- Not making REST API its own generator
- Schema reading and REST API config reading belonged in Gen1App
- Unnecessary adapter/fetcher/type files
- Dynamic `import()` expressions for types
- Renderer options in constructor vs render method

### Patterns That Emerged

- User teaches through one category, expects pattern applied
  everywhere
- Guidelines discovered iteratively
- User values design over correctness at this stage
- Self-review before committing is essential

---

## Session 2 — Phase 2 Review + Phase 3 Start

### Session Overview

Completed Phase 2 review, fixed all findings, restructured the
directory layout, split StorageGenerator, and began Phase 3.

### What Was Accomplished

- Fixed corrupted files from session 1
- Moved SDK calls into AwsFetcher
- Split StorageGenerator into S3Generator + DynamoDBGenerator
- Restructured directories: `gen1-app/` → `input/`,
  categories → `output/`
- Started Phase 3, identified 12 snapshot diff items

---

## Session 3 — Phase 3 Completion (Switch Over)

### Session Overview

Completed Phase 3: made all 7 snapshot tests pass by fixing
gaps between `prepareNew()` and expected output.

### What Was Accomplished

Two rounds of sub-agent delegation covered all fixes:

- Function dependency merging, import ordering, auth access
  detection, DynamoDB grants, GraphQL grants
- Env var ordering, default buildspec, earlyStatements,
  DynamoDB stream triggers, OAuth/UserPoolClient support,
  S3 function access, analytics positioning

---

## Session 4 — Phase 4 (Review & Simplify)

### Session Overview

Completed Phase 4: reviewed every file in `generate-new/`
against coding guidelines, design, and requirements R1–R5.
Fixed all known issues from Phase 3 and performed major
structural refactoring based on user feedback.

### Commits

1. **`046a9f3` — Phase 4 review: critical fixes**

   - Created `input/auth-access-analyzer.ts` to eliminate the
     import from old `generate/` directory (no-imports rule)
   - Fixed `S3Generator.extractFunctionS3Access` to use async
     `gen1App.readCloudBackendFile()` instead of sync
     `require('fs').readFileSync`
   - Coding guideline fixes: multi-line JSDoc in
     analytics.renderer.ts, blank line in gen1-app.ts, removed
     stale duplicate JSDoc in kinesis-cfn-converter.ts

2. **`a4d09fb` — Eliminate shared mutable state**

   - Removed `functionNamesAndCategories` shared mutable map
   - Added `fetchFunctionCategoryMap()` and
     `fetchFunctionNames()` to Gen1App (derived from meta,
     cached)
   - S3Renderer takes Gen1App, does its own category lookups
   - RestApiGenerator uses `gen1App.fetchFunctionNames()`
   - Made `appId`/`backendEnvironmentName` constructor args on
     FunctionsRenderer
   - Moved `buildFunctionDefinitions` into AuthGenerator
   - Simplified prepareNew

3. **`e9870dd` — FunctionGenerator per-function + cleanup**
   - FunctionGenerator implements Generator with flat `plan()`
   - prepareNew creates one FunctionGenerator per function
     resource name — just reads meta keys and instantiates
   - Removed `resourceMeta` and `category` from constructor
     (derivable from Gen1App)
   - `resolve()` throws on missing deployed name or config
     (invariant violations, not valid states)
   - Renamed FunctionsRenderer → FunctionRenderer, files
     `functions.*` → `function.*`
   - Removed dead code: `renderResourceTsFilesForFunction`,
     `ResourceTsParametersList`, `renderExportStatementsForFunctions`
   - Fixed stale JSDoc on S3Renderer ("Pure — no AWS calls")
   - Removed stale file-level comment in auth.renderer.ts
   - Updated 3 snapshot expected outputs (cosmetic reordering)

### Key Design Decisions

**functionNamesAndCategories eliminated.** The shared mutable
map was replaced by `Gen1App.fetchFunctionCategoryMap()` and
`Gen1App.fetchFunctionNames()`. S3Renderer and RestApiGenerator
query Gen1App directly instead of receiving a pre-built map.

**FunctionGenerator handles one function.** prepareNew iterates
`Object.keys(meta.function)` and creates one FunctionGenerator
per key. Each generator derives its own metadata and category
from Gen1App. No cross-function logic needed — storage table
grants and DynamoDB triggers are per-function.

**Constructor args should be derivable.** `resourceMeta` and
`category` were removed from FunctionGenerator's constructor
because they can be fetched from Gen1App using `resourceName`.
This reduces caller burden.

**Silent returns for invariant violations are bugs.** When
`resolve()` returned `undefined` for missing deployed names or
configs, `plan()` silently returned `[]`. These are invariant
violations (the function exists in meta, so it must have a
deployed name) and should throw.

**ResolvedFunction interface kept.** Despite being a private
interface used only within one file, it documents the shape of
resolved data consumed by multiple private methods. Removing it
would require either mutable instance state or anonymous types.

### What I Got Right

- Identified the `functionNamesAndCategories` map as the root
  cause of complexity in prepareNew
- Proposed Gen1App as the right home for category map and
  function names (data derived from meta, cached)
- Recognized that cross-function logic (storage table grants,
  DynamoDB triggers) was actually per-function
- Caught the stale "Pure — no AWS calls" JSDoc on S3Renderer
- Found and removed ~65 lines of dead code in resource.ts

### Where I Needed Steering

**FunctionsGenerator → FunctionGenerator wasn't just a rename.**
I initially renamed the class but kept it handling all functions.
The user had to point out that prepareNew should instantiate
multiple generators, one per function.

**FunctionOperations grouping was over-engineering.** I created
a `FunctionOperations` interface to preserve backend.ts statement
ordering across functions. The user correctly said FunctionGenerator
should just implement Generator with a flat `plan()` — the
ordering change is cosmetic and snapshots can be updated.

**resourceMeta as constructor arg was unnecessary burden.** The
user pointed out that FunctionGenerator has Gen1App and can
derive resourceMeta from resourceName. Same for category.

**Silent returns violate coding guidelines.** The user caught
that `plan()` returning `[]` when `resolve()` returns `undefined`
violates "Only return fallbacks for valid states." If the function
is in meta, it must be resolvable.

### Remaining Items

The following were reviewed and intentionally left as-is:

- `BackendGenerator.earlyStatements` — pragmatic ordering
  solution, alternatives add more complexity
- Auth operation splitting (`lateAuthOperations`) — ordering
  constraint for provider setup after storage overrides
- `contributeProviderSetup` verbosity — inherent to TS
  compiler API
- `extractFilePathFromHandler` duplication in auth.generator.ts
  and function.generator.ts — acceptable per guidelines
  (independent modules)

---

## Session 5 — Phase 4 (Implementation Simplification)

### Session Overview

Continued Phase 4: questioned implementation methods inherited
from the old code and simplified where constraints no longer
exist.

### Commits

1. **`9a66344` — Replace ENV_VAR_PATTERNS regex pipeline**

   Replaced the regex-match → placeholder-substitution →
   string-to-AST pipeline with `classifyEnvVars()`, which
   does a single-pass suffix-based dispatch that builds AST
   nodes directly. Removed ENV_VAR_PATTERNS, FILTERED_ENV_SUFFIXES,
   STORAGE_ENV_SUFFIXES, AUTH_ENV_SUFFIXES, filterResourceEnvVars,
   generateLambdaEnvVars, buildBackendExpression,
   buildDirectExpression. Added classifyEnvVars,
   createAddEnvironmentCall, backendPath, backendTableProp,
   directProp, nonNull, extractStorageVarName. Changed
   ResolvedFunction.filteredEnvironmentVariables to
   escapeHatches: readonly EnvVarEscapeHatch[].

2. **`b9ab5ae` — Simplify backend.generator and prepare.ts**

   BackendGenerator.addImport() now merges identifiers into
   existing entries instead of creating duplicates. Extracted
   import sorting into standalone importOrder() function.
   Simplified prepare.ts: replaced mutable
   lateAuthOperations/lateAuthInserted tracking with a
   synthetic lateAuthGenerator inserted at the right position.
   Replaced duplicate pathExists() with delegation to
   fileOrDirectoryExists(). Removed dead constructor params
   from RootPackageJsonGenerator.

### Key Design Decisions

**ENV_VAR_PATTERNS was unnecessary indirection.** The old code
encoded backend.ts paths as regex patterns because the function
generator didn't have direct access to BackendGenerator. Now
each FunctionGenerator has BackendGenerator directly, so the
env var → Gen2 expression mapping can be done with direct AST
construction per suffix, not regex matching + placeholder
substitution + string-to-AST conversion.

**Import merging eliminates sorting complexity.** The old
addImport() created separate entries for the same source,
requiring the sorting logic to distinguish between e.g.
aws-cdk-lib with Duration vs aws-cdk-lib with Stack. Merging
into a single entry per source makes sorting trivial.

**lateAuthOperations replaced with generator ordering.** Instead
of tracking mutable state (lateAuthInserted boolean) and
conditionally interleaving operations during collection, the
late auth operations are wrapped as a synthetic generator and
inserted at the right position in the generators list.

### What Was Reviewed and Left As-Is

- **AuthDefinition intermediate type** — justified as a
  rendering contract. The adapter normalizes SDK types once,
  the renderer consumes a clean interface. Removing it would
  scatter SDK knowledge through the renderer.
- **CLIV1Permission mapping in s3.generator.ts** — simple,
  clean, 3 entries. No simplification needed.
- **extractFunctionS3Access CFN parsing** — necessary for
  detecting S3 permissions. Same pattern as extractCfnPermissions
  in function.generator.ts but for different action types.
  Duplication between independent modules is acceptable per
  coding guidelines.
- **earlyStatements in BackendGenerator** — 4 lines, used in
  one place (DynamoDB tables). Alternatives add more complexity.
- **contributeProviderSetup verbosity** — inherent to TS
  compiler API. The code pattern is fixed (doesn't vary per
  app), but mixing raw strings with AST construction would be
  inconsistent.
- **Post-processing regex in auth.generator.ts** — cosmetic
  fixes for generated code. Fixing at the AST level would be
  complex for marginal benefit.
- **Infrastructure generators** (amplify-yml, gitignore,
  tsconfig, backend-package-json) — all clean and minimal.
- **REST API renderer** — complex but inherently so (CDK
  construct generation for API Gateway).
- **Analytics/Kinesis converter** — complex but inherently so
  (CFN-to-CDK conversion).

---

## Next Session Prompt

Copy everything below the line into the chat to continue.

---

We're refactoring the `generate` command in the Amplify CLI
Gen1→Gen2 migration tool, following `REFACTORING_GENERATE.md`.
We completed Phases 1–4. All 7 snapshot tests pass.

Continue to Phase 5 — Cleanup. Delete the old `generate/`
directory and rename `generate-new/` to `generate/`. Write
unit tests for the new classes that cover the same ground as
the old tests — don't port them mechanically, but ensure
equivalent coverage. Delete the old tests along with the old
code.

Test command:

```
cd packages/amplify-cli
npx jest --testPathPattern="command-handlers.test" --no-coverage
```
