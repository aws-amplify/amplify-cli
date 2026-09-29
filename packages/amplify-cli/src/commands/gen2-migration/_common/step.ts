import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { SpinningLogger } from './spinning-logger';
import { Plan } from './plan';
import { Gen1App } from './gen1-app';
import { AmplifyGen2MigrationValidations } from './validations';

/**
 * Abstract base class that defines the lifecycle contract for all migration steps.
 */
export abstract class AmplifyMigrationStep {
  constructor(
    protected readonly logger: SpinningLogger,
    protected readonly gen1App: Gen1App,
    protected readonly context: $TSContext,
    protected readonly validations: AmplifyGen2MigrationValidations,
  ) {}

  /**
   * Returns a Plan for forward execution.
   */
  public abstract forward(): Promise<Plan>;

  /**
   * Returns a Plan for rollback.
   */
  public abstract rollback(): Promise<Plan>;
}
