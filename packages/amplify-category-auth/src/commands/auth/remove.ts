export const name = 'remove';
const category = 'auth';
import { $TSContext, AmplifySupportedService, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';

export const run = async (context: $TSContext) => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  const meta = stateManager.getMeta();
  const dependentResources = Object.keys(meta).some(e => {
    return ['analytics', 'api', 'storage', 'function'].includes(e) && Object.keys(meta[e]).length > 0;
  });
  if (dependentResources) {
    printer.info(messages.dependenciesExists);
  }
  const authResourceName = Object.keys(meta.auth).filter(resourceKey => {
    return meta.auth[resourceKey].service === AmplifySupportedService.COGNITO;
  });

  try {
    const resource = await amplify.removeResource(context, category, resourceName);
    if (resource?.service === AmplifySupportedService.COGNITOUSERPOOLGROUPS) {
      // update cli input here
      const cliState = new AuthInputState(authResourceName[0]);
      const cliInputPayload = cliState.getCLIInputPayload();
      cliInputPayload.cognitoConfig.userPoolGroupList = [];
      cliState.saveCLIInputPayload(cliInputPayload);
    }
  } catch (err) {
    printer.info(err.stack);
    printer.error('There was an error removing the auth resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};
