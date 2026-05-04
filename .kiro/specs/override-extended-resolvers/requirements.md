# Requirements Document

## Introduction

The Amplify Gen1-to-Gen2 migration tool's `generate` step must detect and migrate custom AppSync VTL resolver files from Gen1 projects. Gen1 users customize resolvers in two ways: override resolvers (4-segment VTL filenames that replace the default DataResolverFn mapping template) and extended resolvers (6-segment VTL filenames that add new pipeline functions at specific slots). The migration tool must generate the appropriate Gen2 CDK code that reproduces this behavior using escape hatches and CDK constructs.

## Glossary

- **Migration_Tool**: The `gen2-migration generate` command that reads a Gen1 Amplify project and produces Gen2 CDK TypeScript code.
- **DataGenerator**: The class in `data.generator.ts` that plans and executes data/API code generation for the migration tool.
- **DataRenderer**: The class in `data.renderer.ts` that renders TypeScript AST nodes for the data resource file and escape hatch functions.
- **BackendGenerator**: The class in `backend.generator.ts` that accumulates imports and statements for the generated `backend.ts` file.
- **VTL_File**: A Velocity Template Language file (`.vtl` extension) located in the Gen1 project's `amplify/backend/api/<apiName>/resolvers/` directory.
- **Override_Resolver**: A VTL_File with a 4-segment filename (`TypeName.fieldName.req.vtl` or `TypeName.fieldName.res.vtl`) that replaces the default DataResolverFn request or response mapping template.
- **Extended_Resolver**: A VTL_File with a 6-segment filename (`TypeName.fieldName.slot.order.templateType.vtl`) that adds a new pipeline function at a specific slot in the resolver pipeline.
- **Slot**: A named position within a pipeline resolver where extended functions can be inserted (e.g., `init`, `preAuth`, `auth`, `postAuth`, `preDataLoad`, `postDataLoad`, `preUpdate`, `postUpdate`, `preSubscribe`, `finish`).
- **Splice_Index**: The computed zero-based position in the pipeline function array where an extended resolver function is inserted.
- **Pipeline_Resolver**: An AppSync resolver that executes a sequence of pipeline functions. In Gen2, the default pipeline shape varies by operation type.
- **NoneDataSource**: An AppSync data source with no backing service, used by extended resolver functions that only transform context.
- **CDK_Asset**: An AWS CDK construct (`aws-s3-assets.Asset`) that uploads a local file to S3 at deploy time and provides an S3 URL.

## Requirements

### Requirement 1: Discover VTL Resolver Files

**User Story:** As a developer migrating from Gen1 to Gen2, I want the migration tool to discover custom VTL resolver files in my Gen1 project, so that my resolver customizations are included in the generated Gen2 code.

#### Acceptance Criteria

1. WHEN a Gen1 project contains VTL_Files in the `amplify/backend/api/<apiName>/resolvers/` directory, THE DataGenerator SHALL read the list of all files ending with `.vtl` from that directory.
2. WHEN the resolvers directory does not exist, THE DataGenerator SHALL treat the resolver file list as empty and proceed without error.
3. WHEN the resolvers directory exists but contains no `.vtl` files, THE DataGenerator SHALL treat the resolver file list as empty and proceed without error.

### Requirement 2: Classify VTL Files as Override or Extended

**User Story:** As a developer migrating from Gen1 to Gen2, I want the migration tool to correctly distinguish between override and extended resolver files, so that each type receives the appropriate Gen2 code treatment.

#### Acceptance Criteria

1. WHEN a VTL_File has exactly 4 dot-separated segments (e.g., `Mutation.createTodo.req.vtl`), THE Migration_Tool SHALL classify the file as an Override_Resolver.
2. WHEN a VTL_File has exactly 6 dot-separated segments (e.g., `Mutation.createBoard.init.2.req.vtl`), THE Migration_Tool SHALL classify the file as an Extended_Resolver.
3. WHEN a VTL_File has a segment count other than 4 or 6, THE Migration_Tool SHALL ignore the file during classification.
4. THE Migration_Tool SHALL parse each Extended_Resolver filename into its components: typeName, fieldName, slot, order, and templateType.
5. WHEN an Extended_Resolver filename contains a slot value not valid for its typeName, THE Migration_Tool SHALL throw a descriptive error naming the invalid slot and listing the valid slots.
6. WHEN an Extended_Resolver filename contains a non-numeric order segment, THE Migration_Tool SHALL throw a descriptive error.
7. WHEN two Extended_Resolver files define the same typeName, fieldName, slot, order, and templateType combination, THE Migration_Tool SHALL throw a duplicate error naming both files.

### Requirement 3: Validate Slot Names by Operation Type

**User Story:** As a developer migrating from Gen1 to Gen2, I want the migration tool to validate that my extended resolver slots are valid for the operation type, so that I catch configuration errors during migration rather than at deploy time.

#### Acceptance Criteria

1. WHEN the typeName is `Query`, THE Migration_Tool SHALL accept only the slots: `init`, `preAuth`, `auth`, `postAuth`, `preDataLoad`, `postDataLoad`, `finish`.
2. WHEN the typeName is `Mutation`, THE Migration_Tool SHALL accept only the slots: `init`, `preAuth`, `auth`, `postAuth`, `preUpdate`, `postUpdate`, `finish`.
3. WHEN the typeName is `Subscription`, THE Migration_Tool SHALL accept only the slots: `init`, `preAuth`, `auth`, `postAuth`, `preSubscribe`.
4. WHEN the typeName is not `Query`, `Mutation`, or `Subscription`, THE Migration_Tool SHALL accept the union of all valid slots.

### Requirement 4: Copy VTL Files to Gen2 Output

**User Story:** As a developer migrating from Gen1 to Gen2, I want my custom VTL files copied to the Gen2 project output, so that the generated CDK code can reference them at deploy time.

#### Acceptance Criteria

1. WHEN VTL_Files are discovered, THE DataGenerator SHALL create an operation that copies all discovered VTL_Files from the Gen1 `amplify/backend/api/<apiName>/resolvers/` directory to the Gen2 `amplify/data/resolvers/` directory.
2. THE DataGenerator SHALL create the destination `amplify/data/resolvers/` directory if it does not exist.
3. THE DataGenerator SHALL preserve the original filenames during the copy.

### Requirement 5: Generate Common Resolver Declarations

**User Story:** As a developer migrating from Gen1 to Gen2, I want the generated backend.ts to include the shared declarations needed by resolver code, so that both override and extended resolver code can reference the resolvers directory.

#### Acceptance Criteria

1. WHEN VTL_Files are discovered, THE DataGenerator SHALL contribute an import of `join` and `dirname` from `path` to backend.ts.
2. WHEN VTL_Files are discovered, THE DataGenerator SHALL contribute an import of `fileURLToPath` from `url` to backend.ts.
3. WHEN VTL_Files are discovered, THE DataGenerator SHALL contribute a `const __dirname = dirname(fileURLToPath(import.meta.url))` declaration to backend.ts.
4. WHEN VTL_Files are discovered, THE DataGenerator SHALL contribute a `const resolversDir = join(__dirname, "data/resolvers")` declaration to backend.ts.

### Requirement 6: Generate Override Resolver Code

**User Story:** As a developer migrating from Gen1 to Gen2, I want the generated backend.ts to override the default DataResolverFn mapping templates with my custom VTL, so that my resolver customizations are preserved in Gen2.

#### Acceptance Criteria

1. WHEN Override_Resolver files are discovered, THE DataGenerator SHALL contribute an import of `readdirSync` from `fs` to backend.ts.
2. WHEN Override_Resolver files are discovered, THE DataGenerator SHALL contribute a namespace import of `aws-cdk-lib/aws-s3-assets` as `assets` to backend.ts.
3. WHEN Override_Resolver files are discovered, THE DataGenerator SHALL generate a `resolverFiles` declaration that filters the resolvers directory for files ending with `.req.vtl` or `.res.vtl` AND having exactly 4 dot-separated segments.
4. WHEN Override_Resolver files are discovered, THE DataGenerator SHALL generate a for-of loop over `resolverFiles` that for each file: parses the typeName and fieldName, computes the `functionId` as `${typeName}${capitalizedFieldName}DataResolverFn`, looks up the pipeline function from `backend.data.resources.cfnResources.cfnFunctionConfigurations[functionId]`, creates a CDK_Asset from the VTL file, and assigns the asset's `s3ObjectUrl` to `requestMappingTemplateS3Location` or `responseMappingTemplateS3Location` based on the file extension.
5. THE DataGenerator SHALL only process Override_Resolver files with exactly 4 segments, excluding Extended_Resolver files from the override path.

### Requirement 7: Generate Extended Resolver Code

**User Story:** As a developer migrating from Gen1 to Gen2, I want the generated backend.ts to create new pipeline functions from my extended resolver VTL files and splice them into the correct pipeline positions, so that my custom pipeline logic is preserved in Gen2.

#### Acceptance Criteria

1. WHEN Extended_Resolver files are discovered, THE DataGenerator SHALL contribute an import of `aws_appsync` from `aws-cdk-lib` to backend.ts.
2. WHEN Extended_Resolver files are discovered, THE DataGenerator SHALL contribute an import of `CfnResolver` from `aws-cdk-lib/aws-appsync` to backend.ts.
3. WHEN Extended_Resolver files are discovered, THE DataGenerator SHALL generate a `noneDataSource` declaration by calling `backend.data.resources.graphqlApi.addNoneDataSource("none")`.
4. WHEN Extended_Resolver files are discovered, THE DataGenerator SHALL generate an `AppsyncFunction` construct for each unique slot-order pair, using the NoneDataSource, with `MappingTemplate.fromFile()` for provided VTL files and `MappingTemplate.fromString()` with passthrough templates for missing request or response files.
5. WHEN an Extended_Resolver has a request file but no response file, THE DataRenderer SHALL use `$util.toJson($ctx.prev.result)` as the response mapping template string.
6. WHEN an Extended_Resolver has a response file but no request file, THE DataRenderer SHALL use `$util.toJson({})` as the request mapping template string.
7. THE DataGenerator SHALL group Extended_Resolver files by typeName and fieldName, sort them by slot pipeline execution order then by numeric order within the same slot, and pair request/response templates for the same slot-order combination.

### Requirement 8: Compute Splice Indexes for Extended Resolvers

**User Story:** As a developer migrating from Gen1 to Gen2, I want the migration tool to compute the correct pipeline insertion positions for my extended resolver functions, so that they execute in the right order relative to the default pipeline functions.

#### Acceptance Criteria

1. WHEN the typeName is `Query`, `Subscription`, or a delete Mutation (fieldName starts with `delete`), THE Migration_Tool SHALL use the 3-function base pipeline shape: `[auth0(0), postAuth0(1), DataResolverFn(2)]`.
2. WHEN the typeName is `Mutation` and the fieldName does not start with `delete`, THE Migration_Tool SHALL use the 4-function base pipeline shape: `[init0(0), auth0(1), postAuth0(2), DataResolverFn(3)]`.
3. THE Migration_Tool SHALL compute each splice index as `baseIndex[slot] + runningOffset`, where `runningOffset` starts at 0 and increments by 1 for each function added to the pipeline group.
4. THE DataGenerator SHALL generate splice statements that insert each extended function's `functionId` into the pipeline resolver's function array at the computed Splice_Index.
5. THE DataGenerator SHALL generate a reassignment of the resolver's `pipelineConfig` property after all splice operations for a given pipeline resolver.

### Requirement 9: Integrate Resolver Code into Escape Hatches Pattern

**User Story:** As a developer migrating from Gen1 to Gen2, I want the resolver override and extension code to follow the existing escape hatches pattern in the generated code, so that the generated project is consistent and maintainable.

#### Acceptance Criteria

1. WHEN VTL_Files are discovered, THE DataGenerator SHALL ensure the `applyEscapeHatches` call is registered on the BackendGenerator for the data resource.
2. THE DataGenerator SHALL contribute resolver-related statements to backend.ts using the BackendGenerator's post-define-backend statement API.
3. THE DataGenerator SHALL contribute resolver-related imports using the BackendGenerator's existing import APIs.
