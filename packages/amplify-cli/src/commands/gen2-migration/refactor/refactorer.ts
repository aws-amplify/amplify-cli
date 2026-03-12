import { AmplifyMigrationOperation } from '../_operation';

/**
 * Extends AmplifyMigrationOperation with a validation phase.
 *
 * validate() is called on ALL operations before any execute() runs,
 * satisfying R7 (all validations complete before any mutation).
 */
export interface RefactorOperation extends AmplifyMigrationOperation {
  /**
   * Validates that this operation can proceed without causing harm.
   * Throws AmplifyError if validation fails.
   */
  validate(): Promise<void>;
}

/**
 * A refactorer produces a plan of operations for one unit of refactor work.
 */
export interface Refactorer {
  /**
   * Computes and returns the operations needed for this refactor unit.
   * Returns an empty array if the category/service doesn't exist in either stack.
   */
  plan(): Promise<RefactorOperation[]>;
}
