import { stateManager, $TSContext, AmplifyError } from '@aws-amplify/amplify-cli-core';

/**
 * returns app ID from amplify-meta.json or inputParams
 */
export const resolveAppId = (context: $TSContext): string => {
  if (stateManager.metaFileExists()) {
    const meta = stateManager.getMeta();
    if (meta?.providers?.awscloudformation?.AmplifyAppId) {
      return meta.providers.awscloudformation.AmplifyAppId;
    }
    throw new AmplifyError('ProjectAppIdResolveError', {
      message: 'Could not find AmplifyAppId in amplify-meta.json.',
    });
  } else if (context?.exeInfo?.inputParams?.amplify?.appId) {
    return context.exeInfo.inputParams.amplify.appId;
  } else {
    throw new AmplifyError('ProjectAppIdResolveError', {
      message: 'Failed to resolve appId.',
    });
  }
};
