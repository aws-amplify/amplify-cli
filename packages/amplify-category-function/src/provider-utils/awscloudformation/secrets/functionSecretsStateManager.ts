import { $TSContext, stateManager } from "amplify-cli-core";
import { SecretDeltas } from "amplify-function-plugin-interface";
import { posix as path } from 'path';
import { SSMClientWrapper } from "./ssmClientWrapper";

export class FunctionSecretsStateManager {
  private static instance: FunctionSecretsStateManager;

  static getInstance = async (context: $TSContext, functionName: string) => {
    if (!FunctionSecretsStateManager.instance) {
      FunctionSecretsStateManager.instance = new FunctionSecretsStateManager(await SSMClientWrapper.getInstance(context), functionName);
    }
    return FunctionSecretsStateManager.instance;
  };

  private constructor(private readonly ssmClientWrapper: SSMClientWrapper, private readonly functionName: string) { };

  syncSecretDeltas = async (secretDeltas: SecretDeltas) => {
    Object.entries(secretDeltas).forEach(([secretName, secretDelta]) => {
      switch (secretDelta.operation) {
        case 'remove':
          this.ssmClientWrapper.deleteSecret(this.getFullyQualifiedSecretName(secretName));
          break;
        case 'setValue':
          this.ssmClientWrapper.setSecret(this.getFullyQualifiedSecretName(secretName), secretDelta.value);
      }
    })
  }

  private getFullyQualifiedSecretName = (secretName: string) => {
    return path.join(this.getSecretPrefix(), secretName);
  }

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

