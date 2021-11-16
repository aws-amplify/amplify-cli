import { $TSContext } from "amplify-cli-core";
import { getProjectMeta } from './get-project-meta';

export function isValidGraphQLAuthError(message: string): boolean {
  return (
    message === `@auth directive with 'iam' provider found, but the project has no IAM authentication provider configured.` ||
    message === `@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.` ||
    message === `@auth directive with 'oidc' provider found, but the project has no OPENID_CONNECT authentication provider configured.` ||
    message === `@auth directive with 'apiKey' provider found, but the project has no API Key authentication provider configured.` ||
    message === `@auth directive with 'function' provider found, but the project has no Lambda authentication provider configured.`
  );
}

export async function handleValidGraphQLAuthError(context: $TSContext, message: string): Promise<boolean> {
  if (message === `@auth directive with 'iam' provider found, but the project has no IAM authentication provider configured.`) {
    await addGraphQLAuthRequirement(context, 'AWS_IAM');
    return true;
  } else if (
      checkIfAuthExists() &&
      message === `@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.`
    ) {
      await addGraphQLAuthRequirement(context, 'AMAZON_COGNITO_USER_POOLS');
      return true;
  } else if (!context?.parameters?.options?.yes) {
    if (
      message ===
      `@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.`
    ) {
      await addGraphQLAuthRequirement(context, 'AMAZON_COGNITO_USER_POOLS');
      return true;
    } else if (
      message === `@auth directive with 'oidc' provider found, but the project has no OPENID_CONNECT authentication provider configured.`
    ) {
      await addGraphQLAuthRequirement(context, 'OPENID_CONNECT');
      return true;
    } else if (
      message === `@auth directive with 'apiKey' provider found, but the project has no API Key authentication provider configured.`
    ) {
      await addGraphQLAuthRequirement(context, 'API_KEY');
      return true;
    } else if (
      message === `@auth directive with 'function' provider found, but the project has no Lambda authentication provider configured.`
    ) {
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
 export function checkIfAuthExists() {
  const amplifyMeta = getProjectMeta();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = 'auth';

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];

    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === authServiceName) {
        authExists = true;
      }
    });
  }
  return authExists;
}