import { $TSContext } from 'amplify-cli-core';

export const invokePluginMethod = async <T>(
  context: $TSContext,
  category: string,
  service: string | undefined,
  method: string,
  args: any[],
): Promise<T> => {
  const pluginInfo = context.amplify.getCategoryPluginInfo(context, category, service);

  if (!pluginInfo) {
    throw new Error(`Plugin for category: ${category} was not found. Make sure Amplify CLI is properly installed.`);
  }

  const plugin: Record<string, any> = await import(pluginInfo.packageLocation);

  const pluginMethod: any = plugin[method];

  if (!pluginMethod || typeof pluginMethod !== 'function') {
    const error = new Error(`Method ${method} does not exist or not a function in category plugin: ${category}.`);

    error.name = 'MethodNotFound';
    error.stack = undefined;

    throw error;
  }

  return pluginMethod(...args);
};
