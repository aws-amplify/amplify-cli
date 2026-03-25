/**
 * Result of a validation check.
 */
export interface ValidationResult {
  /**
   * Whether the validation passed.
   */
  readonly valid: boolean;

  /**
   * Optional detailed output shown below the status line.
   */
  readonly report?: string;
}

/**
 * Declarative validation: description for the spinner + a run callback.
 * The Plan drives the lifecycle (push description → run → pop).
 */
export interface Validation {
  /**
   * Text shown on the spinner while this validation runs.
   */
  readonly description: string;

  /**
   * Executes the validation.
   */
  run(): Promise<ValidationResult>;
}

/**
 * Interface for atomic operations that can be executed as part of a migration step.
 */
export interface AmplifyMigrationOperation {
  /**
   * Returns human-readable strings describing what the operation will do.
   */
  describe(): Promise<string[]>;

  /**
   * Returns a validation to run before execution, or undefined if none.
   */
  validate(): Validation | undefined;

  /**
   * Executes the operation. Should be idempotent where possible.
   */
  execute(): Promise<void>;
}
