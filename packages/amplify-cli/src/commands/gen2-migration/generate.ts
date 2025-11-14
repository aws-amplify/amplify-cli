import { AmplifyMigrationStep } from './_step';
import { prepare } from './codegen-generate/src/codegen-head/command-handlers';

export class AmplifyMigrationGenerateStep extends AmplifyMigrationStep {
  public async validate(): Promise<void> {
    // Validation logic can be added here if needed
  }

  public async execute(): Promise<void> {
    await prepare();
  }

  public async rollback(): Promise<void> {
    // Rollback logic can be added here if needed
  }
}
