import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { Assessment } from './_assessment';
import { AmplifyMigrationGenerateStep } from './generate';
import { AmplifyMigrationRefactorStep } from './refactor';
import { SpinningLogger } from '../gen2-migration/_spinning-logger';

/**
 * Evaluates migration readiness by calling assess() on the generate
 * and refactor steps, then renders the result.
 */
export class AmplifyMigrationAssessor {
  constructor(
    private readonly logger: SpinningLogger,
    private readonly currentEnvName: string,
    private readonly appName: string,
    private readonly appId: string,
    private readonly rootStackName: string,
    private readonly region: string,
    private readonly context: $TSContext,
  ) {}

  /**
   * Runs assessment and renders the result to the terminal.
   */
  public async run(): Promise<void> {
    const assessment = new Assessment(this.appName, this.currentEnvName);

    const generateStep = new AmplifyMigrationGenerateStep(
      this.logger,
      this.currentEnvName,
      this.appName,
      this.appId,
      this.rootStackName,
      this.region,
      this.context,
    );
    await generateStep.assess(assessment);

    const refactorStep = new AmplifyMigrationRefactorStep(
      this.logger,
      this.currentEnvName,
      this.appName,
      this.appId,
      this.rootStackName,
      this.region,
      this.context,
    );
    await refactorStep.assess(assessment);

    assessment.display();
  }
}
