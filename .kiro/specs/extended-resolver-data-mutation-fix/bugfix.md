# Bugfix Requirements Document

## Introduction

The extended resolver migration feature generates resolver code that incorrectly mutates data in the migrated Gen2 app. When the moodboard app is migrated, the generated extended resolvers modify board names: the `createBoard` mutation appends `" (new!)"` to names, and the `listBoards` query prepends `"📌 "` to names. The Gen1 app does not exhibit this behavior — the tests expect board names to be returned unmodified. This means the migration tool is either placing extended resolver functions at incorrect pipeline positions, using wrong VTL template defaults, or computing incorrect splice indexes, causing the custom VTL logic to execute and corrupt data that should pass through unchanged.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the migration tool generates code for a `Mutation.createBoard` resolver with an extended resolver at the `init` slot (e.g., `Mutation.createBoard.init.2.req.vtl`), THEN the system produces a migrated app where the `createBoard` mutation appends `" (new!)"` to the board name (e.g., `"Test Board 123"` becomes `"Test Board 123 (new!)"`)

1.2 WHEN the migration tool generates code for a `Mutation.createBoard` resolver with an extended resolver at the `finish` slot (e.g., `Mutation.createBoard.finish.1.res.vtl`), THEN the system produces a migrated app where the `finish` slot response template modifies the board name by appending `" (new!)"` to the returned result

1.3 WHEN the migration tool generates code for a `Query.listBoards` resolver with override resolvers (`Query.listBoards.req.vtl` and `Query.listBoards.res.vtl`), THEN the system produces a migrated app where the `listBoards` query prepends `"📌 "` to each board name (e.g., `"List Board 123"` becomes `"📌 List Board 123"`)

1.4 WHEN the migration tool computes splice indexes or pipeline positions for extended resolver functions, THEN the system places the functions at positions that cause the custom VTL templates to execute and mutate data that should be passed through unchanged

### Expected Behavior (Correct)

2.1 WHEN the migration tool generates code for a `Mutation.createBoard` resolver with extended resolvers at the `init` and `finish` slots, THEN the system SHALL produce a migrated app where the `createBoard` mutation returns the board name exactly as provided in the input (e.g., `"Test Board 123"` remains `"Test Board 123"`)

2.2 WHEN the migration tool generates code for a `Query.listBoards` resolver with override resolvers, THEN the system SHALL produce a migrated app where the `listBoards` query returns board names exactly as stored in the database without modification (e.g., `"List Board 123"` remains `"List Board 123"`)

2.3 WHEN the migration tool computes splice indexes or pipeline positions for extended resolver functions, THEN the system SHALL place the functions at positions that produce identical behavior to the Gen1 app's pipeline execution order

2.4 WHEN the migration tool generates VTL template defaults for extended resolvers with missing request or response templates, THEN the system SHALL use defaults that pass data through without modification, matching the Gen1 pipeline behavior

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the migration tool processes override resolver files (4-segment filenames like `TypeName.fieldName.req.vtl`), THEN the system SHALL CONTINUE TO classify them as override resolvers and generate S3 template location overrides

3.2 WHEN the migration tool processes extended resolver files (6-segment filenames like `TypeName.fieldName.slot.order.req.vtl`), THEN the system SHALL CONTINUE TO parse the filename components (typeName, fieldName, slot, order, templateType) correctly

3.3 WHEN the migration tool encounters VTL files that are neither override nor extended resolver format, THEN the system SHALL CONTINUE TO ignore them without error

3.4 WHEN the migration tool processes apps with no custom VTL resolvers, THEN the system SHALL CONTINUE TO generate the standard pipeline without any extended resolver or override code

3.5 WHEN the migration tool generates `AppsyncFunction` constructs for extended resolvers, THEN the system SHALL CONTINUE TO use `MappingTemplate.fromFile()` for present VTL templates and `MappingTemplate.fromString()` for missing templates
