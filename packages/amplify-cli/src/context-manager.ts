import { stateManager } from 'amplify-cli-core';
import * as _ from 'lodash';
import { init } from './app-config';
// eslint-disable-next-line spellcheck/spell-checker
import { attachExtentions as attachExtensions } from './context-extensions';
import { NoUsageData, UsageData } from './domain/amplify-usageData';
import { ProjectSettings } from './domain/amplify-usageData/IUsageData';
import { Context } from './domain/context';
import { Input } from './domain/input';
import { PluginPlatform } from './domain/plugin-platform';

/**
 * Initialize the context object
 */
export const constructContext = (pluginPlatform: PluginPlatform, input: Input): Context => {
  const context = new Context(pluginPlatform, input);
  attachExtensions(context);
  return context;
};

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
  } else {
    context.usageData = NoUsageData.Instance;
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

const getProjectSettings = (): ProjectSettings => {
  const projectSettings: ProjectSettings = {};
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
