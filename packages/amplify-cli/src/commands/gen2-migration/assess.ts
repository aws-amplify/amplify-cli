import { AmplifyMigrationStep } from './_step';
import { AmplifyMigrationOperation } from './_operation';
import { Assessment } from './_assessment';
import { AmplifyMigrationGenerateStep } from './generate';
import { AmplifyMigrationRefactorStep } from './refactor-new';

/**
 * Migration step that evaluates readiness by running the generate
 * step with an Assessment collector and querying the refactor step
 * statically. Read-only — rollback is not applicable.
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
   * Runs generate execute() with an Assessment collector. Refactor
   * support is recorded via the static assess() since the refactor
   * step requires a --to target stack not available during assessment.
   */
  public async execute(): Promise<AmplifyMigrationOperation[]> {
    const assessment = new Assessment(this.appName, this.currentEnvName);

    const generateStep = new AmplifyMigrationGenerateStep(
      this.logger,
      this.currentEnvName,
      this.appName,
      this.appId,
      this.rootStackName,
      this.region,
      this.context,
      assessment,
    );
    await generateStep.execute();

    // Layer on refactor support for each discovered resource.
    for (const [, entry] of assessment.entries) {
      entry.refactor = AmplifyMigrationRefactorStep.assess(entry.resource);
    }

    return [
      {
        validate: async () => {
          return;
        },
        describe: async () => ['Assess migration readiness'],
        execute: async () => {
          assessment.render();
        },
      },
    ];
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    return [];
  }
}
