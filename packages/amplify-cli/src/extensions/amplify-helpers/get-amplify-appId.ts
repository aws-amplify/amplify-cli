import { getProjectMeta } from './get-project-meta';

/**
 * Get the Amplify App ID from `amplify-meta.json`
 */
export const getAmplifyAppId = (): string => {
  const meta = getProjectMeta();

  const appId = meta?.providers?.awscloudformation?.AmplifyAppId;
  if (!appId) {
    throw new Error('Amplify App ID not found in `amplify-meta.json`');
  }
  return appId;
};
