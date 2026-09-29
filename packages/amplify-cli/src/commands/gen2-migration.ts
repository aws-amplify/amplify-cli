import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AmplifyMigrationStep } from './gen2-migration/_common/step';
import { printer, prompter, isDebug } from '@aws-amplify/amplify-prompts';
import { AmplifyMigrationGenerateStep } from './gen2-migration/generate';
import { AmplifyMigrationLockStep } from './gen2-migration/lock';
import { AmplifyMigrationRefactorStep } from './gen2-migration/refactor';
import { SpinningLogger } from './gen2-migration/_common/spinning-logger';
import chalk from 'chalk';
import { AmplifyMigrationAssessor } from './gen2-migration/assess';
import { Gen1App } from './gen2-migration/_common/gen1-app';
import { Plan } from './gen2-migration/_common/plan';
import { AmplifyGen2MigrationValidations } from './gen2-migration/_common/validations';
import { AmplifyMigrationRetainStep } from './gen2-migration/retain';

const STEPS = {
  lock: {
    class: AmplifyMigrationLockStep,
    description: 'Locks your Gen1 environment to prevent updates during migration',
  },
  generate: {
    class: AmplifyMigrationGenerateStep,
    description: 'Generates Gen2 application code from your existing Gen1 environment',
  },
  refactor: {
    class: AmplifyMigrationRefactorStep,
    // eslint-disable-next-line spellcheck/spell-checker
    description: 'Moves stateful resources from your Gen1 CloudFormation stacks to your Gen2 stacks',
  },
  retain: {
    class: AmplifyMigrationRetainStep,
    description: 'Apply retain to every resource in every Gen1 stack below the root',
  },
};

export const run = async (context: $TSContext) => {
  const stepName = (context.input.subCommands ?? [])[0];
  const step = STEPS[stepName];
  if (!step && stepName !== 'assess') {
    displayHelp(context);
    return;
  }

  shiftParams(context);

  const skipValidations = (context.input.options ?? {})['skip-validations'] ?? false;
  const validationsOnly = (context.input.options ?? {})['validations-only'] ?? false;
  const rollingBack = (context.input.options ?? {})['rollback'] ?? false;
  const disableAutoRollback = (context.input.options ?? {})['no-rollback'] ?? false;
  const additionalStatefulResources = (context.parameters.options ?? {})['additional-stateful-resource-types'];

  if (skipValidations && validationsOnly) {
    throw new AmplifyError('InputValidationError', {
      message: 'Cannot specify both --skip-validations and --validation-only',
    });
  }

  if (rollingBack && disableAutoRollback) {
    throw new AmplifyError('InputValidationError', {
      message: 'Cannot specify both --rollback and --no-rollback',
    });
  }

  const gen1App = await Gen1App.create(context, additionalStatefulResources);

  const logger = new SpinningLogger(`${stepName}] [${gen1App.appName}/${gen1App.envName}`, { debug: isDebug });

  // Assess is not a migration step — handle it separately.
  if (stepName === 'assess') {
    const assessor = new AmplifyMigrationAssessor(gen1App, logger);
    assessor.run();
    return;
  }

  const validations = new AmplifyGen2MigrationValidations(logger, gen1App, context);
  const implementation: AmplifyMigrationStep = new step.class(logger, gen1App, context, validations);

  // Plan
  printer.blankLine();
  logger.start('Planning');
  let plan: Plan;
  try {
    plan = rollingBack ? await implementation.rollback() : await implementation.forward();
    logger.succeed('→ Planning complete');
  } catch (error: unknown) {
    logger.failed('→ Planning failed');
    printer.blankLine();
    throw error;
  }

  // Validate
  if (!skipValidations) {
    const passed = await plan.validate();
    if (!passed) {
      const skipCommand = `amplify ${context.input.argv.join(' ').trim()} --skip-validations`;
      printer.blankLine();
      throw new AmplifyError('PreflightValidationError', {
        message: 'Validations failed',
        resolution: `Resolve the validation errors or skip them by running '${skipCommand}'`,
      });
    }
  }

  if (validationsOnly) return;

  printer.blankLine();
  printer.info(
    chalk.yellow(
      `You are about to ${rollingBack ? 'rollback' : 'execute'} '${stepName}' on environment '${gen1App.appName}/${gen1App.envName}'.`,
    ),
  );
  printer.blankLine();

  await plan.describe();

  if (!rollingBack) {
    printer.info(chalk.grey(`(You can rollback this command by running: 'amplify gen2-migration ${stepName} --rollback')`));
    printer.blankLine();
  }

  printer.info(
    chalk.yellow(
      '⚠️  This command is in developer preview. For more information, visit https://docs.amplify.aws/react/start/migrate-to-gen2',
    ),
  );
  printer.blankLine();

  if (!(await prompter.confirmContinue())) {
    return;
  }

  printer.blankLine();

  try {
    await plan.execute();
    return;
  } catch (error: unknown) {
    if (!rollingBack && !disableAutoRollback) {
      printer.blankLine();
      printer.error(`Failed: ${error}`);
      printer.blankLine();
      const rollbackPlan = await implementation.rollback();
      await rollbackPlan.execute();
    }

    throw error;
  }
};

function shiftParams(context) {
  delete context.parameters.first;
  delete context.parameters.second;
  delete context.parameters.third;
  const { subCommands } = context.input;
  if (subCommands && subCommands.length > 1) {
    context.parameters.first = subCommands[1];
    if (subCommands.length > 2) {
      context.parameters.second = subCommands[2];
    }
    if (subCommands.length > 3) {
      context.parameters.third = subCommands[3];
    }
  }
}

function displayHelp(context: $TSContext) {
  const commands = [
    { name: 'assess', description: 'Assesses migration readiness for your Gen1 environment' },
    ...Object.entries(STEPS).map(([name, v]) => ({ name, description: v.description })),
  ];
  context.amplify.showHelp('amplify gen2-migration <subcommands>', commands);
  printer.info('');
}
