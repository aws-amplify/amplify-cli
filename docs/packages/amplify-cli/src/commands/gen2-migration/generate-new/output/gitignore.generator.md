# output/gitignore.generator.ts — GitIgnoreGenerator

Updates `.gitignore` with Gen2 entries and removes the Gen1 block.

## How It Works

`plan()` returns a single operation that:

1. Reads the existing `.gitignore` (or starts empty if it doesn't exist)
2. Removes the Gen1 `#amplify-do-not-edit-begin` ... `#amplify-do-not-edit-end` block via regex
3. Adds Gen2 entries (`.amplify`, `amplify_outputs*`, `amplifyconfiguration*`, `aws-exports*`, `node_modules`, `build`, `dist`) — skipping any that already exist
4. Removes empty lines and writes the result

## Relationship to Other Components

- No constructor arguments — reads/writes to `process.cwd()` directly
- Runs independently of all other generators
