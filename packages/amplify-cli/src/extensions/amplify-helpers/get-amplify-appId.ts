import { getProjectMeta } from './get-project-meta';

/**
 * Get the Amplify App ID from `amplify-meta.json`
 */
export const getAmplifyAppId = (): string | undefined => {
  const meta = getProjectMeta();

  return meta?.providers?.awscloudformation?.AmplifyAppId;
};
