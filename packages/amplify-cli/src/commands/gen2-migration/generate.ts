import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation } from './_operation';
import { prepareNew } from './generate-new/prepare';
import { AmplifyGen2MigrationValidations } from './_validations';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  public async executeImplications(): Promise<string[]> {
    return ['TODO'];
  }

  public async rollbackImplications(): Promise<string[]> {
    throw new Error('Method not implemented.');
  }

  public async executeValidate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
    await validations.validateLockStatus();
    await validations.validateWorkingDirectory();
  }

  public async rollbackValidate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * Returns the full list of migration operations from all generators.
   * The parent dispatcher displays descriptions and prompts for
   * confirmation before executing them sequentially.
   */
  public async execute(): Promise<AmplifyMigrationOperation[]> {
    return prepareNew(this.logger, this.appId, this.currentEnvName, this.region);
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    throw new Error('Not Implemented');
  }
}
