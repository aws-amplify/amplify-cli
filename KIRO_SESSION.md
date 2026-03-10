# Kiro Session Retrospective

## Session Overview

Refactoring the `generate` command in the Amplify CLI Gen1→Gen2
migration tool. The work followed a phased plan documented in
`REFACTORING_GENERATE.md`. This session covered Phase 1
(foundation) and Phase 2 (category migration).

## What I Got Right

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

**Extracting `prepareSchema` to eliminate `let`.** When the user
pointed out the `let schema` variable, I correctly identified
that extracting a function would allow `const` destructuring.

**Making `tableMappings` required and purifying the renderer.**
I correctly identified that the rendering function shouldn't make
AWS calls and moved the table mapping resolution to the generator.

## Where I Needed Steering

**File truncation bugs.** The `gen1-app.ts` file was corrupted
during my first write (truncated mid-method). This happened again
with `storage.generator.ts`. Both times the user caught it. I
should have verified file integrity after every large write
operation by reading the file back.

**Coding guideline violations on first pass.** The user had to
point out multiple guideline violations that I should have caught
myself:

- Missing visibility modifiers (`public`/`private`)
- Single-line JSDoc instead of multi-line
- Missing `readonly` on interface properties
- Using `assert()` instead of proper error throws
- Unused imports

This led to the user adding a self-review instruction to
AGENTS.md: review your own diff against coding guidelines before
committing.

**Importing from the old `generate/` directory.** I initially
imported pure rendering functions from the old code, arguing they
were stateless and would move during Phase 4. The user correctly
pushed back — the old code might change, and this was an
opportunity to simplify, not just relocate. Code duplication was
acceptable since both directories wouldn't coexist long-term.

**Not making REST API its own generator.** When I first
implemented the data category, I lumped REST APIs together with
AppSync under a single `DataGenerator`. The user pointed out
these are fundamentally different services that should be separate
generators. This was obvious in hindsight — the refactoring plan
even said "dispatches by service (AppSync, API Gateway)."

**Schema reading belonged in Gen1App.** I created a standalone
`graphql-schema-reader.ts` file, but the user correctly noted
that reading the GraphQL schema is local Gen1 app state — just
like `amplify-meta.json` — and belongs in `Gen1App`.

**The `DataDefinitionFetcher` class was unnecessary.** I
duplicated the old fetcher class wholesale. The user pointed out
it had no meaningful state and was just wrapping logic that
belonged in standalone functions and the generator itself.

**`GenerateDataSourceOptions.schema` was optional when it
shouldn't have been.** The user caught that if there's no schema,
we shouldn't even be calling the rendering function. This was a
direct violation of guideline 9a (optional at boundary, required
downstream) that I should have caught.

**`if (apiId)` guarded an impossible state.** The user pointed
out that if we found an AppSync API entry in amplify-meta.json,
the apiId must exist. The `if` guard was silently skipping work
on an impossible state instead of throwing.

**`findAppSyncApiId` was redundant.** I implemented a method to
scan all AppSync APIs by environment tags, but the user noted
that `GraphQLAPIIdOutput` from amplify-meta.json already provides
the same value. I was solving a problem that didn't exist.

**Dynamic `import()` expressions for types.** I used
`import('@aws-amplify/backend-data').AuthorizationModes` in type
positions. The user said to use `any` since the data comes from
untyped JSON.

**Renderer options in constructor vs render method.** I initially
passed `RenderDefineDataOptions` to the `DataRenderer`
constructor. The user correctly said options should go to
`render()`, while known values (like `envName`) belong in the
constructor.

**The `renderDefineData` convenience function was unnecessary.**
After creating the `DataRenderer` class, I kept a free function
wrapper. The user said to remove it — callers should use the
class directly.

**`cdk-from-cfn.ts` was a bad name.** The user pointed out the
name was cryptic and the file instantiated its own S3 client
instead of using the centralized one.

**`auth-adapter.ts` shouldn't have existed.** I duplicated the
old adapter as a separate file. The user noted this was an
unjustified layer boundary — the data pattern doesn't have an
adapter, so auth shouldn't either.

**`lambda.ts` and `function-types.ts` were unnecessary files.**
Single-function files and catch-all type files that should have
been inlined into the renderer.

**`rest-api-reader.ts` belonged in Gen1App.** Same pattern as
the schema reader — local file reading is Gen1App's job.

## Patterns That Emerged

**The user teaches through the data category, then expects the
pattern applied everywhere.** We spent significant time refining
the data generator/renderer, and then the user expected me to
apply the same pattern to all other categories without being told
each specific change.

**Guidelines are discovered iteratively.** Several coding
guidelines were added during the session based on problems we
encountered:

- Point 16 broadened (impossible states)
- Point 30 (readable call chains)
- Point 31 (visibility modifiers)
- Point 32 (no dynamic imports)
- Point 33 (multi-line JSDoc)
- Point 34 (known values in constructor)
- Point 35 (blank lines after documented members)

**The user values design over correctness at this stage.** When I
suggested deferring should-fix items to Phase 4, the user said
the point of Phase 2 is ensuring the design is solid —
correctness is validated in Phase 3 with snapshot tests.

**Self-review before committing is essential.** The user had to
catch too many guideline violations that I should have found
myself. The instruction to review diffs against coding guidelines
was added to AGENTS.md as a result.

## What I Would Do Differently

1. **Verify file integrity after every large write.** Read the
   file back and check diagnostics immediately, don't trust the
   write succeeded.

2. **Apply the established pattern proactively.** When a pattern
   is established in one category, apply it to all others without
   waiting to be told.

3. **Challenge my own design decisions against the guidelines
   before presenting them.** Many of the issues the user caught
   were things I could have caught by re-reading the coding
   guidelines before committing.

4. **Don't duplicate old code structure blindly.** The old code
   had adapters, fetchers, and type files that existed for
   historical reasons. The refactoring is an opportunity to
   simplify, not replicate.

5. **Ask "does this belong here?" for every file and function.**
   Schema reading, REST API config reading, and other local file
   operations consistently belonged in Gen1App, not in standalone
   files. I should have recognized this pattern earlier.

6. **Push back more on my own decisions.** The AGENTS.md
   collaboration style section says to state opinions and push
   back. I should apply this to my own work too — question
   whether each abstraction earns its existence.

## Context Window Management

Near the end of the session, the user noticed my context usage
was high, responses were slower, and accuracy was dropping. They
asked me to summarize the session to compact the context window
to ~20% for a new session.

I provided a summary but incorrectly stated "What's next" as
Phase 3 (switch over). The user corrected me — we still need to
finish reviewing Phase 2 before moving on. I then suggested
running diagnostics, but the user just wanted the summary to
start a fresh session.

**Lesson:** When the user asks for a summary to continue in a new
session, give them exactly that — don't add unsolicited next
steps or offer to do more work. Also, be accurate about the
current state: we're still in Phase 2 review, not ready for
Phase 3.
