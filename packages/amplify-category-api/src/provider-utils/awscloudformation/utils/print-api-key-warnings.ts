// If adding or removing the API_KEY auth type, print a warning that resources that depend on the API must re-add the API as a dependency to have the API key parameter added / removed.
export const printApiKeyWarnings = (context, oldConfigHadApiKey: boolean, newConfigHasApiKey: boolean) => {
  if (oldConfigHadApiKey && !newConfigHasApiKey) {
    context.print.warning('The API_KEY auth type has been removed from the API.');
    context.print.warning(
      'If other resources depend on this API, run "amplify update <category>" and reselect this API to remove the dependency on the API key.',
    );
    context.print.warning('⚠️  This must be done before running "amplify push" to prevent a push failure');
  }

  if (!oldConfigHadApiKey && newConfigHasApiKey) {
    context.print.warning('The API_KEY auth type has been added to the API.');
    context.print.warning(
      '⚠️  If other resources depend on this API and need access to the API key, run "amplify update <category>" and reselect this API as a dependency to add the API key dependency.',
    );
  }
};
