/**
 * Interface for atomic operations that can be executed as part of a migration step.
 */
export interface AmplifyMigrationOperation {
  /**
   * Returns human-readable strings describing what the operation will do.
   * Used to display an operations summary to users before execution.
   * Each string should be a concise, actionable description (e.g., "Enable deletion protection for table 'MyTable'").
   */
  describe(): Promise<string[]>;

  /**
   * Validates that this operation can proceed without causing harm.
   * Called on ALL operations before any execute() runs.
   * Throws AmplifyError if validation fails.
   */
  validate(): Promise<void>;

  /**
   * Executes the operation.
   * Should be idempotent where possible and throw descriptive errors on failure.
   * Called sequentially for each operation after user confirmation.
   */
  execute(): Promise<void>;
}
