import { getBackendAmplifyMeta } from "./projectMeta";

/**
 * fetches appId from amplify meta
 */
export const getAppId = (projRoot: string): string => {
  const meta = getBackendAmplifyMeta(projRoot);
  return meta.providers.awscloudformation.AmplifyAppId;
};
