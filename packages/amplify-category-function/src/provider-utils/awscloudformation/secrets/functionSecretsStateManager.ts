import { $TSContext } from 'amplify-cli-core';
import { SecretDeltas } from 'amplify-function-plugin-interface';
import { getFunctionCloudFormationTemplate, setFunctionCloudFormationTemplate } from '../utils/cloudformationHelpers';
import { getFullyQualifiedSecretName, getFunctionSecretPrefix } from './secretName';
import { updateSecretsInCfnTemplate } from './secretsCfnModifier';
import { SSMClientWrapper } from './ssmClientWrapper';
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
  };

  getExistingFunctionSecretNames = async (functionName: string, envName?: string) => {
    const prefix = getFunctionSecretPrefix(functionName, envName);
    const parts = path.parse(prefix);
    const unfilteredSecrets = await this.ssmClientWrapper.getExistingSecretNamesByPath(parts.dir);
    return unfilteredSecrets.filter(secretName => path.parse(secretName).base.startsWith(parts.base));
  };

  /**
   * Clones secrets for all functions from one amplify env to another
   * @param sourceEnv The source env to read secrets from
   * @param destinationEnv The destination env to write secrets to
   * @param overrides Specifies any modifications that should be made to the values in source before writing to destination
   */
  cloneSecrets = async (sourceEnv: string, destinationEnv: string, overrides: Record<string, SecretDeltas>) => {};

  /**
   * Remove all function secrets for the given environment
   */
  removeEnvironmentSecrets = async (envName: string) => {};
}
