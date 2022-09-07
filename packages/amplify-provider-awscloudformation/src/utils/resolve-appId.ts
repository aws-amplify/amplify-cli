import {
  stateManager, $TSContext, AMPLIFY_SUPPORT_DOCS, AmplifyError,
} from 'amplify-cli-core';

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
      link: AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
    });
  } else if (context?.exeInfo?.inputParams?.amplify?.appId) {
    return context.exeInfo.inputParams.amplify.appId;
  } else {
    throw new AmplifyError('ProjectAppIdResolveError', {
      message: 'Failed to resolve appId.',
      link: AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
    });
  }
};
