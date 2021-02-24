const os = require('os');

export async function enableGuestAuth(context, resourceName, allowUnauthenticatedIdentities) {
  const identifyRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities };

  const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    identifyRequirements,
    context,
    'predictions',
    resourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new Error(checkResult.errors.join(os.EOL));
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    context.print.warning(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    try {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
        context,
        'predictions',
        resourceName,
        identifyRequirements,
      ]);
    } catch (error) {
      context.print.error(error);
      throw error;
    }
  }
}
