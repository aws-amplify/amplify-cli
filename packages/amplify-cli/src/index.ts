import * as fs from 'fs-extra';
import * as path from 'path';
import { $TSContext, CLIContextEnvironmentProvider, FeatureFlags, pathManager, stateManager, exitOnNextTick } from 'amplify-cli-core';
import { Input } from './domain/input';
import { getPluginPlatform, scan } from './plugin-manager';
import { getCommandLineInput, verifyInput } from './input-manager';
import { constructContext, persistContext, attachUsageData } from './context-manager';
import { print } from './context-extensions';
import { executeCommand } from './execution-manager';
import { Context } from './domain/context';
import { constants } from './domain/constants';
import { checkProjectConfigVersion } from './project-config-version-check';
import { notify } from './version-notifier';

// Adjust defaultMaxListeners to make sure Inquirer will not fail under Windows because of the multiple subscriptions
// https://github.com/SBoudrias/Inquirer.js/issues/887
import { EventEmitter } from 'events';
import { rewireDeprecatedCommands } from './rewireDeprecatedCommands';
import { ensureMobileHubCommandCompatibility } from './utils/mobilehub-support';
import { postInstallInitialization } from './utils/post-install-initialization';
EventEmitter.defaultMaxListeners = 1000;

// entry from commandline
export async function run() {
  let errorHandler = (e: Error) => {};
  try {
    let pluginPlatform = await getPluginPlatform();
    let input = getCommandLineInput(pluginPlatform);
    // with non-help command supplied, give notification before execution
    if (input.command !== 'help') {
      // Checks for available update, defaults to a 1 day interval for notification
      notify({ defer: false, isGlobal: true });
    }

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

    const context = constructContext(pluginPlatform, input);

    // Initialize feature flags
    const contextEnvironmentProvider = new CLIContextEnvironmentProvider({
      getEnvInfo: context.amplify.getEnvInfo,
    });

    const projectPath = pathManager.findProjectRoot() ?? process.cwd();
    const useNewDefaults = !stateManager.projectConfigExists(projectPath);

    await FeatureFlags.initialize(contextEnvironmentProvider, useNewDefaults);

    await attachUsageData(context);

    errorHandler = boundErrorHandler.bind(context);
    process.on('SIGINT', sigIntHandler.bind(context));

    await checkProjectConfigVersion(context);

    context.usageData.emitInvoke();

    // For mobile hub migrated project validate project and command to be executed
    if (!ensureMobileHubCommandCompatibility((context as unknown) as $TSContext)) {
      // Double casting until we have properly typed context
      return 1;
    }

    await executeCommand(context);

    const exitCode = process.exitCode || 0;

    if (exitCode === 0) {
      context.usageData.emitSuccess();
    }

    persistContext(context);

    // no command supplied defaults to help, give update notification at end of execution
    if (input.command === 'help') {
      // Checks for available update, defaults to a 1 day interval for notification
      notify({ defer: true, isGlobal: true });
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
    exitOnNextTick(1);
  }
}

function ensureFilePermissions(filePath) {
  // eslint-disable-next-line no-bitwise
  if (fs.existsSync(filePath) && (fs.statSync(filePath).mode & 0o777) === 0o644) {
    fs.chmodSync(filePath, '600');
  }
}

function boundErrorHandler(this: Context, e: Error) {
  this.usageData.emitError(e);
}

async function sigIntHandler(this: Context, e: any) {
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

    const context = await constructContext(pluginPlatform, input);
    await attachUsageData(context);
    errorHandler = boundErrorHandler.bind(context);
    process.on('SIGINT', sigIntHandler.bind(context));
    context.usageData.emitInvoke();
    await executeCommand(context);
    const exitCode = process.exitCode || 0;
    if (exitCode === 0) {
      context.usageData.emitSuccess();
    }
    persistContext(context);
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
