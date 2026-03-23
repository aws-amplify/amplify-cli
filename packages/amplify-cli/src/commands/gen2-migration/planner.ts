import { AmplifyMigrationOperation } from './_operation';

/**
 * Shared interface for units of work in the migration pipeline.
 * Implementors compute and return operations during plan().
 */
export interface Planner {
  plan(): Promise<AmplifyMigrationOperation[]>;
}
