import { AmplifyMigrationCloneStep } from './gen2-migration/clone';
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AmplifyMigrationStep } from './gen2-migration/_step';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { AmplifyMigrationCleanupStep } from './gen2-migration/cleanup';
import { AmplifyMigrationDecommissionStep } from './gen2-migration/decommission';
import { AmplifyMigrationGenerateStep } from './gen2-migration/generate';
import { AmplifyMigrationLockStep } from './gen2-migration/lock';
import { AmplifyMigrationRefactorStep } from './gen2-migration/refactor';
import { AmplifyMigrationShiftStep } from './gen2-migration/shift';
import { stateManager } from '@aws-amplify/amplify-cli-core';
import chalk from 'chalk';

const STEPS = {
  cleanup: {
    class: AmplifyMigrationCleanupStep,
    description: 'TODO',
  },
  clone: {
    class: AmplifyMigrationCloneStep,
    description: 'TODO',
  },
  decommission: {
    class: AmplifyMigrationDecommissionStep,
    description: 'TODO',
  },
  generate: {
    class: AmplifyMigrationGenerateStep,
    description: 'TODO',
  },
  lock: {
    class: AmplifyMigrationLockStep,
    description: 'TODO',
  },
  refactor: {
    class: AmplifyMigrationRefactorStep,
    description: 'TODO',
  },
  shift: {
    class: AmplifyMigrationShiftStep,
    description: 'TODO',
  },
};

export class Logger {
  constructor(private readonly stepName: string, private readonly appId: string, private readonly envName: string) {}

  public envelope(message: string) {
    printer.info(chalk.cyan(this._message(message, '→')));
  }

  public info(message: string): void {
    printer.info(this._message(message, '•'));
  }

  public debug(message: string): void {
    printer.debug(this._message(message, '·'));
  }

  public warn(message: string): void {
    printer.warn(this._message(message, '·'));
  }

  public warning(message: string): void {
    printer.warn(this._message(message, '·'));
  }

  private _message(message: string, prefix: string) {
    return `[${new Date().toISOString()}] [${chalk.bold(this.stepName)}] [${chalk.blue(
      `${this.appId}/${this.envName}`,
    )}] ${prefix} ${message}`;
  }
}

export const run = async (context: $TSContext) => {
  const stepName = (context.input.subCommands ?? [])[0];
  const step = STEPS[stepName];
  if (!step) {
    displayHelp(context);
    return;
  }

  shiftParams(context);

  const skipValidations = (context.input.options ?? {})['skip-validations'] ?? false;
  const validationsOnly = (context.input.options ?? {})['validations-only'] ?? false;
  const skipRollback = (context.input.options ?? {})['skip-rollback'] ?? false;

  if (skipValidations && validationsOnly) {
    throw new AmplifyError('InputValidationError', {
      message: 'Cannot specify both --skip-validations and --validation-only',
    });
  }

  const projectName = stateManager.getProjectName();
  const currentEnvName = stateManager.getCurrentEnvName();

  if (!currentEnvName) {
    throw new AmplifyError('EnvironmentNotInitializedError', {
      message: `No environment configured for project '${projectName}'`,
      resolution: 'Run "amplify pull" to configure an environment.',
    });
  }

  const logger = new Logger(stepName, projectName, currentEnvName);
  const implementation: AmplifyMigrationStep = new step.class(logger, projectName, currentEnvName, context);

  if (!skipValidations) {
    printer.blankLine();
    logger.envelope('Performing validations');
    await implementation.validate();
    logger.envelope('Validations complete');
  }

  if (!validationsOnly) {
    try {
      printer.blankLine();
      printer.info(
        chalk.gray(`You are about to execute '${stepName}' on environment '${projectName}/${currentEnvName}'. Following this operation:`),
      );
      printer.blankLine();
      for (const implication of implementation.implications()) {
        printer.info(chalk.bold(`- ${implication}`));
      }
      printer.blankLine();
      if (await prompter.confirmContinue()) {
        printer.blankLine();
        logger.envelope('Executing');
        await implementation.execute();
        logger.envelope('Execution complete');
      }
    } catch (error: unknown) {
      if (!skipRollback) {
        printer.error(`Execution failed: ${error}`);
        printer.blankLine();
        logger.envelope('Rolling back');
        await implementation.rollback();
        logger.envelope('Rollback complete');
      }
      throw error;
    }
  }

  printer.blankLine();
  printer.success('Done');
};

function shiftParams(context) {
  delete context.parameters.first;
  delete context.parameters.second;
  delete context.parameters.third;
  const { subCommands } = context.input;
  /* eslint-disable */
  if (subCommands && subCommands.length > 1) {
    if (subCommands.length > 1) {
      context.parameters.first = subCommands[1];
    }
    if (subCommands.length > 2) {
      context.parameters.second = subCommands[2];
    }
    if (subCommands.length > 3) {
      context.parameters.third = subCommands[3];
    }
  }
  /* eslint-enable */
}

function displayHelp(context: $TSContext) {
  context.amplify.showHelp(
    'amplify gen2-migration <subcommands>',
    Object.entries(STEPS).map(([name, v]) => ({ name, description: v.description })),
  );
  printer.info('');
}
