import { AmplifyMigrationCloneStep } from './gen2-migration/clone';
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AmplifyMigrationStep } from './gen2-migration/_step';
import { printer, prompter, isDebug } from '@aws-amplify/amplify-prompts';
import { AmplifyMigrationDecommissionStep } from './gen2-migration/decommission';
import { AmplifyMigrationGenerateStep } from './gen2-migration/generate';
import { AmplifyMigrationLockStep } from './gen2-migration/lock';
import { AmplifyMigrationRefactorStep } from './gen2-migration/refactor';
import { AmplifyMigrationShiftStep } from './gen2-migration/shift';
import { SpinningLogger } from './gen2-migration/_spinning-logger';
import { stateManager } from '@aws-amplify/amplify-cli-core';
import { AmplifyClient, GetAppCommand } from '@aws-sdk/client-amplify';
import chalk from 'chalk';
import { AmplifyMigrationAssessor } from './gen2-migration/assess';
import { Plan } from './gen2-migration/_plan';

const STEPS = {
  clone: {
    class: AmplifyMigrationCloneStep,
    description: 'Not Implemented',
  },
  decommission: {
    class: AmplifyMigrationDecommissionStep,
    description: 'Decommission the Gen1 environment post migration',
  },
  generate: {
    class: AmplifyMigrationGenerateStep,
    description: 'Generate Gen2 application code from your existing Gen1 environment',
  },
  lock: {
    class: AmplifyMigrationLockStep,
    description: 'Locks your Gen1 environment to prevent updates during migration',
  },
  refactor: {
    class: AmplifyMigrationRefactorStep,
    // eslint-disable-next-line spellcheck/spell-checker
    description: 'Move stateful resources from your Gen1 environment to your newly deployed Gen2 branch',
  },
  shift: {
    class: AmplifyMigrationShiftStep,
    description: 'Not Implemented',
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

  if (rollingBack && stepName === 'decommission') {
    throw new AmplifyError('InputValidationError', {
      message: 'Decommission is a one-way operation and does not support rollback.',
    });
  }

  // assuming all environment are deployed within the same app - can it be different?
  const appId = (Object.values(stateManager.getTeamProviderInfo())[0] as any).awscloudformation.AmplifyAppId;

  const amplifyClient = new AmplifyClient();
  const app = await amplifyClient.send(new GetAppCommand({ appId }));
  const appName = app.app.name;

  const migratingEnvName = (app.app.environmentVariables ?? {})['GEN2_MIGRATION_ENVIRONMENT_NAME'];
  const localEnvName = stateManager.getCurrentEnvName();

  if (!localEnvName && !migratingEnvName) {
    throw new AmplifyError('EnvironmentNotInitializedError', {
      message: `No environment configured for app '${appName}'`,
      resolution: 'Run "amplify pull" to configure an environment.',
    });
  }

  if (migratingEnvName && localEnvName && migratingEnvName !== localEnvName) {
    throw new AmplifyError('MigrationError', {
      message: `Environment mismatch: Your local env (${localEnvName}) does 
      not match the environment you marked for migration (${migratingEnvName})`,
    });
  }

  const envName = localEnvName ?? migratingEnvName;

  const stackName = stateManager.getTeamProviderInfo()[envName].awscloudformation.StackName;
  const region = stateManager.getTeamProviderInfo()[envName].awscloudformation.Region;

  const logger = new SpinningLogger(`${stepName}] [${appName}/${envName}`, { debug: isDebug });

  // Assess is not a migration step — handle it separately.
  if (stepName === 'assess') {
    const assessor = new AmplifyMigrationAssessor(logger, envName, appName, appId, stackName, region, context);
    await assessor.run();
    return;
  }

  const implementation: AmplifyMigrationStep = new step.class(logger, envName, appName, appId, stackName, region, context);

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
      throw new AmplifyError('MigrationError', {
        message: 'Validations failed',
        resolution: `Resolve the validation errors or skip them by running '${skipCommand}'`,
      });
    }
  }

  if (validationsOnly) return;

  printer.blankLine();
  printer.info(
    chalk.yellow(`You are about to ${rollingBack ? 'rollback' : 'execute'} '${stepName}' on environment '${appId}/${envName}'.`),
  );
  printer.blankLine();

  await plan.describe();

  if (!rollingBack && stepName !== 'decommission') {
    printer.info(chalk.grey(`(You can rollback this command by running: 'amplify gen2-migration ${stepName} --rollback')`));
    printer.blankLine();
  }

  if (stepName === 'decommission') {
    printer.info(chalk.grey('(Decommission is a one-way operation and cannot be rolled back.)'));
    printer.blankLine();
  }

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
    { name: 'assess', description: 'Assess migration readiness for your Gen1 environment' },
    ...Object.entries(STEPS).map(([name, v]) => ({ name, description: v.description })),
  ];
  context.amplify.showHelp('amplify gen2-migration <subcommands>', commands);
  printer.info('');
}
