import { AmplifyMigrationStep } from './_step';
import { prepare } from './codegen-generate/src/codegen-head/command-handlers';
import { AmplifyGen2MigrationValidations } from './_validations';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  public async validate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations({} as any);
    await validations.validateLockStatus();
  }

  public async execute(): Promise<void> {
    await prepare();
  }

  public async rollback(): Promise<void> {
    // Rollback logic can be added here if needed
  }
}
