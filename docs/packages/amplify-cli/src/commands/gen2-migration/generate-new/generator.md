# generator.ts — Generator Interface

Defines the contract that all generators implement.

## How It Works

```typescript
interface Generator {
  plan(): Promise<AmplifyMigrationOperation[]>;
}
```

`plan()` returns an array of operations. Each operation co-locates `describe()` (what it will do) and `execute()` (how to do it). The orchestrator collects operations from all generators and returns them to the parent dispatcher, which shows descriptions to the user before executing.

Most generators return a single operation. The interface allows multiple operations per generator for cases where a generator needs to express distinct steps.

## Relationship to Other Components

- Implemented by every generator: category generators, `BackendGenerator`, `RootPackageJsonGenerator`, and all infrastructure generators
- `AmplifyMigrationOperation` is defined in `_operation.ts` (the parent migration framework)
- The orchestrator (`AmplifyMigrationGenerateStep.execute()`) iterates generators and calls `plan()` on each
