import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { Logger } from '../gen2-migration';

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

  public abstract validate(): Promise<void>;

  public abstract execute(): Promise<void>;

  public abstract rollback(): Promise<void>;

  public abstract implications(): string[];
}
