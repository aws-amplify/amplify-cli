import { $TSContext } from 'amplify-cli-core';
import { SecretDeltas } from 'amplify-function-plugin-interface';
import { getFunctionCloudFormationTemplate, setFunctionCloudFormationTemplate } from '../utils/cloudformationHelpers';
import { getFullyQualifiedSecretName, getFunctionSecretPrefix } from './secretName';
import { updateSecretsInCfnTemplate } from './secretsCfnModifier';
import { SSMClientWrapper } from './ssmClientWrapper';
import { getLocalFunctionSecretNames, setLocalFunctionSecretNames } from './functionParametersSecretsController';
import * as path from 'path';

/**
 * Manages the state of function secrets in both Parameter store and the local CloudFormation template
 */
export class FunctionSecretsStateManager {
  private static instance: FunctionSecretsStateManager;

  static getInstance = async (context: $TSContext) => {
    if (!FunctionSecretsStateManager.instance) {
      FunctionSecretsStateManager.instance = new FunctionSecretsStateManager(await SSMClientWrapper.getInstance(context));
    }
    return FunctionSecretsStateManager.instance;
  };

  private constructor(private readonly ssmClientWrapper: SSMClientWrapper) {}

  /**
   * This is the main entry point to ensure secret state is in sync.
   * It will update deltas in SSM as well as make calls to update the CFN template and other local state.
   * @param secretDeltas describes changes that should be made to the secrets state
   * @param functionName the function name to apply the delta
   * @param envName the environment name. If not specified, the current environment is assumed
   * @returns resolved promise when all updates are complete
   */
  syncSecretDeltas = async (secretDeltas: SecretDeltas, functionName: string, envName?: string): Promise<void> => {
    if (!secretDeltas) {
      return;
    }
    // update values in Parameter Store
    Object.entries(secretDeltas).forEach(([secretName, secretDelta]) => {
      const fullyQualifiedSecretName = getFullyQualifiedSecretName(secretName, functionName, envName);
      switch (secretDelta.operation) {
        case 'remove':
          this.ssmClientWrapper.deleteSecret(fullyQualifiedSecretName);
          break;
        case 'setValue':
          this.ssmClientWrapper.setSecret(fullyQualifiedSecretName, secretDelta.value);
      }
    });

    const origTemplate = await getFunctionCloudFormationTemplate(functionName);
    const newTemplate = await updateSecretsInCfnTemplate(origTemplate, secretDeltas, functionName);
    await setFunctionCloudFormationTemplate(functionName, newTemplate);

    await setLocalFunctionSecretNames(functionName, secretDeltas);
  };

  getCloudFunctionSecretNames = async (functionName: string, envName?: string) => {
    const prefix = getFunctionSecretPrefix(functionName, envName);
    const parts = path.parse(prefix);
    const unfilteredSecrets = await this.ssmClientWrapper.getSecretNamesByPath(parts.dir);
    return unfilteredSecrets.filter(secretName => secretName.startsWith(prefix)).map(secretName => secretName.slice(prefix.length));
  };

  /**
   * Computes the secrets that exist in the local function secret state but do not exist in the cloud
   */
  computeLocallyAddedSecrets = async (functionName: string): Promise<string[]> => {
    const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
    const localSecretNames = await getLocalFunctionSecretNames(functionName);
    return localSecretNames.filter(name => !cloudSecretNames.includes(name));
  };

  /**
   * Computes the function secrets that have been removed locally but still exist in the cloud
   */
  computeLocallyRemovedSecrets = async (functionName: string): Promise<string[]> => {
    const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
    const localSecretNames = await getLocalFunctionSecretNames(functionName);
    return cloudSecretNames.filter(name => !localSecretNames.includes(name));
  };
}
