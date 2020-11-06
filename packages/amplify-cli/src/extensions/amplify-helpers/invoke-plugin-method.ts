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

  if (!pluginMethod) {
    throw new Error(`Method ${method} does not exist in category plugin: ${category}.`);
  }

  let methodResult = pluginMethod(...args);

  // Check if result is a Promise and await it, return the unwrapped result
  if (methodResult.then && typeof methodResult.then === 'function') {
    return methodResult;
  }

  // Wrap the result in a promise
  return new Promise((resolve, _) => {
    resolve(methodResult);
  });
};
