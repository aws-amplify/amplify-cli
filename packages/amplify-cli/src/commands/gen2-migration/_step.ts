import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { Logger } from '../gen2-migration';
import { AmplifyGen2MigrationValidations } from './_validations';

export abstract class AmplifyMigrationStep {
  protected validations: AmplifyGen2MigrationValidations;

  constructor(
    protected readonly logger: Logger,
    protected readonly currentEnvName: string,
    protected readonly appName: string,
    protected readonly appId: string,
    protected readonly rootStackName: string,
    protected readonly region: string,
    protected readonly context: $TSContext,
  ) {
    this.validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
  }

  public abstract validate(): Promise<void>;

  public abstract operations(): Promise<AmplifyMigrationOperation[]>;
}

export interface AmplifyMigrationOperation {
  describe(): Promise<string[]>;

  execute(): Promise<void>;

  rollback(): Promise<void>;
}
