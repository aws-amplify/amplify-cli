import { Context } from './domain/context';
import { Input } from './domain/input';
import { PluginPlatform } from './domain/plugin-platform';
import { attachExtentions } from './context-extensions';
import { init } from './app-config';
import { UsageData, NoUsageData } from './domain/amplify-usageData';

export function constructContext(pluginPlatform: PluginPlatform, input: Input): Context {
  const context = new Context(pluginPlatform, input);
  attachExtentions(context);
  return context;
}

export function attachUsageData(context: Context) {
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
  context.usageData.init(config.usageDataConfig.installationUuid, getVersion(context), context.input);
}

const getVersion = (context: Context) => context.pluginPlatform.plugins.core[0].packageVersion;

export function persistContext(context: Context): void {
  // write to the backend and current backend
  // and get the frontend plugin to write to the config files.
}
