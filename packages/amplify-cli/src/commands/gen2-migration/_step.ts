import { $TSContext } from '@aws-amplify/amplify-cli-core';

export abstract class AmplifyMigrationStep {
  constructor(private readonly context: $TSContext) {}

  public abstract validate(): Promise<boolean>;

  public abstract execute(): Promise<void>;

  public abstract rollback(): Promise<void>;
}
