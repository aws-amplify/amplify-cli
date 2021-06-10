import { $TSContext } from 'amplify-cli-core';
import { removeSecretCloud, SecretDeltas } from 'amplify-function-plugin-interface';
import { getFunctionCloudFormationTemplate, setFunctionCloudFormationTemplate } from '../utils/cloudformationHelpers';
import { getFullyQualifiedSecretName, getFunctionSecretPrefix } from './secretName';
import { updateSecretsInCfnTemplate } from './secretsCfnModifier';
import { SSMClientWrapper } from './ssmClientWrapper';
import { getFunctionSecretNames, setLocalFunctionSecretNames } from './functionParametersSecretsController';
import * as path from 'path';
import { prePushMissingSecretsWalkthrough } from '../service-walkthroughs/secretValuesWalkthrough';
import { secretNamesToSecretDeltas } from './secretDeltaUtilities';

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
   *
   * Note: Local and cloud removal are separate operations because a secret cannot be removed in the cloud before the push.
   * If the deployed function is depending on the secret's presence, removing it immediately would break the currently deployed function.
   * To account for this, maintaining secrets state is a 3 step process:
   * 1. When doing CRUD operations on secrets in the walkthrough, remove operations should be set to 'removeLocal' and the resulting deltas from the walkthrough should be passed to 'syncSecretDeltas' (this method)
   * 2. During the prePush hook, call 'ensureNewLocalSecretsSyncedToCloud'. This will prompt for values for any secrets that are present locally but not in the cloud (this could be the case when git merging from another branch)
   * 3. During the postPush hook, call 'ensureRemovedLocalSecretsSyncedToCloud'. This will check if any secrets have been removed locally but not in the cloud and clean up removed secrets.
   *
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
        case 'removeInCloud':
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

  ensureNewLocalSecretsSyncedToCloud = async (functionName: string) => {
    const addedSecrets = await this.computeLocallyAddedSecrets(functionName);
    if (!addedSecrets.length) {
      return;
    }
    const delta = await prePushMissingSecretsWalkthrough(functionName, addedSecrets);
    await this.syncSecretDeltas(delta, functionName);
  };

  ensureRemovedLocalSecretsSyncedToCloud = async (functionName: string) => {
    const removedSecretNames = await this.computeLocallyRemovedSecrets(functionName);
    if (!removedSecretNames.length) {
      return;
    }
    await this.syncSecretDeltas(secretNamesToSecretDeltas(removedSecretNames, removeSecretCloud), functionName);
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
  private computeLocallyAddedSecrets = async (functionName: string): Promise<string[]> => {
    const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
    const localSecretNames = await getFunctionSecretNames(functionName);
    return localSecretNames.filter(name => !cloudSecretNames.includes(name));
  };

  /**
   * Computes the function secrets that have been removed locally but still exist in the cloud
   */
  private computeLocallyRemovedSecrets = async (functionName: string): Promise<string[]> => {
    const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
    const localSecretNames = await getFunctionSecretNames(functionName);
    return cloudSecretNames.filter(name => !localSecretNames.includes(name));
  };
}
