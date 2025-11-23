import { AmplifyMigrationStep } from './_step';
import { prepare } from './codegen-generate/src/codegen-head/command-handlers';
import { AmplifyGen2MigrationValidations } from './_validations';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  public implications(): string[] {
    return [`Override your local 'amplify' folder with Gen2 definition files`, `Update you local 'package.json' with Gen2 dependencies`];
  }

  public async validate(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validations = new AmplifyGen2MigrationValidations(this.logger, this.rootStackName, this.currentEnvName, this.context);
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
