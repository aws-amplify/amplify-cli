import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { Logger } from '../gen2-migration';

/**
 * Abstract base class that defines the lifecycle contract for all migration steps.
 * Subcommands must extend this base class.
 */
export abstract class AmplifyMigrationStep {
  constructor(
    protected readonly logger: Logger,
    protected readonly currentEnvName: string,
    protected readonly appName: string,
    protected readonly appId: string,
    protected readonly rootStackName: string,
    protected readonly region: string,
    protected readonly context: $TSContext,
  ) {}

  /**
   * Returns human-readable strings describing the implications and side effects of executing forward operations.
   * Displayed to users before confirmation prompt to help them understand the impact of the migration step.
   */
  public abstract executeImplications(): Promise<string[]>;

  /**
   * Returns human-readable strings describing the implications and side effects of executing rollback operations.
   * Displayed to users before confirmation prompt to help them understand the impact of reverting the migration step.
   */
  public abstract rollbackImplications(): Promise<string[]>;

  /**
   * Validates prerequisites before executing forward operations.
   * Should check environment state, resource availability, and any step-specific requirements.
   * Throws errors if validation fails.
   */
  public abstract executeValidate(): Promise<void>;

  /**
   * Validates prerequisites before executing rollback operations.
   * Ensures the environment is in a state where rollback can proceed safely.
   * Throws errors if validation fails.
   */
  public abstract rollbackValidate(): Promise<void>;

  /**
   * Returns an array of operations to perform for forward execution.
   * Each operation describes what it will do and contains the logic to execute it.
   * Operations are executed sequentially after user confirmation.
   */
  public abstract execute(): Promise<AmplifyMigrationOperation[]>;

  /**
   * Returns an array of operations to perform for rollback.
   * Reverses the changes made by execute().
   * Operations are executed sequentially after user confirmation.
   */
  public abstract rollback(): Promise<AmplifyMigrationOperation[]>;
}

export interface AmplifyMigrationOperation {
  /**
   * Returns human-readable strings describing what the operation will do.
   * Used to display an operations summary to users before execution.
   * Each string should be a concise, actionable description (e.g., "Enable deletion protection for table 'MyTable'").
   */
  describe(): Promise<string[]>;

  /**
   * Executes the operation.
   * Should be idempotent where possible and throw descriptive errors on failure.
   * Called sequentially for each operation after user confirmation.
   */
  execute(): Promise<void>;
}
