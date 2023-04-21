import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { getProjectMeta } from './get-project-meta';

const errAuthMissingIAM = `@auth directive with 'iam' provider found, but the project has no IAM authentication provider configured.`;
const errAuthMissingUserPools = `@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.`;
const errAuthMissingOIDC = `@auth directive with 'oidc' provider found, but the project has no OPENID_CONNECT authentication provider configured.`;
const errAuthMissingApiKey = `@auth directive with 'apiKey' provider found, but the project has no API Key authentication provider configured.`;
const errAuthMissingLambda = `@auth directive with 'function' provider found, but the project has no Lambda authentication provider configured.`;

/**
 * checks if the message comes from a graphql auth error
 */
export const isValidGraphQLAuthError = (message: string): boolean =>
  [errAuthMissingIAM, errAuthMissingUserPools, errAuthMissingOIDC, errAuthMissingApiKey, errAuthMissingLambda].includes(message);

/**
 * handles a valid graphql auth error
 */
export const handleValidGraphQLAuthError = async (context: $TSContext, message: string): Promise<boolean> => {
  if (message === errAuthMissingIAM) {
    await addGraphQLAuthRequirement(context, 'AWS_IAM');
    return true;
  }

  if (checkIfAuthExists() && message === errAuthMissingUserPools) {
    await addGraphQLAuthRequirement(context, 'AMAZON_COGNITO_USER_POOLS');
    return true;
  }

  if (!context?.parameters?.options?.yes) {
    if (message === errAuthMissingUserPools) {
      await addGraphQLAuthRequirement(context, 'AMAZON_COGNITO_USER_POOLS');
      return true;
    }
    if (message === errAuthMissingOIDC) {
      await addGraphQLAuthRequirement(context, 'OPENID_CONNECT');
      return true;
    }
    if (message === errAuthMissingApiKey) {
      await addGraphQLAuthRequirement(context, 'API_KEY');
      return true;
    }
    if (message === errAuthMissingLambda) {
      await addGraphQLAuthRequirement(context, 'AWS_LAMBDA');
      return true;
    }
  }
  return false;
};

const addGraphQLAuthRequirement = async (context, authType): Promise<$TSAny> =>
  context.amplify.invokePluginMethod(context, 'api', undefined, 'addGraphQLAuthorizationMode', [
    context,
    {
      authType,
      printLeadText: true,
      authSettings: undefined,
    },
  ]);

/**
 * Query Amplify Meta file and check if Auth is configured
 * @returns true if Auth is configured else false
 */
export const checkIfAuthExists = (): boolean => {
  const amplifyMeta = getProjectMeta();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  const categoryResources = amplifyMeta[authCategory];
  if (categoryResources !== null && typeof categoryResources === 'object') {
    authExists = Object.keys(categoryResources).some((resource) => categoryResources[resource].service === authServiceName);
  }
  return authExists;
};
