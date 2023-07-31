import { $TSContext, $TSMeta, AmplifyCategories, AmplifyError, AmplifySupportedService, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { messages } from '../../provider-utils/awscloudformation/assets/string-maps';
import { AuthInputState } from '../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';

export const name = 'remove';
const category = 'auth';

/**
 * Entry point for remove auth
 */
export const run = async (context: $TSContext): Promise<void> => {
  const { amplify, parameters } = context;
  const resourceName = parameters.first;
  const meta = stateManager.getMeta();

  throwErrorIfProjectHasAnalytics(meta);

  const hasPossiblyDependentResources = Object.keys(meta).some(
    (categoryName) => ['api', 'storage', 'function'].includes(categoryName) && Object.keys(meta[categoryName]).length > 0,
  );
  if (hasPossiblyDependentResources) {
    printer.warn(messages.dependenciesExists);
  }

  const authResourceName = Object.keys(meta.auth).filter(
    (resourceKey) => meta.auth[resourceKey].service === AmplifySupportedService.COGNITO,
  );

  const resource = await amplify.removeResource(context, category, resourceName);
  if (resource?.service === AmplifySupportedService.COGNITOUSERPOOLGROUPS) {
    // update cli input here
    const cliState = new AuthInputState(context, authResourceName[0]);
    const cliInputPayload = cliState.getCLIInputPayload();
    cliInputPayload.cognitoConfig.userPoolGroupList = [];
    await cliState.saveCLIInputPayload(cliInputPayload);
  }
};

const throwErrorIfProjectHasAnalytics = (meta: $TSMeta): void => {
  const analyticsCategoryMeta = meta[AmplifyCategories.ANALYTICS];
  if (!analyticsCategoryMeta) return;
  const analyticsResourceNames = Object.keys(analyticsCategoryMeta);
  if (analyticsResourceNames.length === 0) return;
  throw new AmplifyError('ResourceInUseError', {
    message: 'Auth cannot be removed because the analytics category depends on it',
    resolution: 'Run `amplify remove analytics` first, then retry removing auth',
  });
};
