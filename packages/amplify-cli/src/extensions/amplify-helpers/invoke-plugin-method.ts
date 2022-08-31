import {
  $TSAny, $TSContext, AmplifyError, AMPLIFY_SUPPORT_DOCS,
} from 'amplify-cli-core';

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
      resolution: `Please make sure Amplify CLI is properly installed (do you need to run \`amplify plugin scan\`?).`,
    });
  }

  const plugin: Record<string, $TSAny> = await import(pluginInfo.packageLocation);
  const pluginMethod = plugin[method];

  if (!pluginMethod || typeof pluginMethod !== 'function') {
    throw new AmplifyError('PluginMethodNotFoundError', {
      message: `Method ${method} does not exist or not a function in category plugin: ${category}.`,
      link: `${AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url}`,
    });
  }

  return pluginMethod(...args);
};
