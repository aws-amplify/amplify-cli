import { $TSContext } from 'amplify-cli-core';

export function getFrontendPlugins(context: $TSContext) {
  const frontendPlugins = {};

  context.runtime.plugins
    .filter((plugin: { pluginType: string }) => plugin.pluginType === 'frontend')
    .map((plugin: { pluginName: string; directory: string }) => (frontendPlugins[plugin.pluginName] = plugin.directory));

  // If the CLI does not find any frontend plugins it means that the installation is
  // probably corrupt.
  if (Object.keys(frontendPlugins).length === 0) {
    const errorMessage = `Can't find any frontend plugins configured for the CLI.`;
    context.print.error(errorMessage);
    context.print.info("Run 'amplify plugin scan' to scan your system for plugins.");
    const error = new Error(errorMessage);
    error.stack = undefined;
    throw error;
  }

  return frontendPlugins;
}
