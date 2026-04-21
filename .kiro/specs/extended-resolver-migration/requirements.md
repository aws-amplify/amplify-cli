# Requirements Document

## Introduction

The gen2-migration `generate` step currently handles **override resolvers** — VTL files named `{TypeName}.{fieldName}.req.vtl` / `{TypeName}.{fieldName}.res.vtl` that replace the DataResolverFn's mapping templates. This feature adds support for **extended resolvers** — custom AppSync functions placed at specific slots within pipeline resolvers. Extended resolvers follow the naming convention `{TypeName}.{fieldName}.{slot}.{order}.{req|res}.vtl` and must be spliced into the existing pipeline at computed positions based on slot and order.

## Glossary

- **Extended_Resolver**: A custom AppSync function placed at a specific slot within a pipeline resolver, identified by VTL files matching the pattern `{TypeName}.{fieldName}.{slot}.{order}.{req|res}.vtl`.
- **Override_Resolver**: An existing resolver type that replaces the DataResolverFn's mapping templates, identified by VTL files matching the pattern `{TypeName}.{fieldName}.req.vtl` / `{TypeName}.{fieldName}.res.vtl`.
- **Slot**: A named position within a pipeline resolver that determines where an Extended_Resolver function is inserted. Valid slots include `init`, `preAuth`, `auth`, `postAuth`, `preDataLoad`, `postDataLoad`, `preUpdate`, `postUpdate`, and `finish`.
- **Order**: A numeric value in the VTL filename that determines the sequence of Extended_Resolver functions within the same Slot.
- **Pipeline_Resolver**: An AppSync resolver composed of an ordered list of functions (auth0, postAuth0, DataResolverFn) that execute sequentially.
- **DataGenerator**: The class in `data.generator.ts` that orchestrates AppSync/GraphQL data resource generation and contributes to backend.ts.
- **DataRenderer**: The class in `data.renderer.ts` that performs pure AST construction from typed options, producing TypeScript AST nodes.
- **BackendGenerator**: The accumulator that collects imports, statements, and properties from all category generators and writes backend.ts.
- **None_Data_Source**: An AppSync data source with no backing service, used by Extended_Resolver functions that perform logic without querying a database.
- **VTL_File**: A Velocity Template Language file containing request or response mapping template logic for an AppSync resolver function.
- **Splice_Index**: The computed position in the `pipelineConfig.functions` array where an Extended_Resolver function is inserted, accounting for prior insertions that shift subsequent indexes.

## Requirements

### Requirement 1: Parse Extended Resolver Filenames

**User Story:** As a migration tool developer, I want the tool to parse extended resolver VTL filenames, so that it can distinguish them from override resolvers and extract the type name, field name, slot, and order.

#### Acceptance Criteria

1. WHEN a VTL file in the resolvers directory matches the pattern `{TypeName}.{fieldName}.{slot}.{order}.req.vtl` or `{TypeName}.{fieldName}.{slot}.{order}.res.vtl`, THE DataGenerator SHALL classify the file as an Extended_Resolver.
2. WHEN a VTL file in the resolvers directory matches the pattern `{TypeName}.{fieldName}.req.vtl` or `{TypeName}.{fieldName}.res.vtl` (exactly two dot-separated segments before the template suffix), THE DataGenerator SHALL classify the file as an Override_Resolver.
3. WHEN the DataGenerator parses an Extended_Resolver filename, THE DataGenerator SHALL extract the TypeName, fieldName, Slot, and Order as separate values.
4. IF a VTL file has an unrecognized Slot value, THEN THE DataGenerator SHALL report a descriptive error identifying the filename and the invalid slot.
5. FOR ALL valid Extended_Resolver filenames, parsing then reconstructing the filename from extracted components SHALL produce the original filename (round-trip property).

### Requirement 2: Group Extended Resolvers by Pipeline Resolver and Slot

**User Story:** As a migration tool developer, I want extended resolvers grouped by their target pipeline resolver and slot, so that the tool can generate the correct number of AppSync functions and insert them at the right positions.

#### Acceptance Criteria

1. THE DataGenerator SHALL group Extended_Resolver files by their TypeName and fieldName combination to identify which Pipeline_Resolver each function belongs to.
2. THE DataGenerator SHALL sort Extended_Resolver files within each Slot by their Order value in ascending numeric order.
3. WHEN two Extended_Resolver files share the same TypeName, fieldName, Slot, and Order but differ in template type (req vs res), THE DataGenerator SHALL treat them as the request and response templates of a single AppSync function.
4. WHEN an Extended_Resolver has only a request template or only a response template, THE DataGenerator SHALL pair it with a default counterpart: missing request template defaults to `$util.toJson({})`, missing response template defaults to `$util.toJson($ctx.prev.result)`.

### Requirement 3: Generate None Data Source Declaration

**User Story:** As a migration tool developer, I want the tool to generate a None_Data_Source declaration in backend.ts, so that extended resolver functions have a data source to reference.

#### Acceptance Criteria

1. WHEN at least one Extended_Resolver file exists, THE DataGenerator SHALL contribute a statement to BackendGenerator that creates a None_Data_Source from `backend.data.resources.graphqlApi.addNoneDataSource('none')`.
2. WHILE no Extended_Resolver files exist, THE DataGenerator SHALL NOT generate a None_Data_Source declaration.
3. THE DataGenerator SHALL generate the None_Data_Source declaration exactly once, regardless of how many Extended_Resolver files exist.

### Requirement 4: Generate AppsyncFunction for Each Extended Resolver

**User Story:** As a migration tool developer, I want the tool to generate an `aws_appsync.AppsyncFunction` for each extended resolver, so that the VTL logic is loaded into the pipeline.

#### Acceptance Criteria

1. WHEN an Extended_Resolver has both a request and response VTL_File, THE DataRenderer SHALL generate an `aws_appsync.AppsyncFunction` that loads both templates via `MappingTemplate.fromFile()`.
2. WHEN an Extended_Resolver has only a request VTL_File, THE DataRenderer SHALL generate an `aws_appsync.AppsyncFunction` with the request template loaded via `MappingTemplate.fromFile()` and the response template set to `MappingTemplate.fromString('$util.toJson($ctx.prev.result)')`.
3. WHEN an Extended_Resolver has only a response VTL_File, THE DataRenderer SHALL generate an `aws_appsync.AppsyncFunction` with the response template loaded via `MappingTemplate.fromFile()` and the request template set to `MappingTemplate.fromString('$util.toJson({})')`.
4. THE DataRenderer SHALL set the `dataSource` property of each generated AppsyncFunction to the None_Data_Source.
5. THE DataRenderer SHALL generate a unique construct name for each AppsyncFunction derived from the TypeName, fieldName, Slot, and Order.

### Requirement 5: Compute Splice Indexes for Pipeline Insertion

**User Story:** As a migration tool developer, I want the tool to compute the correct splice index for each extended resolver function, so that functions are inserted at the right position in the pipeline.

#### Acceptance Criteria

1. THE DataGenerator SHALL map each Slot to a base index relative to the default Pipeline_Resolver structure (auth0 at index 0, postAuth0 at index 1, DataResolverFn at index 2).
2. WHEN multiple Extended_Resolver functions target the same Pipeline_Resolver, THE DataGenerator SHALL account for prior splice operations shifting subsequent indexes by incrementing the Splice_Index for each insertion.
3. WHEN Extended_Resolver functions target different Slots within the same Pipeline_Resolver, THE DataGenerator SHALL process Slots in pipeline order (init, preAuth, auth, postAuth, preDataLoad, postDataLoad, preUpdate, postUpdate, finish) so that earlier insertions correctly shift later indexes.
4. FOR ALL computed Splice_Indexes, the resulting pipeline function order SHALL preserve the relative ordering of the three default functions (auth0, postAuth0, DataResolverFn) while placing Extended_Resolver functions at their designated Slot positions.

### Requirement 6: Generate Pipeline Splice Statements

**User Story:** As a migration tool developer, I want the tool to generate `splice()` calls that insert extended resolver functions into the pipeline, so that the deployed resolver executes functions in the correct order.

#### Acceptance Criteria

1. WHEN Extended_Resolver functions exist for a Pipeline_Resolver, THE DataRenderer SHALL generate `pipelineConfig.functions.splice(index, 0, fn)` statements for each function at its computed Splice_Index.
2. THE DataRenderer SHALL generate splice statements in insertion order (lowest Splice_Index first within each Pipeline_Resolver) so that index calculations remain valid.
3. THE DataRenderer SHALL access the pipeline resolver's function list via `backend.data.resources.cfnResources.cfnResolvers['{TypeName}{FieldName}Resolver'].pipelineConfig.functions`.

### Requirement 7: Maintain Backward Compatibility with Override Resolvers

**User Story:** As a migration tool developer, I want override resolvers to continue working alongside extended resolvers, so that existing migrations are not broken.

#### Acceptance Criteria

1. WHEN both Override_Resolver and Extended_Resolver files exist for the same TypeName and fieldName, THE DataGenerator SHALL apply both: the Override_Resolver replaces the DataResolverFn mapping templates, and the Extended_Resolver functions are spliced into the pipeline.
2. WHEN only Override_Resolver files exist (no Extended_Resolver files), THE DataGenerator SHALL produce identical output to the current implementation.
3. WHEN only Extended_Resolver files exist (no Override_Resolver files), THE DataGenerator SHALL generate the extended resolver code without generating override resolver code for that field.

### Requirement 8: Copy Extended Resolver VTL Files to Output Directory

**User Story:** As a migration tool developer, I want extended resolver VTL files copied to the Gen2 output directory alongside override resolver files, so that the generated code can reference them at deploy time.

#### Acceptance Criteria

1. WHEN Extended_Resolver VTL files exist, THE DataGenerator SHALL copy them from the Gen1 resolvers directory to `amplify/data/resolvers/` in the output directory.
2. THE DataGenerator SHALL preserve the original filenames of Extended_Resolver VTL files during the copy operation.
3. THE DataGenerator SHALL copy both Override_Resolver and Extended_Resolver VTL files in the same copy operation.

### Requirement 9: Add Required CDK Imports for Extended Resolvers

**User Story:** As a migration tool developer, I want the generated backend.ts to include the necessary CDK imports for extended resolvers, so that the generated code compiles without errors.

#### Acceptance Criteria

1. WHEN Extended_Resolver files exist, THE DataGenerator SHALL contribute an import for `aws_appsync` from `aws-cdk-lib` to BackendGenerator.
2. WHEN Extended_Resolver files exist, THE DataGenerator SHALL contribute an import for `MappingTemplate` from the appropriate AppSync CDK module to BackendGenerator.
3. WHILE no Extended_Resolver files exist, THE DataGenerator SHALL NOT add AppSync-specific imports to BackendGenerator.

### Requirement 10: Follow Generator/Renderer Architecture

**User Story:** As a migration tool developer, I want the extended resolver implementation to follow the existing generator/renderer split, so that the codebase remains consistent and testable.

#### Acceptance Criteria

1. THE DataGenerator SHALL handle orchestration: discovering extended resolver files, grouping them, computing splice indexes, and contributing statements to BackendGenerator.
2. THE DataRenderer SHALL handle pure AST construction: generating AppsyncFunction nodes, splice call nodes, and None_Data_Source declaration nodes from typed options.
3. THE DataRenderer SHALL accept extended resolver options through a typed interface with readonly properties, consistent with the existing `RenderDefineDataOptions` pattern.
