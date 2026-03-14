import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation } from './_operation';
import { AmplifyMigrationGenerateStep } from './generate';
import { AmplifyMigrationRefactorStep } from './refactor-new';

/**
 * Migration step that evaluates readiness by running the generate
 * and refactor steps with the shared Assessment collector. Read-only —
 * rollback is not applicable.
 */
export class AmplifyMigrationAssessStep extends AmplifyMigrationStep {
  public async executeImplications(): Promise<string[]> {
    return ['Display migration readiness assessment (read-only, no changes made)'];
  }

  public async rollbackImplications(): Promise<string[]> {
    return [];
  }

  public async executeValidate(): Promise<void> {
    return;
  }

  public async rollbackValidate(): Promise<void> {
    return;
  }

  /**
   * Runs generate and refactor execute() with the shared assessment,
   * then returns a single operation that renders the result.
   */
  public async execute(): Promise<AmplifyMigrationOperation[]> {
    const generateStep = new AmplifyMigrationGenerateStep(
      this.logger,
      this.currentEnvName,
      this.appName,
      this.appId,
      this.rootStackName,
      this.region,
      this.context,
      this.assessment,
    );
    await generateStep.execute();

    const refactorStep = new AmplifyMigrationRefactorStep(
      this.logger,
      this.currentEnvName,
      this.appName,
      this.appId,
      this.rootStackName,
      this.region,
      this.context,
      this.assessment,
    );
    await refactorStep.execute();

    return [
      {
        validate: async () => {
          return;
        },
        describe: async () => ['Assess migration readiness'],
        execute: async () => {
          this.assessment.render();
        },
      },
    ];
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    return [];
  }
}
