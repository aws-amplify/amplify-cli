import { AmplifyMigrationOperation } from './_operation';

export abstract class Plan {
  private readonly _operations: AmplifyMigrationOperation[] = [];

  public addOperation(operation: AmplifyMigrationOperation) {
    this._operations.push(operation);
  }

  public async validate() {
    for (const operation of this._operations) {
      await operation.validate();
    }
  }

  protected abstract describe();

  public async execute() {
    for (const operation of this._operations) {
      await operation.execute();
    }
  }
}
