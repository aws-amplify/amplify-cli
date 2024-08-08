import {
  $TSAny,
  $TSContext,
  BannerMessage,
  CLIContextEnvironmentProvider,
  exitOnNextTick,
  FeatureFlags,
  JSONUtilities,
  pathManager,
  stateManager,
  HooksMeta,
  AmplifyError,
  constants,
} from '@aws-amplify/amplify-cli-core';
import { CLIInput } from './domain/command-input';
import { isCI } from 'ci-info';
import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { saveAll as saveAllEnvParams, ServiceUploadHandler } from '@aws-amplify/amplify-environment-parameters';
import { logInput } from './conditional-local-logging-init';
import { attachUsageData, constructContext } from './context-manager';
import { displayBannerMessages } from './display-banner-messages';
import { Context } from './domain/context';
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
import { init as initErrorHandler, handleException, handleUnhandledRejection } from './amplify-exception-handler';

export { UsageData } from './domain/amplify-usageData';

// Adjust defaultMaxListeners to make sure Inquirer will not fail under Windows because of the multiple subscriptions
// https://github.com/SBoudrias/Inquirer.js/issues/887
EventEmitter.defaultMaxListeners = 1000;

// Change stacktrace limit to max value to capture more details if needed
Error.stackTraceLimit = Number.MAX_SAFE_INTEGER;

process.on('uncaughtException', (e): void => void handleException(e));

// In this handler we have to re-throw the error otherwise the process hangs there.
process.on('unhandledRejection', handleUnhandledRejection);

/**
 * Disable the CDK deprecation warning in production but not in CI/debug mode
 */
const disableCDKDeprecationWarning = () => {
  const isDebug = process.argv.includes('--debug') || process.env.AMPLIFY_ENABLE_DEBUG_OUTPUT === 'true';
  if (!isDebug) {
    process.env.JSII_DEPRECATED = 'quiet';
  }
};

/**
 * Command line entry point
 */
export const run = async (startTime: number): Promise<void> => {
  deleteOldVersion();

  //TODO: This is a temporary suppression for CDK deprecation warnings, which should be removed after the migration is complete
  // Most of these warning messages are targeting searchable directive, which needs to migrate from elastic search to open search
  // This is not disabled in debug mode
  disableCDKDeprecationWarning();

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

  let verificationResult = await verifyInput(pluginPlatform, input);

  // invalid input might be because plugin platform might have been updated,
  // scan and try again
  if (!verificationResult.verified) {
    if (verificationResult.message) {
      printer.warn(verificationResult.message);
    }
    pluginPlatform = await scan();
    input = getCommandLineInput(pluginPlatform);
    verificationResult = await verifyInput(pluginPlatform, input);
  }
  if (!verificationResult.verified) {
    if (verificationResult.helpCommandAvailable) {
      input.command = constants.HELP;
      input.plugin = constants.CORE;
    } else {
      throw new AmplifyError('InputValidationError', {
        message: verificationResult.message ?? 'Invalid input',
        details: JSON.stringify(verificationResult),
        link: 'https://docs.amplify.aws/cli/project/troubleshooting/',
      });
    }
  }
  const context = constructContext(pluginPlatform, input);
  await attachUsageData(context, startTime);
  initErrorHandler(context);

  rewireDeprecatedCommands(input);
  logInput(input);
  const hooksMeta = HooksMeta.getInstance(input);
  hooksMeta.setAmplifyVersion(getAmplifyVersion());

  // Initialize feature flags
  const contextEnvironmentProvider = new CLIContextEnvironmentProvider({
    getEnvInfo: context.amplify.getEnvInfo,
  });

  const projectPath = pathManager.findProjectRoot() ?? process.cwd();
  const useNewDefaults = !stateManager.projectConfigExists(projectPath);

  await FeatureFlags.initialize(contextEnvironmentProvider, useNewDefaults);
  prompter.setFlowData(context.usageData);

  if (!(await migrateTeamProviderInfo(context))) {
    throw new AmplifyError('MigrationError', {
      message: 'An error occurred while migrating team provider info',
      link: 'https://docs.amplify.aws/cli/project/troubleshooting/',
    });
  }

  process.on('SIGINT', (): void => void sigIntHandler(context));

  // Skip NodeJS version check and migrations if Amplify CLI is executed in CI/CD or
  // the command is not push
  if (!isCI && context.input.command === 'push') {
    await checkProjectConfigVersion(context);
  }

  // For mobile hub migrated project validate project and command to be executed
  ensureMobileHubCommandCompatibility(context as unknown as $TSContext);

  // Display messages meant for most executions
  await displayBannerMessages(input);
  await executeCommand(context);

  // no command supplied defaults to help, give update notification at end of execution
  if (input.command === 'help') {
    // Checks for available update, defaults to a 1 day interval for notification
    notify({ defer: true, isGlobal: true });
  }

  if (context.input.command === 'push') {
    const { providers } = stateManager.getProjectConfig(undefined, { throwIfNotExist: false, default: {} });
    const CloudFormationProviderName = 'awscloudformation';
    let uploadHandler: ServiceUploadHandler | undefined;
    if (Array.isArray(providers) && providers.find((value) => value === CloudFormationProviderName)) {
      uploadHandler = await context.amplify.invokePluginMethod(
        context,
        CloudFormationProviderName,
        undefined,
        'getEnvParametersUploadHandler',
        [context],
      );
    }
    await saveAllEnvParams(uploadHandler);
  } else {
    await saveAllEnvParams();
  }

  const exitCode = process.exitCode || 0;
  if (exitCode === 0) {
    await context.usageData.emitSuccess();
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
async function sigIntHandler(context: Context): Promise<void> {
  void context.usageData.emitAbort();

  try {
    await context.amplify.runCleanUpTasks(context);
  } catch (err) {
    context.print.warning(`Could not run clean up tasks\nError: ${err.message}`);
  }
  context.print.warning('^Aborted!');

  exitOnNextTick(2);
}

/**
 * entry from library call
 */
export const execute = async (input: CLIInput): Promise<void> => {
  let pluginPlatform = await getPluginPlatform();
  let verificationResult = await verifyInput(pluginPlatform, input);

  if (!verificationResult.verified) {
    if (verificationResult.message) {
      printer.warn(verificationResult.message);
    }
    pluginPlatform = await scan();
    verificationResult = await verifyInput(pluginPlatform, input);
  }

  if (!verificationResult.verified) {
    if (verificationResult.helpCommandAvailable) {
      // eslint-disable-next-line no-param-reassign
      input.command = constants.HELP;
      input.plugin = constants.CORE;
    } else {
      throw new Error(verificationResult.message);
    }
  }

  const context = constructContext(pluginPlatform, input);

  // AFAICT this execute function is never used. But if it is, in this case we initialize usage data with a starting timestamp of now
  await attachUsageData(context, Date.now());
  initErrorHandler(context);

  process.on('SIGINT', (): void => void sigIntHandler(context));

  await executeCommand(context);

  const exitCode = process.exitCode || 0;
  if (exitCode === 0) {
    void context.usageData.emitSuccess();
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

// bump version to 12.13.0
