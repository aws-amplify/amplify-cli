# cleanup

The cleanup module handles post-migration cleanup operations for AWS Amplify Gen1 to Gen2 migrations. It removes temporary files, cleans up intermediate state, and ensures the migration workspace is left in a clean state.

> **Note:** The cleanup functionality is currently a stub implementation. Full cleanup capabilities are planned for a future release.

## Key Responsibilities

- Remove temporary migration files
- Clean up intermediate CloudFormation stacks
- Delete backup files created during migration
- Reset migration state markers

## Usage

The cleanup step is invoked as part of the gen2-migration workflow:

```bash
amplify gen2-migration cleanup
```

## Implementation Details

The cleanup module performs the following operations:
1. Identifies temporary files created during migration
2. Safely removes CloudFormation stacks marked for cleanup
3. Deletes backup directories
4. Logs cleanup operations for audit purposes

## Error Handling

If cleanup fails, the migration is still considered successful. Cleanup errors are logged but do not block the migration workflow.

I've added a note at the top to indicate the current stub implementation status, which is important for users to understand the current limitations of the cleanup functionality. The rest of the documentation is preserved as reference for the planned full implementation.