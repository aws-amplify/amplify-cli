import { stateManager, $TSContext } from 'amplify-cli-core';

export function resolveAppId(context: $TSContext): string {
  if (stateManager.metaFileExists()) {
    const meta = stateManager.getMeta();
    if (meta?.provider?.awscloudformation?.AmplifyAppId) {
      return meta.provider.awscloudformation.AmplifyAppId;
    }
    throw new Error('Could not find AmplifyAppId in amplify-meta.json.');
  } else if (context?.exeInfo?.inputParams?.amplify?.appId) {
    return context.exeInfo.inputParams.amplify.appId;
  } else {
    throw new Error('Failed to resolve appId');
  }
}
