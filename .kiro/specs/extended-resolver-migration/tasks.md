# Implementation Plan: Extended Resolver Migration

## Overview

Extend the existing `DataGenerator` and `DataRenderer` to support extended resolver VTL files (`{TypeName}.{fieldName}.{slot}.{order}.{req|res}.vtl`). The implementation adds filename parsing, classification, grouping, splice index computation, and AST rendering for `AppsyncFunction` constructs and pipeline splice statements — all within the existing two files. Override resolvers continue to work unchanged.

## Tasks

- [x] 1. Add interfaces and constants for extended resolvers in DataGenerator

  - [x] 1.1 Define the `Slot` type, `VALID_SLOTS` array, and `SLOT_BASE_INDEX` mapping in `data.generator.ts`

    - Add `VALID_SLOTS` as a `const` array of the 9 valid slot names in pipeline order
    - Add `Slot` type derived from `typeof VALID_SLOTS[number]`
    - Add `SLOT_BASE_INDEX` as a `Record<Slot, number>` mapping each slot to its base insertion index
    - _Requirements: 5.1_

  - [x] 1.2 Define the `ExtendedResolverDescriptor`, `ExtendedResolverFunction`, `PipelineResolverGroup`, and `ClassifiedResolvers` interfaces in `data.generator.ts`
    - `ExtendedResolverDescriptor`: readonly properties for typeName, fieldName, slot, order, templateType, filename
    - `ExtendedResolverFunction`: readonly properties for typeName, fieldName, slot, order, requestFile, responseFile
    - `PipelineResolverGroup`: readonly properties for typeName, fieldName, functions array
    - `ClassifiedResolvers`: readonly properties for overrideFiles and extendedDescriptors arrays
    - _Requirements: 10.1, 10.3_

- [x] 2. Implement filename parsing and classification functions

  - [x] 2.1 Implement `parseExtendedResolverFilename()` pure function in `data.generator.ts`

    - Split filename on `.`, validate segment count (6 for extended)
    - Validate slot against `VALID_SLOTS`, throw descriptive error for invalid slots
    - Validate order is numeric, throw descriptive error for non-numeric values
    - Return `ExtendedResolverDescriptor` with all extracted components
    - _Requirements: 1.3, 1.4, 1.5_

  - [x] 2.2 Implement `classifyResolverFiles()` pure function in `data.generator.ts`

    - Classify each VTL filename by segment count: 4 segments → override, 6 segments → extended
    - Parse extended filenames via `parseExtendedResolverFilename()`
    - Detect and throw on duplicate (typeName, fieldName, slot, order, templateType) combinations
    - Return `ClassifiedResolvers` with both lists
    - _Requirements: 1.1, 1.2_

  - [ ]\* 2.3 Write property tests for filename parsing (Properties 1–3)

    - **Property 1: Filename round-trip** — For any valid (typeName, fieldName, slot, order, templateType), constructing a filename and parsing it back produces the original components
    - **Validates: Requirements 1.3, 1.5**
    - **Property 2: Classification correctness** — 6-segment filenames are classified as extended, 4-segment as override
    - **Validates: Requirements 1.1, 1.2**
    - **Property 3: Invalid slot rejection** — Non-slot strings in the slot position produce an error containing the filename and invalid slot
    - **Validates: Requirements 1.4**
    - Use `fast-check` with 100+ iterations per property

  - [ ]\* 2.4 Write unit tests for `parseExtendedResolverFilename()` and `classifyResolverFiles()`
    - Test valid extended resolver filenames with various slots and orders
    - Test override resolver filenames are correctly classified
    - Test error cases: invalid slot, non-numeric order, duplicate templates
    - Test mixed sets of override and extended files
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Implement grouping and splice index computation

  - [x] 3.1 Implement `groupExtendedResolvers()` pure function in `data.generator.ts`

    - Group `ExtendedResolverDescriptor[]` by (typeName, fieldName) into `PipelineResolverGroup[]`
    - Within each group, sort by slot pipeline order then by numeric order
    - Pair request and response templates for the same (typeName, fieldName, slot, order) into `ExtendedResolverFunction`
    - Apply defaults: missing request → `undefined` requestFile, missing response → `undefined` responseFile
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Implement `computeSpliceIndexes()` pure function in `data.generator.ts`

    - Accept a `PipelineResolverGroup` and return functions with computed splice indexes
    - Process functions in pipeline order (by slot, then order within slot)
    - Track a running offset that increments for each insertion before the current base index
    - Compute each splice index as `baseIndex(slot) + offset`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]\* 3.3 Write property tests for grouping and splice computation (Properties 4–5, 9–10)

    - **Property 4: Grouping and sorting invariant** — After grouping, each group contains only matching (typeName, fieldName) and within each slot descriptors are in ascending order
    - **Validates: Requirements 2.1, 2.2**
    - **Property 5: Template pairing completeness** — After pairing, every function has both requestFile and responseFile accounted for, and same (typeName, fieldName, slot, order) descriptors merge into exactly one function
    - **Validates: Requirements 2.3, 2.4**
    - **Property 9: Pipeline order preservation** — After simulating all splice operations on `[auth0, postAuth0, DataResolverFn]`, the three defaults remain in original relative order
    - **Validates: Requirements 5.2, 5.4**
    - **Property 10: Splice statement ordering** — Generated splice indexes are in ascending order with exactly one per function
    - **Validates: Requirements 6.1, 6.2**
    - Use `fast-check` with 100+ iterations per property

  - [ ]\* 3.4 Write unit tests for `groupExtendedResolvers()` and `computeSpliceIndexes()`
    - Test grouping with multiple (typeName, fieldName) combinations
    - Test sorting within slots by numeric order
    - Test template pairing: both present, request-only, response-only
    - Test splice index computation with single and multiple slots
    - Test splice index offset accumulation across slots
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4_

- [x] 4. Checkpoint

  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Add DataRenderer methods for extended resolver AST construction

  - [x] 5.1 Define `RenderExtendedResolverOptions` interface in `data.renderer.ts`

    - Readonly interface with a `functions` array containing typeName, fieldName, slot, order, requestFile, responseFile, spliceIndex
    - Follow the existing `RenderDefineDataOptions` pattern
    - _Requirements: 10.3_

  - [x] 5.2 Implement `renderNoneDataSource()` method on `DataRenderer`

    - Return a `const noneDataSource = backend.data.resources.graphqlApi.addNoneDataSource('none')` AST statement
    - _Requirements: 3.1, 3.3_

  - [x] 5.3 Implement `renderAppsyncFunction()` method on `DataRenderer`

    - Accept an extended resolver function descriptor with spliceIndex
    - Generate `const {constructName} = new aws_appsync.AppsyncFunction(backend.data, '{constructName}', { ... })` AST
    - Derive construct name from `{typeName}{fieldName}{slot}{order}` (capitalize first letters)
    - Use `MappingTemplate.fromFile(join(resolversDir, filename))` for present templates
    - Use `MappingTemplate.fromString('$util.toJson({})')` for missing request templates
    - Use `MappingTemplate.fromString('$util.toJson($ctx.prev.result)')` for missing response templates
    - Set `dataSource` to `noneDataSource` and `api` to `backend.data.resources.graphqlApi`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 5.4 Implement `renderSpliceStatements()` method on `DataRenderer`

    - Accept typeName, fieldName, and array of functions with splice indexes and construct names
    - Generate `const {resolverVar} = backend.data.resources.cfnResources.cfnResolvers['{TypeName}{FieldName}Resolver']` AST
    - Generate `const {functionsVar} = ({resolverVar} as CfnResolver).pipelineConfig!.functions as string[]` AST
    - Generate `{functionsVar}.splice({index}, 0, {constructName}.functionId)` for each function in ascending splice index order
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]\* 5.5 Write property tests for renderer methods (Properties 6–8)

    - **Property 6: NoneDataSource conditional uniqueness** — Exactly 1 NoneDataSource declaration when extended resolvers exist, 0 otherwise
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - **Property 7: Template loading correctness** — `fromFile()` used for present templates, `fromString()` with correct default for absent templates
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - **Property 8: Unique construct names** — All generated construct names are unique and contain typeName, fieldName, slot, order
    - **Validates: Requirements 4.5**
    - Use `fast-check` with 100+ iterations per property

  - [ ]\* 5.6 Write unit tests for `renderNoneDataSource()`, `renderAppsyncFunction()`, and `renderSpliceStatements()`
    - Snapshot test `renderNoneDataSource()` output
    - Snapshot test `renderAppsyncFunction()` with both templates, request-only, response-only
    - Snapshot test `renderSpliceStatements()` for single and multiple functions
    - Verify construct name uniqueness across multiple functions
    - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.5, 6.1, 6.2, 6.3_

- [x] 6. Checkpoint

  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Integrate extended resolver orchestration into DataGenerator.plan()

  - [x] 7.1 Update `plan()` to classify VTL files and branch on extended resolvers

    - Replace direct use of `vtlFiles` with `classifyResolverFiles(vtlFiles)` call
    - Pass `overrideFiles` to existing `contributeResolverOverrides()` path
    - When `extendedDescriptors` is non-empty, call `groupExtendedResolvers()` and `computeSpliceIndexes()`
    - _Requirements: 1.1, 1.2, 7.1, 7.2, 7.3_

  - [x] 7.2 Implement `contributeExtendedResolvers()` method on `DataGenerator`

    - Add `aws_appsync` import from `aws-cdk-lib` to BackendGenerator
    - Add `CfnResolver` import from `aws-cdk-lib/aws-appsync` to BackendGenerator
    - Ensure `resolversDir`, `__dirname`, `join`, `dirname`, `fileURLToPath` declarations are shared with override path
    - Call `renderNoneDataSource()` and add statement to BackendGenerator
    - For each function, call `renderAppsyncFunction()` and add statement to BackendGenerator
    - For each pipeline resolver group, call `renderSpliceStatements()` and add statements to BackendGenerator
    - _Requirements: 3.1, 3.2, 3.3, 4.1, 4.4, 6.1, 6.3, 9.1, 9.2, 9.3, 10.1_

  - [x] 7.3 Update the copy operation to include both override and extended VTL files

    - Ensure `createCopyResolversOperation()` receives all VTL files (both override and extended)
    - Preserve original filenames during copy
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]\* 7.4 Write property test for override and extended coexistence (Property 11)

    - **Property 11: Override and extended resolver coexistence** — When both types exist for the same (typeName, fieldName), both override and extended code is generated; when only one type exists, only that type's code is generated
    - **Validates: Requirements 7.1, 7.3**
    - Use `fast-check` with 100+ iterations

  - [ ]\* 7.5 Write unit tests for DataGenerator extended resolver integration
    - Test that extended resolver files trigger NoneDataSource, AppsyncFunction, and splice contributions
    - Test that override-only files produce identical output to current implementation
    - Test that extended-only files generate extended code without override code
    - Test that mixed override + extended files for the same field produce both types of code
    - Test that extended resolver imports (`aws_appsync`, `CfnResolver`) are added only when extended resolvers exist
    - Test error propagation from invalid filenames during `plan()`
    - _Requirements: 3.1, 3.2, 7.1, 7.2, 7.3, 9.1, 9.2, 9.3_

- [x] 8. Final checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases using inline snapshots (matching existing test patterns)
- All new functions are pure and testable in isolation — no new files or layers introduced
- The existing `findResolverVtlFiles()` function continues to discover all `.vtl` files; classification happens downstream
- Follow `CODING_GUIDELINES.md`: readonly interfaces, const over let, no god classes, centralized error handling
