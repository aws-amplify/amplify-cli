import { AmplifyMigrationStep } from './_step';
import { printer } from '@aws-amplify/amplify-prompts';
import { AmplifyGen2MigrationValidations } from './_validations';

export class AmplifyMigrationLockStep extends AmplifyMigrationStep {
  readonly command = 'lock';
  readonly describe = 'Lock environment';

  public async validate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations({} as any);
    await validations.validateDeploymentStatus();
  }

  public async execute(): Promise<void> {
    printer.warn('Not implemented');
  }

  public async rollback(): Promise<void> {
    printer.warn('Not implemented');
  }
}
