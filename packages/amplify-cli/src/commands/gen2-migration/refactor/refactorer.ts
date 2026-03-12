import { AmplifyMigrationOperation } from '../_operation';

/**
 * A refactorer produces a plan of operations for one unit of refactor work.
 */
export interface Refactorer {
  /**
   * Computes and returns the operations needed for this refactor unit.
   * Returns an empty array if the category/service doesn't exist in either stack.
   */
  plan(): Promise<AmplifyMigrationOperation[]>;
}
