import { AmplifyMigrationCloneStep } from './gen2-migration/clone';
import { $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { AmplifyMigrationStep } from './gen2-migration/_step';
import { AmplifyMigrationOperation } from './gen2-migration/_operation';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { AmplifyMigrationDecommissionStep } from './gen2-migration/decommission';
import { AmplifyMigrationGenerateStep } from './gen2-migration/generate';
import { AmplifyMigrationLockStep } from './gen2-migration/lock';
import { AmplifyMigrationRefactorStep } from './gen2-migration/refactor-new';
import { AmplifyMigrationShiftStep } from './gen2-migration/shift';
import { stateManager } from '@aws-amplify/amplify-cli-core';
import { AmplifyClient, GetAppCommand } from '@aws-sdk/client-amplify';
import chalk from 'chalk';

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
    description: 'Move stateful resources from your Gen1 environment to your newly deployed Gen2 branch',
  },
  shift: {
    class: AmplifyMigrationShiftStep,
    description: 'Not Implemented',
  },
};

/**
 * Logging utility that wraps the standard printer with additional gen2-migration specific context.
 */
export class Logger {
  constructor(private readonly stepName: string, private readonly appName: string, private readonly envName: string) {}

  /**
   * Logs a message with a visual envelope border for major section headers
   */
  public envelope(message: string) {
    printer.info(chalk.cyan(this._message(message, '→')));
  }

  /**
   * Logs informational messages that are always displayed to the user.
   */
  public info(message: string): void {
    printer.info(this._message(message, '•'));
  }

  /**
   * Logs debug-level messages that are shown only if the command is executed with --debug.
   */
  public debug(message: string): void {
    printer.debug(this._message(message, '·'));
  }

  /**
   * Logs warning messages that are always displayed to the user.
   */
  public warn(message: string): void {
    printer.warn(this._message(message, '·'));
  }

  /**
   * Alias to `warn`.
   */
  public warning(message: string): void {
    printer.warn(this._message(message, '·'));
  }

  private _message(message: string, prefix: string) {
    return `[${new Date().toISOString()}] [${chalk.bold(this.stepName)}] [${chalk.blue(
      `${this.appName}/${this.envName}`,
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

  const logger = new Logger(stepName, appName, envName);
  const implementation: AmplifyMigrationStep = new step.class(logger, envName, appName, appId, stackName, region, context);

  if (validationsOnly) {
    await validate(implementation, rollingBack, logger, context);
    return;
  }

  printer.blankLine();
  printer.info(
    chalk.yellow(`You are about to ${rollingBack ? 'rollback' : 'execute'} '${stepName}' on environment '${appId}/${envName}'.`),
  );
  printer.blankLine();

  printer.info(chalk.bold(chalk.underline('Operations Summary')));
  printer.blankLine();

  for (const operation of rollingBack ? await implementation.rollback() : await implementation.execute()) {
    for (const description of await operation.describe()) {
      printer.info(`• ${description}`);
    }
  }

  printer.blankLine();

  printer.info(chalk.bold(chalk.underline('Implications')));
  printer.blankLine();

  const cachedStep = new CachedAmplifyMigrationStep(implementation);

  for (const implication of rollingBack ? await cachedStep.rollbackImplications() : await cachedStep.executeImplications()) {
    printer.info(`• ${implication}`);
  }

  printer.blankLine();

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

  if (!skipValidations) {
    await validate(implementation, rollingBack, logger, context);
    printer.blankLine();
  }

  if (rollingBack) {
    await runRollback(cachedStep, logger);
    printer.blankLine();
    printer.success('Done');
    return;
  }

  try {
    await runExecute(cachedStep, logger);
    printer.blankLine();
    printer.success('Done');
    return;
  } catch (error: unknown) {
    if (!disableAutoRollback) {
      printer.error(`Execution failed: ${error}`);
      printer.blankLine();
      await runRollback(cachedStep, logger);
    }

    throw error;
  }
};

async function validate(step: AmplifyMigrationStep, rollback: boolean, logger: Logger, context: $TSContext) {
  logger.envelope('Performing validations');
  try {
    if (rollback) {
      await step.rollbackValidate();
    } else {
      await step.executeValidate();
    }
  } catch (e) {
    const skipValidationsCommand = `amplify ${context.input.argv.join(' ').trim()} --skip-validations`;
    throw new AmplifyError('MigrationError', {
      message: `Validations failed: ${e.message}`,
      resolution: `Resolve the validation errors or skip them by running '${skipValidationsCommand}'`,
    });
  }
  logger.envelope('Validations complete');
}

async function runOperations(operations: AmplifyMigrationOperation[]) {
  for (const operation of operations) {
    await operation.validate();
  }
  for (const operation of operations) {
    await operation.execute();
  }
}

async function runRollback(step: CachedAmplifyMigrationStep, logger: Logger) {
  logger.envelope('Rolling back');
  await runOperations(await step.rollback());
  logger.envelope('Rollback complete');
}

async function runExecute(step: CachedAmplifyMigrationStep, logger: Logger) {
  logger.envelope('Executing');
  await runOperations(await step.execute());
  logger.envelope('Execution complete');
}

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
  context.amplify.showHelp(
    'amplify gen2-migration <subcommands>',
    Object.entries(STEPS).map(([name, v]) => ({ name, description: v.description })),
  );
  printer.info('');
}

/**
 * Convenience class that provides caching to step methods.
 * Return values are constructed and stored on the first invocation; subsequent invocations return
 * the cached values.
 *
 * This allows our gen2-migration.ts dispatcher to invoke step methods at will and on-demand.
 */
class CachedAmplifyMigrationStep {
  private _executionOperations: AmplifyMigrationOperation[];
  private _rollbackOperations: AmplifyMigrationOperation[];

  constructor(private readonly step: AmplifyMigrationStep) {}

  public async execute(): Promise<AmplifyMigrationOperation[]> {
    if (!this._executionOperations) {
      this._executionOperations = await this.step.execute();
    }
    return this._executionOperations;
  }

  public async rollback(): Promise<AmplifyMigrationOperation[]> {
    if (!this._rollbackOperations) {
      this._rollbackOperations = await this.step.rollback();
    }
    return this._rollbackOperations;
  }

  public async executeImplications() {
    return this.step.executeImplications();
  }

  public async rollbackImplications() {
    return this.step.rollbackImplications();
  }
}
