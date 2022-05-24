import { $TSContext } from 'amplify-cli-core';
import { syncOAuthSecretsToCloud } from '../provider-utils/awscloudformation/auth-secret-manager/sync-oauth-secrets';
import { getAuthResourceName } from '../utils/getAuthResourceName';

/**
 * pre deploy handler for auth
 */
export const prePushHandler = async (context: $TSContext): Promise<void> => {
  const authResourceName = await getAuthResourceName(context);
  await syncOAuthSecretsToCloud(context, authResourceName);
};
