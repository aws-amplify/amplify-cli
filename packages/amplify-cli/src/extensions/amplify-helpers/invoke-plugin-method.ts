import { $TSAny, $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';

/**
 * invoke plugin method
 */
export const invokePluginMethod = async <T>(
  context: $TSContext,
  category: string,
  service: string | undefined,
  method: string,
  args: $TSAny[],
): Promise<T> => {
  const pluginInfo = context.amplify.getCategoryPluginInfo(context, category, service);

  if (!pluginInfo) {
    throw new AmplifyError('PluginNotFoundError', {
      message: `Plugin for category: ${category} was not found.`,
      resolution: `Make sure Amplify CLI is properly installed. You may need to run \`amplify plugin scan\``,
    });
  }

  const plugin: Record<string, $TSAny> = await import(pluginInfo.packageLocation);
  const pluginMethod = plugin[method];

  if (!pluginMethod || typeof pluginMethod !== 'function') {
    throw new AmplifyError('PluginMethodNotFoundError', {
      message: `Method ${method} does not exist or is not a function in category plugin: ${category}.`,
    });
  }

  return pluginMethod(...args);
};
