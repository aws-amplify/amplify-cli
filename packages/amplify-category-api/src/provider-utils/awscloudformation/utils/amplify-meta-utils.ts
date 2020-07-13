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
