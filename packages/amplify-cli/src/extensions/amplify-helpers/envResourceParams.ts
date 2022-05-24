import { getEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { $TSContext, $TSObject } from 'amplify-cli-core';

/**
 * Save environment-specific resource params
 */
export const saveEnvResourceParameters = (__: $TSContext, category: string, resource: string, parameters?: $TSObject): void => {
  if (!parameters) {
    return;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hostedUIProviderCreds, ...nonSecretParams } = parameters;

  getEnvParamManager().getResourceParamManager(category, resource).setParams(nonSecretParams);
};

/**
 * load env specific parameter for a resource
 *
 * @deprecated use getEnvParamManager directly
 */
export const loadEnvResourceParameters = (
  __: $TSContext, category: string, resource: string,
): $TSObject => getEnvParamManager().getResourceParamManager(category, resource).getAllParams();

/**
 * Remove env specific resource param from TPI and/or deployment secrets
 */
export const removeResourceParameters = (__: $TSContext, category: string, resource: string): void => {
  getEnvParamManager().deleteResource(category, resource);
};
