import { $TSContext, stateManager } from "amplify-cli-core";
import { SecretDeltas } from "amplify-function-plugin-interface";
import { access } from "fs-extra";
import { posix as path } from 'path';
import { SSMClientWrapper } from "./ssmClientWrapper";

/**
 * Manages the state of function secrets in both Parameter store and the local CloudFormation template
 */
export class FunctionSecretsStateManager {
  private static instance: FunctionSecretsStateManager;

  static getInstance = async (context: $TSContext, functionName: string) => {
    if (!FunctionSecretsStateManager.instance) {
      FunctionSecretsStateManager.instance = new FunctionSecretsStateManager(await SSMClientWrapper.getInstance(context), functionName);
    }
    return FunctionSecretsStateManager.instance;
  };

  private constructor(private readonly ssmClientWrapper: SSMClientWrapper, private readonly functionName: string) { };

  /**
   *
   * @param secretDeltas
   */
  syncSecretDeltas = async (secretDeltas: SecretDeltas) => {
    // update values in Parameter Store
    Object.entries(secretDeltas).forEach(([secretName, secretDelta]) => {
      switch (secretDelta.operation) {
        case 'remove':
          this.ssmClientWrapper.deleteSecret(this.getFullyQualifiedSecretName(secretName));
          break;
        case 'setValue':
          this.ssmClientWrapper.setSecret(this.getFullyQualifiedSecretName(secretName), secretDelta.value);
      }
    });

    // update local CFN file
    const existingSecrets = Object.entries(secretDeltas)
      .filter(([_, secretDelta]) => secretDelta.operation !== 'remove')
      .reduce((acc, [secretName, secretDelta]) => ({ ...acc, [secretName]: secretDelta }), {} as SecretDeltas);

    //
  }

  private getFullyQualifiedSecretName = (secretName: string) => {
    return path.join(this.getSecretPrefix(), secretName);
  }

  // WARNING: be extreemly careful changing the secret prefix! (AKA you should probably never change this).
  // This format is expected by customer functions when they fetch SSM params
  private getSecretPrefix = () => {
    const projectName = stateManager.getProjectConfig()?.projectName;
    if (!projectName) {
      throw new Error('Could not determine the Amplify project name. Try running `amplfiy configure project` and specify a project name.');
    }
    const envName = stateManager.getLocalEnvInfo()?.envName;
    if (!envName) {
      throw new Error('Could not determine the current Amplify environment name. Try running `amplify env checkout`.');
    }
    return path.join(projectName, `${this.functionName}-${envName}`);
  }
}

