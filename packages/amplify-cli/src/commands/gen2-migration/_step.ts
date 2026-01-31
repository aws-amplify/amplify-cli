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

  public abstract executeImplications(): Promise<string[]>;

  public abstract rollbackImplications(): Promise<string[]>;

  public abstract executeValidate(): Promise<void>;

  public abstract rollbackValidate(): Promise<void>;

  public abstract execute(): Promise<AmplifyMigrationOperation[]>;

  public abstract rollback(): Promise<AmplifyMigrationOperation[]>;
}

export interface AmplifyMigrationOperation {
  describe(): Promise<string[]>;

  execute(): Promise<void>;
}
