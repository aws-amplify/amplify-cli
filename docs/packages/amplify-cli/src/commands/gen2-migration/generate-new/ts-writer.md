# ts-writer.ts — AST Printer

Prints TypeScript AST nodes to formatted strings.

## How It Works

- `printNodes(nodes)` — Takes a `ts.NodeArray`, prints it via the TypeScript printer, then formats with prettier (single quotes, 2-space indent). Used by generators to produce the final file content from AST nodes.
- `printNode(node)` — Prints a single AST node to a raw string without prettier formatting. Used for intermediate string representations.

Both use a shared `ts.createPrinter()` instance and a dummy source file.

## Relationship to Other Components

- Called by every generator that writes a file: `AuthGenerator`, `DataGenerator`, `S3Generator`, `FunctionGenerator`, `AnalyticsKinesisGenerator`, and `BackendGenerator`
- `BackendGenerator` does additional post-processing (blank line insertion) after `printNodes()`
