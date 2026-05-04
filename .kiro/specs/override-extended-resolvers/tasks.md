# Implementation Plan: Override & Extended Resolvers

## Overview

Implement support for migrating Gen1 custom AppSync VTL resolver files (override and extended) to Gen2 CDK code during the `gen2-migration generate` step. The implementation follows a bottom-up approach: first build the pure utility module, then extend the renderer, then wire everything together in the generator.

## Tasks

- [x] 1. Create `resolver-utils.ts` with types, constants, and pure functions

  - [x] 1.1 Define types and slot constants

    - Create new file `packages/amplify-cli/src/commands/gen2-migration/generate/amplify/data/resolver-utils.ts`
    - Define `ParsedOverride`, `ParsedExtended`, `ParsedVtl`, `ClassifiedVtlFiles`, `ExtendedResolverGroup`, `SpliceEntry`, and `PipelineSpliceResult` interfaces
    - Define `QUERY_SLOTS`, `MUTATION_SLOTS`, `SUBSCRIPTION_SLOTS`, `ALL_SLOTS` constant arrays
    - Define `PIPELINE_3_SLOT_MAP` and `PIPELINE_4_SLOT_MAP` record constants mapping slot names to base pipeline indexes
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.1, 8.2_

  - [x] 1.2 Implement `parseVtlFilename` function

    - Split filename on `.`, return `ParsedOverride` for 4 segments, `ParsedExtended` for 6 segments, `undefined` otherwise
    - For extended: parse typeName, fieldName, slot, order (as number), and templateType from segments
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.3 Implement `validateSlot` function

    - Look up valid slots by typeName: `Query` → `QUERY_SLOTS`, `Mutation` → `MUTATION_SLOTS`, `Subscription` → `SUBSCRIPTION_SLOTS`, other → `ALL_SLOTS`
    - Throw descriptive error naming the invalid slot, the filename, and listing valid slots for that typeName
    - _Requirements: 2.5, 3.1, 3.2, 3.3, 3.4_

  - [x] 1.4 Implement `classifyVtlFiles` function

    - Iterate filenames, call `parseVtlFilename`, validate slots for extended resolvers, check for non-numeric order segments, detect duplicates (same typeName+fieldName+slot+order+templateType)
    - Throw descriptive errors for non-numeric order (Req 2.6) and duplicates (Req 2.7)
    - Return `ClassifiedVtlFiles` with separate `overrides` and `extended` arrays
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_

  - [x] 1.5 Implement `groupExtendedResolvers` function

    - Group `ParsedExtended` entries by `${typeName}.${fieldName}`
    - Within each group, sort by slot pipeline execution order then by numeric order
    - Pair request/response templates for the same slot+order combination into `ExtendedResolverGroup` objects
    - _Requirements: 7.7_

  - [x] 1.6 Implement `computeSpliceIndexes` function
    - Select 3-function or 4-function pipeline map based on typeName/fieldName (Query/Subscription/delete-Mutation → 3-function, other Mutation → 4-function, other → 4-function)
    - For each group, compute `spliceIndex = baseSlotMap[group.slot] + runningOffset`, incrementing `runningOffset` after each entry
    - Return `PipelineSpliceResult` with typeName, fieldName, and entries
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Checkpoint - Verify resolver-utils compiles

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Add property-based tests for `resolver-utils.ts`

  - [x]\* 3.1 Write property test: VTL Filename Classification

    - **Property 1: VTL Filename Classification**
    - For any VTL filename, `parseVtlFilename` returns `kind: 'override'` for 4 segments, `kind: 'extended'` for 6 segments, `undefined` otherwise
    - Create file `packages/amplify-cli/src/__tests__/commands/gen2-migration/generate/amplify/data/resolver-utils.test.ts`
    - Use fast-check with minimum 100 iterations
    - **Validates: Requirements 2.1, 2.2, 2.3**

  - [ ]\* 3.2 Write property test: Extended Resolver Parse Round-Trip

    - **Property 2: Extended Resolver Parse Round-Trip**
    - For any valid (typeName, fieldName, slot, order, templateType), constructing the filename and parsing it produces matching fields
    - **Validates: Requirements 2.4**

  - [ ]\* 3.3 Write property test: Slot Validation Correctness

    - **Property 3: Slot Validation Correctness**
    - `validateSlot` accepts a slot without throwing iff the slot is in the valid set for that typeName
    - **Validates: Requirements 2.5, 3.1, 3.2, 3.3, 3.4**

  - [ ]\* 3.4 Write property test: Non-Numeric Order Rejection

    - **Property 4: Non-Numeric Order Rejection**
    - For any 6-segment VTL filename where the order segment is not a valid non-negative integer, `classifyVtlFiles` throws
    - **Validates: Requirements 2.6**

  - [ ]\* 3.5 Write property test: Extended Resolver Grouping Invariants

    - **Property 5: Extended Resolver Grouping Invariants**
    - Groups share the same typeName/fieldName, are sorted by pipeline order then numeric order, and have at most one reqFile and one resFile
    - **Validates: Requirements 7.7**

  - [ ]\* 3.6 Write property test: Splice Index Computation
    - **Property 6: Splice Index Computation**
    - Each entry's spliceIndex equals the base slot index from the correct pipeline map plus the count of preceding entries
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 4. Extend `DataRenderer` with new rendering methods

  - [x] 4.1 Implement `renderNoneDataSource()` method

    - Add method to `DataRenderer` that returns a `ts.Statement` for `const noneDataSource = backend.data.resources.graphqlApi.addNoneDataSource("none")`
    - _Requirements: 7.3_

  - [x] 4.2 Implement `renderAppsyncFunction()` method

    - Add method to `DataRenderer` that renders an `AppsyncFunction` construct for a given `ExtendedResolverGroup`
    - Use `MappingTemplate.fromFile()` for provided VTL files and `MappingTemplate.fromString()` with passthrough templates for missing files
    - Passthrough request: `$util.toJson({})`, passthrough response: `$util.toJson($ctx.prev.result)`
    - _Requirements: 7.4, 7.5, 7.6_

  - [x] 4.3 Implement `renderSpliceStatements()` method
    - Add method to `DataRenderer` that renders splice statements inserting each extended function's `functionId` into the pipeline resolver's function array at the computed splice index
    - Generate reassignment of the resolver's `pipelineConfig` property after all splice operations for a given pipeline resolver
    - _Requirements: 8.4, 8.5_

- [x] 5. Extend `DataGenerator` to discover, classify, and contribute resolver code

  - [x] 5.1 Add VTL file discovery to `DataGenerator.plan()`

    - Read the `resolvers/` directory from the Gen1 cloud backend for `.vtl` files
    - If the directory doesn't exist or has no `.vtl` files, skip all resolver logic
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Add VTL file copy operation

    - Create a new `AmplifyMigrationOperation` that copies all discovered VTL files from Gen1 `amplify/backend/api/<apiName>/resolvers/` to Gen2 `amplify/data/resolvers/`
    - Create the destination directory if it does not exist, preserve original filenames
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 5.3 Contribute common resolver imports and declarations

    - Add imports for `join`/`dirname` from `path`, `fileURLToPath` from `url` to BackendGenerator
    - Add `__dirname` and `resolversDir` declarations via `addPostDefineBackendStatement()`
    - Ensure `applyEscapeHatches` call is registered for the data resource
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 9.1, 9.2, 9.3_

  - [x] 5.4 Contribute override resolver code to BackendGenerator

    - Add import of `readdirSync` from `fs` and namespace import of `aws-cdk-lib/aws-s3-assets` as `assets`
    - Generate `resolverFiles` declaration filtering for 4-segment `.req.vtl`/`.res.vtl` files
    - Generate for-of loop that parses typeName/fieldName, computes `functionId`, looks up `CfnFunctionConfiguration`, creates CDK Asset, and assigns `s3ObjectUrl` to the appropriate mapping template property
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 5.5 Contribute extended resolver code to BackendGenerator
    - Call `classifyVtlFiles()`, `groupExtendedResolvers()`, and `computeSpliceIndexes()` from resolver-utils
    - Add imports for `aws_appsync` from `aws-cdk-lib` and `CfnResolver` from `aws-cdk-lib/aws-appsync`
    - Use `DataRenderer.renderNoneDataSource()`, `renderAppsyncFunction()`, and `renderSpliceStatements()` to generate code
    - Contribute all generated statements via `addPostDefineBackendStatement()`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.4, 8.5_

- [x] 6. Checkpoint - Verify build and existing tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Add unit tests for DataGenerator resolver integration

  - [ ]\* 7.1 Write unit tests for DataGenerator resolver scenarios
    - Add tests to `packages/amplify-cli/src/__tests__/commands/gen2-migration/generate/amplify/data/data.generator.test.ts`
    - Test: no resolvers directory → no resolver operations created
    - Test: empty resolvers directory → no resolver operations created
    - Test: override resolvers only → VTL files copied, correct imports contributed, override loop code contributed, `applyEscapeHatches` registered
    - Test: extended resolvers only → VTL files copied, correct imports contributed, `noneDataSource` declaration, `AppsyncFunction` constructs, splice statements generated
    - Test: mixed override and extended → both code paths execute
    - Test: extended resolver with only req file → passthrough response template used
    - Test: extended resolver with only res file → passthrough request template used
    - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [x] 8. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design's Correctness Properties section
- Unit tests validate specific examples and edge cases for the DataGenerator integration
- The implementation language is TypeScript, matching the existing codebase
- The project uses Jest for testing and fast-check for property-based tests
- All code must follow existing patterns in the codebase (see CODING_GUIDELINES.md and AGENTS.md)
