import { $TSContext } from 'amplify-cli-core';
import _ from 'lodash';

export const authConfigHasApiKey = authConfig => {
  if (!authConfig) {
    return false;
  }
  return (
    Array.of(authConfig.defaultAuthentication)
      .concat(authConfig.additionalAuthenticationProviders)
      .filter(auth => !!auth) // filter out undefined elements which can happen if there are no addtl auth providers
      .map(auth => auth.authenticationType)
      .findIndex(authType => authType === 'API_KEY') > -1
  );
};

export const checkIfAuthExists = context => {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let authResourceName;
  const authServiceName = 'Cognito';
  const authCategoryName = 'auth';

  if (amplifyMeta[authCategoryName] && Object.keys(amplifyMeta[authCategoryName]).length > 0) {
    const categoryResources = amplifyMeta[authCategoryName];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === authServiceName) {
        authResourceName = resource;
      }
    });
  }

  return authResourceName;
};

// Get the auth service based on the resource id in meta and if the resource is imported
// return the real user pool id otherwise undefined
export const getImportedAuthUserPoolId = (context: $TSContext): string | undefined => {
  const { amplifyMeta } = context.amplify.getProjectDetails();
  const authCategoryName = 'auth';
  const authServiceName = 'Cognito';

  const authCategory = _.get(amplifyMeta, [authCategoryName], undefined);

  // Get the first resource as only 1 auth category resource is supported by the CLI
  if (authCategory) {
    const authResourceKeys = Object.keys(authCategory).filter(
      (key: any) => authCategory[key].service === authServiceName && authCategory[key].serviceType === 'imported',
    ) as any;

    if (authResourceKeys.length === 1) {
      const userPoolId = _.get(authCategory[authResourceKeys[0]], ['output', 'UserPoolId'], undefined);

      if (!userPoolId) {
        throw new Error('UserPoolId cannot be retrieved from the imported resource.');
      }

      return userPoolId;
    }
  }

  // explicitly return undefined
  return undefined;
};

// some utility functions to extract the AppSync API name and config from amplify-meta

export const getAppSyncAuthConfig = projectMeta => {
  const entry = getAppSyncAmplifyMetaEntry(projectMeta);
  if (entry) {
    const value = entry[1] as any;
    return value && value.output ? value.output.authConfig : {};
  }
};

export const getAppSyncResourceName = (projectMeta: any): string | undefined => {
  const entry = getAppSyncAmplifyMetaEntry(projectMeta);
  if (entry) {
    return entry[0];
  }
};

// project meta is the contents of amplify-meta.json
// typically retreived using context.amplify.getProjectMeta()
const getAppSyncAmplifyMetaEntry = (projectMeta: any) => {
  return Object.entries(projectMeta.api || {}).find(([, value]) => (value as any).service === 'AppSync');
};
