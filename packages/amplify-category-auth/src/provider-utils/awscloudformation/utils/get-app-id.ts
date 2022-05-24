import { stateManager } from 'amplify-cli-core';

/**
 * returns the appID of the project if exists
 */
export const getAppId = () : string => {
  const meta = stateManager.getMeta(undefined, { throwIfNotExist: false });
  const appId = meta?.providers?.awscloudformation?.AmplifyAppId;
  if (!appId) {
    throw new Error('Could not find an Amplify AppId in the amplify-meta.json file. Make sure your project is initialized in the cloud.');
  }
  return appId;
};
