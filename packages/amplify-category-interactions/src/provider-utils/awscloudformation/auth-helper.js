const os = require('os');
const CategoryName = 'interactions';
const { AmplifyError } = require('@aws-amplify/amplify-cli-core');

async function ensureAuth(context, resourceName) {
  const interactionsRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
  const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    interactionsRequirements,
    context,
    CategoryName,
    resourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new AmplifyError('ConfigurationError', {
      message: 'The imported auth config is not compatible with the specified interactions config',
      details: checkResult.errors.join(os.EOL),
      resolution: 'Manually configure the imported auth resource according to the details above',
    });
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    context.print.warning(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    try {
      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
        context,
        CategoryName,
        resourceName,
        interactionsRequirements,
      ]);
    } catch (error) {
      context.print.error(error);
      throw error;
    }
  }
}

module.exports = {
  ensureAuth,
};
