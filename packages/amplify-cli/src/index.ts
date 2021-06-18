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
} from 'amplify-cli-core';
import { isCI } from 'ci-info';
import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { logInput } from './conditional-local-logging-init';
import { print } from './context-extensions';
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

// Adjust defaultMaxListeners to make sure Inquirer will not fail under Windows because of the multiple subscriptions
// https://github.com/SBoudrias/Inquirer.js/issues/887
EventEmitter.defaultMaxListeners = 1000;

// Change stacktrace limit to max value to capture more details if needed
Error.stackTraceLimit = Number.MAX_SAFE_INTEGER;

let errorHandler = (e: Error) => {};

process.on('uncaughtException', function (error) {
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

// In this handler we have to rethrow the error otherwise the process stucks there.
process.on('unhandledRejection', function (error) {
  throw error;
});

// entry from commandline
export async function run() {
  try {
    deleteOldVersion();

    let pluginPlatform = await getPluginPlatform();
    let input = getCommandLineInput(pluginPlatform);

    // with non-help command supplied, give notification before execution
    if (input.command !== 'help') {
      // Checks for available update, defaults to a 1 day interval for notification
      notify({ defer: false, isGlobal: true });
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
        print.warning(verificationResult.message);
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
    const context = constructContext(pluginPlatform, input);

    // Initialize feature flags
    const contextEnvironmentProvider = new CLIContextEnvironmentProvider({
      getEnvInfo: context.amplify.getEnvInfo,
    });

    const projectPath = pathManager.findProjectRoot() ?? process.cwd();
    const useNewDefaults = !stateManager.projectConfigExists(projectPath);

    await FeatureFlags.initialize(contextEnvironmentProvider, useNewDefaults);

    await attachUsageData(context);

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
    if (!ensureMobileHubCommandCompatibility((context as unknown) as $TSContext)) {
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

      print.error(error.message);

      if (jsonError.unknownFlags?.length > 0) {
        print.error('');
        print.error(
          `These feature flags are defined in the "amplify/cli.json" configuration file and are unknown to the currently running Amplify CLI:`,
        );

        for (const unknownFlag of jsonError.unknownFlags) {
          print.error(`  - ${unknownFlag}`);
        }

        printSummary = true;
      }

      if (jsonError.otherErrors?.length > 0) {
        print.error('');
        print.error(`The following feature flags have validation errors:`);

        for (const otherError of jsonError.otherErrors) {
          print.error(`  - ${otherError}`);
        }

        printSummary = true;
      }

      if (printSummary) {
        print.error('');
        print.error(
          `This issue likely happens when the project has been pushed with a newer version of Amplify CLI, try updating to a newer version.`,
        );

        if (isCI) {
          print.error('');
          print.error(`Ensure that the CI/CD pipeline is not using an older or pinned down version of Amplify CLI.`);
        }

        print.error('');
        print.error(`Learn more about feature flags: https://docs.amplify.aws/cli/reference/feature-flags`);
      }
    } else {
      if (error.message) {
        print.error(error.message);
      }
      if (error.stack) {
        print.info(error.stack);
      }
    }
    exitOnNextTick(1);
  }
}

function ensureFilePermissions(filePath: string) {
  // eslint-disable-next-line no-bitwise
  if (fs.existsSync(filePath) && (fs.statSync(filePath).mode & 0o777) === 0o644) {
    fs.chmodSync(filePath, '600');
  }
}

function boundErrorHandler(this: Context, e: Error) {
  this.usageData.emitError(e);
}

async function sigIntHandler(this: Context, e: $TSAny) {
  this.usageData.emitAbort();

  try {
    await this.amplify.runCleanUpTasks(this);
  } catch (err) {
    this.print.warning(`Could not run clean up tasks\nError: ${err.message}`);
  }
  this.print.warning('^Aborted!');

  exitOnNextTick(2);
}

// entry from library call
export async function execute(input: Input): Promise<number> {
  let errorHandler = (e: Error) => {};
  try {
    let pluginPlatform = await getPluginPlatform();
    let verificationResult = verifyInput(pluginPlatform, input);

    if (!verificationResult.verified) {
      if (verificationResult.message) {
        print.warning(verificationResult.message);
      }
      pluginPlatform = await scan();
      verificationResult = verifyInput(pluginPlatform, input);
    }

    if (!verificationResult.verified) {
      if (verificationResult.helpCommandAvailable) {
        input.command = constants.HELP;
      } else {
        throw new Error(verificationResult.message);
      }
    }

    const context = constructContext(pluginPlatform, input);

    await attachUsageData(context);

    errorHandler = boundErrorHandler.bind(context);

    process.on('SIGINT', sigIntHandler.bind(context));

    context.usageData.emitInvoke();

    await executeCommand(context);

    const exitCode = process.exitCode || 0;

    if (exitCode === 0) {
      context.usageData.emitSuccess();
    }

    return exitCode;
  } catch (e) {
    // ToDo: add logging to the core, and log execution errors using the unified core logging.
    errorHandler(e);

    if (e.message) {
      print.error(e.message);
    }

    if (e.stack) {
      print.info(e.stack);
    }

    return 1;
  }
}

export async function executeAmplifyCommand(context: Context) {
  if (context.input.command) {
    const commandPath = path.normalize(path.join(__dirname, 'commands', context.input.command));
    const commandModule = await import(commandPath);

    await commandModule.run(context);
  }
}
