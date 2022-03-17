import {
  $TSAny,
  $TSContext,
  BannerMessage,
  CLIContextEnvironmentProvider,
  exitOnNextTick,
  FeatureFlags,
  JSONUtilities,
  JSONValidationError,
  pathManager,
  stateManager,
  TeamProviderInfoMigrateError,
  executeHooks,
  HooksMeta,
} from 'amplify-cli-core';
import { isCI } from 'ci-info';
import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { formatter, printer } from 'amplify-prompts';
import { logInput } from './conditional-local-logging-init';
import { attachUsageData, constructContext } from './context-manager';
import { displayBannerMessages } from './display-banner-messages';
import { constants } from './domain/constants';
import { Context } from './domain/context';
import { Input } from './domain/input';
import { executeCommand } from './execution-manager';
import { getCommandLineInput, verifyInput } from './input-manager';
import { getPluginPlatform, scan } from './plugin-manager';
import { checkProjectConfigVersion } from './project-config-version-check';
import { rewireDeprecatedCommands } from './rewireDeprecatedCommands';
import { ensureMobileHubCommandCompatibility } from './utils/mobilehub-support';
import { migrateTeamProviderInfo } from './utils/team-provider-migrate';
import { deleteOldVersion } from './utils/win-utils';
import { notify } from './version-notifier';
import { getAmplifyVersion } from './extensions/amplify-helpers/get-amplify-version';

// Adjust defaultMaxListeners to make sure Inquirer will not fail under Windows because of the multiple subscriptions
// https://github.com/SBoudrias/Inquirer.js/issues/887
EventEmitter.defaultMaxListeners = 1000;

// Change stacktrace limit to max value to capture more details if needed
Error.stackTraceLimit = Number.MAX_SAFE_INTEGER;

let errorHandler: (e: Error) => void = (): void => { /* noop */ };

process.on('uncaughtException', error => {
  // Invoke the configured error handler if it is already configured
  if (errorHandler) {
    errorHandler(error);
  } else {
    // Fall back to pure console logging as we have no context, etc in this case
    if (error.message) {
      console.error(error.message);
    }

    if (error.stack) {
      console.log(error.stack);
    }

    exitOnNextTick(1);
  }
});

// In this handler we have to re-throw the error otherwise the process hangs there.
process.on('unhandledRejection', error => {
  throw error;
});

const convertKeysToLowerCase = <T>(obj: Record<string, T>): Record<string, T> => {
  const newObj = {};
  Object.entries(obj).forEach(([key, value]) => { newObj[key.toLowerCase()] = value; });
  return newObj;
};

const normalizeStatusCommandOptions = (input: Input): Input => {
  const options = input.options ? input.options : {};
  const allowedVerboseIndicators = [constants.VERBOSE, 'v'];
  // Normalize 'amplify status -v' to verbose, since -v is interpreted as 'version'
  allowedVerboseIndicators.forEach(verboseFlag => {
    if (options.verboseFlag !== undefined) {
      if (typeof options[verboseFlag] === 'string') {
        const pluginName = (options[verboseFlag] as string).toLowerCase();
        options[pluginName] = true;
      }
      delete options[verboseFlag];
      options.verbose = true;
    }
  });

  // Merge plugins and sub-commands as options (except help/verbose)
  const returnInput = input;
  if (returnInput.plugin) {
    options[returnInput.plugin] = true;
    delete returnInput.plugin;
  }
  if (returnInput.subCommands) {
    const allowedSubCommands = [constants.HELP, constants.VERBOSE]; // list of sub-commands supported in Status
    const inputSubCommands: string[] = [];
    returnInput.subCommands.forEach(subCommand => {
      // plugins are inferred as sub-commands when positionally supplied
      if (!allowedSubCommands.includes(subCommand)) {
        options[subCommand.toLowerCase()] = true;
      } else {
        inputSubCommands.push(subCommand);
      }
    });
    returnInput.subCommands = inputSubCommands;
  }
  returnInput.options = convertKeysToLowerCase(options); // normalize keys to lower case
  return input;
};

/**
 * Command line entry point
 */
export const run = async (startTime: number): Promise<number | undefined> => {
  try {
    deleteOldVersion();

    let pluginPlatform = await getPluginPlatform();
    let input = getCommandLineInput(pluginPlatform);

    // with non-help command supplied, give notification before execution
    if (input.command !== 'help') {
      // Checks for available update, defaults to a 1 day interval for notification
      notify({ defer: false, isGlobal: true });
    }

    // Normalize status command options
    if (input.command === 'status') {
      input = normalizeStatusCommandOptions(input);
    }

    // Initialize Banner messages. These messages are set on the server side
    const pkg = JSONUtilities.readJson<$TSAny>(path.join(__dirname, '..', 'package.json'));
    BannerMessage.initialize(pkg.version);

    ensureFilePermissions(pathManager.getAWSCredentialsFilePath());
    ensureFilePermissions(pathManager.getAWSConfigFilePath());

    let verificationResult = verifyInput(pluginPlatform, input);

    // invalid input might be because plugin platform might have been updated,
    // scan and try again
    if (!verificationResult.verified) {
      if (verificationResult.message) {
        printer.warn(verificationResult.message);
      }
      pluginPlatform = await scan();
      input = getCommandLineInput(pluginPlatform);
      verificationResult = verifyInput(pluginPlatform, input);
    }
    if (!verificationResult.verified) {
      if (verificationResult.helpCommandAvailable) {
        input.command = constants.HELP;
      } else {
        throw new Error(verificationResult.message);
      }
    }

    rewireDeprecatedCommands(input);
    logInput(input);
    const hooksMeta = HooksMeta.getInstance(input);
    hooksMeta.setAmplifyVersion(getAmplifyVersion());
    const context = constructContext(pluginPlatform, input);

    // Initialize feature flags
    const contextEnvironmentProvider = new CLIContextEnvironmentProvider({
      getEnvInfo: context.amplify.getEnvInfo,
    });

    const projectPath = pathManager.findProjectRoot() ?? process.cwd();
    const useNewDefaults = !stateManager.projectConfigExists(projectPath);

    await FeatureFlags.initialize(contextEnvironmentProvider, useNewDefaults);

    await attachUsageData(context, startTime);

    if (!(await migrateTeamProviderInfo(context))) {
      context.usageData.emitError(new TeamProviderInfoMigrateError());

      return 1;
    }

    errorHandler = boundErrorHandler.bind(context);

    process.on('SIGINT', sigIntHandler.bind(context));

    // Skip NodeJS version check and migrations if Amplify CLI is executed in CI/CD or
    // the command is not push
    if (!isCI && context.input.command === 'push') {
      await checkProjectConfigVersion(context);
    }

    context.usageData.emitInvoke();

    // For mobile hub migrated project validate project and command to be executed
    if (!ensureMobileHubCommandCompatibility(context as unknown as $TSContext)) {
      // Double casting until we have properly typed context
      return 1;
    }

    // Display messages meant for most executions
    await displayBannerMessages(input);

    await executeCommand(context);

    const exitCode = process.exitCode || 0;

    if (exitCode === 0) {
      context.usageData.emitSuccess();
    }

    // no command supplied defaults to help, give update notification at end of execution
    if (input.command === 'help') {
      // Checks for available update, defaults to a 1 day interval for notification
      notify({ defer: true, isGlobal: true });
    }

    return exitCode;
  } catch (error) {
    // ToDo: add logging to the core, and log execution errors using the unified core logging.
    errorHandler(error);

    if (error.name === 'JSONValidationError') {
      const jsonError = <JSONValidationError>error;
      let printSummary = false;

      printer.error(error.message);

      if (jsonError.unknownFlags?.length > 0) {
        printer.blankLine();
        printer.error(
          'These feature flags are defined in the "amplify/cli.json" configuration file and are unknown to the currently running Amplify CLI:',
        );
        formatter.list(jsonError.unknownFlags);
        printSummary = true;
      }

      if (jsonError.otherErrors?.length > 0) {
        printer.blankLine();
        printer.error('The following feature flags have validation errors:');
        formatter.list(jsonError.otherErrors);
        printSummary = true;
      }

      if (printSummary) {
        printer.blankLine();
        printer.error(
          'This issue likely happens when the project has been pushed with a newer version of Amplify CLI, try updating to a newer version.',
        );

        if (isCI) {
          printer.blankLine();
          printer.error('Ensure that the CI/CD pipeline is not using an older or pinned down version of Amplify CLI.');
        }

        printer.blankLine();
        printer.error('Learn more about feature flags: https://docs.amplify.aws/cli/reference/feature-flags');
      }
    } else {
      if (error.message) {
        printer.error(error.message);
      }
      if (error.stack) {
        printer.info(error.stack);
      }
    }
    await executeHooks(
      HooksMeta.getInstance(undefined, 'post', {
        message: error.message ?? 'undefined error in Amplify process',
        stack: error.stack ?? 'undefined error stack',
      }),
    );
    exitOnNextTick(1);
    return 1;
  }
};

const ensureFilePermissions = (filePath: string): void => {
  // eslint-disable-next-line no-bitwise
  if (fs.existsSync(filePath) && (fs.statSync(filePath).mode & 0o777) === 0o644) {
    fs.chmodSync(filePath, '600');
  }
};

// This function cannot be converted to an arrow function because it uses 'this' binding
// eslint-disable-next-line func-style
function boundErrorHandler(this: Context, e: Error): void {
  this.usageData.emitError(e);
}

// This function cannot be converted to an arrow function because it uses 'this' binding
// eslint-disable-next-line func-style
async function sigIntHandler(this: Context): Promise<void> {
  this.usageData.emitAbort();

  try {
    await this.amplify.runCleanUpTasks(this);
  } catch (err) {
    this.print.warning(`Could not run clean up tasks\nError: ${err.message}`);
  }
  this.print.warning('^Aborted!');

  exitOnNextTick(2);
}

/**
 * entry from library call
 */
export const execute = async (input: Input): Promise<number> => {
  let localErrorHandler: (e: Error) => void = (): void => { /* noop */ };
  try {
    let pluginPlatform = await getPluginPlatform();
    let verificationResult = verifyInput(pluginPlatform, input);

    if (!verificationResult.verified) {
      if (verificationResult.message) {
        printer.warn(verificationResult.message);
      }
      pluginPlatform = await scan();
      verificationResult = verifyInput(pluginPlatform, input);
    }

    if (!verificationResult.verified) {
      if (verificationResult.helpCommandAvailable) {
        // eslint-disable-next-line no-param-reassign
        input.command = constants.HELP;
      } else {
        throw new Error(verificationResult.message);
      }
    }

    const context = constructContext(pluginPlatform, input);

    // AFAICT this execute function is never used. But if it is, in this case we initialize usage data with a starting timestamp of now
    await attachUsageData(context, Date.now());

    localErrorHandler = boundErrorHandler.bind(context);

    process.on('SIGINT', sigIntHandler.bind(context));

    context.usageData.emitInvoke();

    await executeCommand(context);

    const exitCode = process.exitCode || 0;

    if (exitCode === 0) {
      context.usageData.emitSuccess();
    }

    return exitCode;
  } catch (e) {
    localErrorHandler(e);

    if (e.message) {
      printer.error(e.message);
    }

    if (e.stack) {
      printer.info(e.stack);
    }

    return 1;
  }
};

/**
 * Entry point for executing plugins provided by the core
 */
export const executeAmplifyCommand = async (context: Context): Promise<void> => {
  if (context.input.command) {
    const commandPath = path.normalize(path.join(__dirname, 'commands', context.input.command));
    const commandModule = await import(commandPath);

    await commandModule.run(context);
  }
};
