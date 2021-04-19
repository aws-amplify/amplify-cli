import { Context } from './domain/context';
import { Input } from './domain/input';
import { PluginPlatform } from './domain/plugin-platform';
import { attachExtentions } from './context-extensions';
import { init } from './app-config';
import { UsageData, NoUsageData } from './domain/amplify-usageData';
import { ProjectSettings } from './domain/amplify-usageData/UsageDataPayload';
import { stateManager } from 'amplify-cli-core';

export function constructContext(pluginPlatform: PluginPlatform, input: Input): Context {
  const context = new Context(pluginPlatform, input);
  attachExtentions(context);
  return context;
}

export async function attachUsageData(context: Context) {
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
  context.usageData.init(config.usageDataConfig.installationUuid, getVersion(context), context.input, '', getProjectSettings());
}

const getVersion = (context: Context) => context.pluginPlatform.plugins.core[0].packageVersion;

const getProjectSettings = (): ProjectSettings => {
  const projectSettings: ProjectSettings = {};
  if (stateManager.projectConfigExists()) {
    const projectConfig = stateManager.getProjectConfig();
    const frontend = projectConfig['frontend'];
    projectSettings.frontend = frontend;
    projectSettings.framework = projectConfig?.frontend?.framework;
  }

  if (stateManager.localEnvInfoExists()) {
    const { defaultEditor } = stateManager.getLocalEnvInfo();
    projectSettings.editor = defaultEditor;
  }

  return projectSettings;
};
export function persistContext(context: Context): void {
  // write to the backend and current backend
  // and get the frontend plugin to write to the config files.
}
