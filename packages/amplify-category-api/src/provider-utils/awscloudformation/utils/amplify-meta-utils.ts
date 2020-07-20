export const checkIfAuthExists = context => {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  let authResourceName;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];
    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === authServiceName) {
        authResourceName = resource;
      }
    });
  }
  return authResourceName;
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
