import { $TSAny, $TSContext, stateManager, IPluginPlatform, CommandLineInput } from '@aws-amplify/amplify-cli-core';
import * as _ from 'lodash';
import { init } from './app-config';
import { attachExtensions, ProjectSettings } from '@aws-amplify/amplify-cli-core';
import { NoUsageData, UsageData } from './domain/amplify-usageData';
import { Context } from './domain/context';

/**
 * Initialize the context object
 */
export const constructContext = (pluginPlatform: IPluginPlatform, input: CommandLineInput): Context => {
  const context = new Context(pluginPlatform, input);
  attachExtensions(context as unknown as $TSContext);
  return context;
};

/**
 * returns true if the --headless flag is present
 */
export const isHeadlessCommand = (context: $TSAny): boolean => context.input.options && context.input.options.headless;

/**
 * Initialize and attach the usageData object to context
 */
export const attachUsageData = async (context: Context, processStartTimeStamp: number): Promise<void> => {
  const { AMPLIFY_CLI_ENABLE_USAGE_DATA } = process.env;
  const config = init(context);
  const usageTrackingEnabled = AMPLIFY_CLI_ENABLE_USAGE_DATA
    ? AMPLIFY_CLI_ENABLE_USAGE_DATA === 'true'
    : config.usageDataConfig.isUsageTrackingEnabled;
  if (usageTrackingEnabled) {
    context.usageData = UsageData.Instance;
    context.usageData.setIsHeadless(isHeadlessCommand(context));
  } else {
    context.usageData = NoUsageData.Instance;
    context.usageData.setIsHeadless(isHeadlessCommand(context));
  }
  const accountId = getSafeAccountId();
  context.usageData.init(
    config.usageDataConfig.installationUuid,
    getVersion(context),
    context.input,
    accountId,
    getProjectSettings(),
    processStartTimeStamp,
  );
};

const getSafeAccountId = (): string => {
  const emptyString = '';
  if (!stateManager.metaFileExists()) {
    return emptyString;
  }
  const amplifyMeta = stateManager.getMeta();
  const stackId = _.get(amplifyMeta, ['providers', 'awscloudformation', 'StackId']) as string;
  if (!stackId) {
    return emptyString;
  }
  const splitString = stackId.split(':');
  if (splitString.length > 4) {
    return splitString[4];
  }

  return emptyString;
};

const getVersion = (context: Context): string => context.pluginPlatform.plugins.core[0].packageVersion;

export const getProjectSettings = (): ProjectSettings => {
  const projectSettings: ProjectSettings = {} as unknown as ProjectSettings;
  if (stateManager.projectConfigExists()) {
    const projectConfig = stateManager.getProjectConfig();
    const { frontend } = projectConfig;
    projectSettings.frontend = frontend;
    projectSettings.framework = projectConfig?.[frontend]?.framework;
  }

  if (stateManager.localEnvInfoExists()) {
    const { defaultEditor } = stateManager.getLocalEnvInfo();
    projectSettings.editor = defaultEditor;
  }

  return projectSettings;
};
