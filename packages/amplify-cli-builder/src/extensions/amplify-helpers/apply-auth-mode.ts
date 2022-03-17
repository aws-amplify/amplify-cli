import { $TSContext } from 'amplify-cli-core';
import { getProjectMeta } from './get-project-meta';

const errAuthMissingIAM = `@auth directive with 'iam' provider found, but the project has no IAM authentication provider configured.`;
const errAuthMissingUserPools = `@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.`;
const errAuthMissingOIDC = `@auth directive with 'oidc' provider found, but the project has no OPENID_CONNECT authentication provider configured.`;
const errAuthMissingApiKey = `@auth directive with 'apiKey' provider found, but the project has no API Key authentication provider configured.`;
const errAuthMissingLambda = `@auth directive with 'function' provider found, but the project has no Lambda authentication provider configured.`;

export function isValidGraphQLAuthError(message: string): boolean {
  return [errAuthMissingIAM, errAuthMissingUserPools, errAuthMissingOIDC, errAuthMissingApiKey, errAuthMissingLambda].includes(message);
}

export async function handleValidGraphQLAuthError(context: $TSContext, message: string): Promise<boolean> {
  if (message === errAuthMissingIAM) {
    await addGraphQLAuthRequirement(context, 'AWS_IAM');
    return true;
  } else if (checkIfAuthExists() && message === errAuthMissingUserPools) {
    await addGraphQLAuthRequirement(context, 'AMAZON_COGNITO_USER_POOLS');
    return true;
  } else if (!context?.parameters?.options?.yes) {
    if (message === errAuthMissingUserPools) {
      await addGraphQLAuthRequirement(context, 'AMAZON_COGNITO_USER_POOLS');
      return true;
    } else if (message === errAuthMissingOIDC) {
      await addGraphQLAuthRequirement(context, 'OPENID_CONNECT');
      return true;
    } else if (message === errAuthMissingApiKey) {
      await addGraphQLAuthRequirement(context, 'API_KEY');
      return true;
    } else if (message === errAuthMissingLambda) {
      await addGraphQLAuthRequirement(context, 'AWS_LAMBDA');
      return true;
    }
  }
  return false;
}

async function addGraphQLAuthRequirement(context, authType): Promise<any> {
  return await context.amplify.invokePluginMethod(context, 'api', undefined, 'addGraphQLAuthorizationMode', [
    context,
    {
      authType: authType,
      printLeadText: true,
      authSettings: undefined,
    },
  ]);
}

/**
 * Query Amplify Metafile and check if Auth is configured
 * @param context
 * @returns true if Auth is configured else false
 */
export function checkIfAuthExists(): boolean {
  const amplifyMeta = getProjectMeta();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  const categoryResources = amplifyMeta[authCategory];
  if (categoryResources !== null && typeof categoryResources === 'object') {
    authExists = Object.keys(categoryResources).some(resource => categoryResources[resource].service === authServiceName);
  }
  return authExists;
}
