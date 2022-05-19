import { $TSContext, AmplifySupportedService, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { removeOAuthSecretFromCloud } from '../../provider-utils/awscloudformation/auth-secret-manager/sync-oauth-secrets';

export const name = 'remove';
const category = 'auth';

/**
 * entry point to remove auth resource
 */
export const run = async (context: $TSContext): Promise<void> => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  const meta = stateManager.getMeta();
  const dependentResources = Object.keys(meta).some(e => ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0);
  if (dependentResources) {
    printer.info(messages.dependenciesExists);
  }
  const authResourceName = Object.keys(meta.auth).filter(resourceKey => meta.auth[resourceKey].service === AmplifySupportedService.COGNITO);
  const authResource = Object.keys(meta.auth);

  try {
    // remove oAuth secret from Parameter if only cognito reosurce is present
    // if there is a cognito userPoolGroup resource, then it will be deleted in first iteration
    if (authResource.length === 1) {
      await removeOAuthSecretFromCloud(context, authResourceName[0]);
    }
    const resource = await amplify.removeResource(context, category, resourceName);
    if (resource?.service === AmplifySupportedService.COGNITOUSERPOOLGROUPS) {
      // update cli input here
      const cliState = new AuthInputState(authResourceName[0]);
      const cliInputPayload = cliState.getCLIInputPayload();
      cliInputPayload.cognitoConfig.userPoolGroupList = [];
      await cliState.saveCLIInputPayload(cliInputPayload);
    }
  } catch (err) {
    printer.info(err.stack);
    printer.error('There was an error removing the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
