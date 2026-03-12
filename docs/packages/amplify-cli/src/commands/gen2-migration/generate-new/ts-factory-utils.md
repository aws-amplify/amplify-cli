# ts-factory-utils.ts — Shared AST Builder Helpers

Reduces boilerplate when constructing common TypeScript AST patterns.

## How It Works

- `constDecl(name, initializer)` — Creates `const {name} = {initializer};`
- `propAccess(root, ...segments)` — Creates chained property access: `root.a.b.c`
- `constFromBackend(name, ...path)` — Creates `const {name} = backend.{...path};`
- `assignProp(target, property, value)` — Creates `{target}.{property} = {value};`
- `jsValue(value)` — Converts a JS value (undefined, boolean, number, string, string[], object) to a TypeScript AST expression
- `createBranchNameDeclaration()` — Creates `const branchName = process.env.AWS_BRANCH ?? "sandbox"`
- `extractFilePathFromHandler(handler)` — Converts Lambda handler strings to file paths (e.g., `index.handler` → `./index.js`)
- `newLineIdentifier` — A synthetic identifier used to insert blank lines between AST nodes

## Relationship to Other Components

- Used across all renderers and generators for consistent AST construction
- `constDecl` and `propAccess` are the most frequently used — they appear in `BackendGenerator`, `DynamoDBRenderer`, and most category generators
- `createBranchNameDeclaration` is used by `DataRenderer`, `S3Renderer`, `FunctionRenderer`, and `BackendGenerator.ensureBranchName()`
- `extractFilePathFromHandler` is used by `FunctionGenerator` to resolve the entry point
