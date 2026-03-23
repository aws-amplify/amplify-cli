import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { SpinningLogger } from './_spinning-logger';
import { Plan } from './_plan';

/**
 * Abstract base class that defines the lifecycle contract for all migration steps.
 */
export abstract class AmplifyMigrationStep {
  constructor(
    protected readonly logger: SpinningLogger,
    protected readonly currentEnvName: string,
    protected readonly appName: string,
    protected readonly appId: string,
    protected readonly rootStackName: string,
    protected readonly region: string,
    protected readonly context: $TSContext,
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
