import { AmplifyMigrationStep } from './_step';
import { prepare } from './codegen-generate/src/codegen-head/command-handlers';
import { AmplifyGen2MigrationValidations } from './_validations';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  public implications(): string[] {
    return [
      `Your local 'amplify' folder will be overwritten with Gen2 configuration files`,
      `Your local 'package.json' file will be updated with Gen2 dependencies`,
    ];
  }

  public async validate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.context);
    await validations.validateLockStatus();
    await validations.validateWorkingDirectory();
  }

  public async execute(): Promise<void> {
    await prepare(this.logger);
  }

  public async rollback(): Promise<void> {
    // Rollback logic can be added here if needed
  }
}
