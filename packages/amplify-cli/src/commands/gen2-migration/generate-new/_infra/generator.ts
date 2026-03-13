import { AmplifyMigrationOperation } from '../../_operation';

/**
 * Interface for all generators in the migration pipeline.
 * Each generator returns operations that co-locate description and execution,
 * enabling dry-run support via the existing describe-then-execute flow.
 */
export interface Generator {
  plan(): Promise<AmplifyMigrationOperation[]>;
}
