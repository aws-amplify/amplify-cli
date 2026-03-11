# input/file-exists.ts — fileOrDirectoryExists

Utility function that checks if a file or directory exists at a given path.

## How It Works

Uses `fs.access()` to test existence. Returns `true` if accessible, `false` otherwise. Used throughout the codebase for conditional file reads (e.g., checking if a schema directory exists before reading it, checking if a cloud backend file exists).

## Relationship to Other Components

- Used by `Gen1App` for cloud backend file existence checks
- Used by `BackendDownloader` for cache directory validation
- Used by `AmplifyYmlGenerator` for local file detection
