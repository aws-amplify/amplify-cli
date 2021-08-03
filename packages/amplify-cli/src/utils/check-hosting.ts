import { getPluginInstance } from '../extensions/amplify-helpers/get-plugin-instance';

export async function hasCdBranches(context) {
  const appId = context.exeInfo.amplifyMeta.providers.awscloudformation.AmplifyAppId;
  const awsCloudPlugin = getPluginInstance(context, 'awscloudformation');
  const amplifyClient = await awsCloudPlugin.getConfiguredAmplifyClient(context, {});
  const result = await amplifyClient.listBranches({ appId }).promise();

  return result.branches.length > 0;
}
