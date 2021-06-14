import { $TSContext, JSONUtilities, pathManager, ResourceName, stateManager } from 'amplify-cli-core';
import { retainSecret, SecretDeltas, SecretName, setSecret } from 'amplify-function-plugin-interface';
import * as path from 'path';
import { prePushMissingSecretsWalkthrough } from '../service-walkthroughs/secretValuesWalkthrough';
import { getFunctionCloudFormationTemplate, setFunctionCloudFormationTemplate } from '../utils/cloudformationHelpers';
import { categoryName, functionParametersFileName, ServiceName } from '../utils/constants';
import { createParametersFile } from '../utils/storeResources';
import { getExistingSecrets, secretNamesToSecretDeltas } from './secretDeltaUtilities';
import { getEnvSecretPrefix, getFullyQualifiedSecretName, getFunctionSecretPrefix } from './secretName';
import { updateSecretsInCfnTemplate } from './secretsCfnModifier';
import { SSMClientWrapper } from './ssmClientWrapper';

let secretsPendingRemoval: Record<ResourceName, SecretName[]> = {};

/**
 * Manages the state of function secrets in both Parameter store and the local CloudFormation template.
 *
 * Note: Local and cloud removal are separate operations because a secret cannot be removed in the cloud before the push.
 * The expected way to handle this is:
 * 1. During CLI workflows, call syncSecretDeltas with remove operations set to 'removeLocally'
 * 2. Before pushing, call storeSecretsPendingRemoval
 * 3. After the push completes, call syncSecretsPendingRemoval
 *
 * Additionally, it is possible that a customer adds a secret outside of a CLI workflow (such as merging from another git branch)
 * This needs to be resolved before pushing. To resolve this, the expected flow is:
 * 1. Call areAddedSecretsPending for each function in the project
 * 2. If this returns true, call ensureNewLocalSecretsSyncedToCloud for that function
 */
export class FunctionSecretsStateManager {
  private static instance: FunctionSecretsStateManager;

  static getInstance = async (context: $TSContext) => {
    if (!FunctionSecretsStateManager.instance) {
      FunctionSecretsStateManager.instance = new FunctionSecretsStateManager(context, await SSMClientWrapper.getInstance(context));
    }
    return FunctionSecretsStateManager.instance;
  };

  private constructor(private readonly context: $TSContext, private readonly ssmClientWrapper: SSMClientWrapper) {}

  /**
   * This is the main entry point to ensure secret state is in sync.
   * It will update deltas in SSM as well as make calls to update the CFN template and other local state.
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
        case 'remove':
          if (this.doRemoveSecretsInCloud(functionName)) {
            this.ssmClientWrapper.deleteSecret(fullyQualifiedSecretName);
          }
          break;
        case 'set':
          this.ssmClientWrapper.setSecret(fullyQualifiedSecretName, secretDelta.value);
      }
    });

    const origTemplate = await getFunctionCloudFormationTemplate(functionName);
    const newTemplate = await updateSecretsInCfnTemplate(origTemplate, secretDeltas, functionName);
    await setFunctionCloudFormationTemplate(functionName, newTemplate);

    await setLocalFunctionSecretState(functionName, secretDeltas);
  };

  /**
   * Checks that all locally defined secrets for the function are present in the cloud. If any are missing, it prompts for values
   */
  ensureNewLocalSecretsSyncedToCloud = async (functionName: string, interactive = true) => {
    const localSecretNames = getLocalFunctionSecretNames(functionName);
    if (!localSecretNames.length) {
      return;
    }
    const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
    const addedSecrets = localSecretNames.filter(name => !cloudSecretNames.includes(name));
    if (!addedSecrets.length) {
      return;
    }
    if (!interactive) {
      throw new Error(
        `The following secrets in ${functionName} do not have values: [${addedSecrets}]\nRun 'amplify push' interactively to specify values.`,
      );
    }
    const delta = await prePushMissingSecretsWalkthrough(functionName, addedSecrets);
    await this.syncSecretDeltas(delta, functionName);
  };

  deleteAllFunctionSecrets = async (functionName: string) => {
    const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
    await this.syncSecretDeltas(secretNamesToSecretDeltas(cloudSecretNames, removeSecretCloud), functionName);
  };

  /**
   * Syncs secretsPendingRemoval to the cloud.
   *
   * It is expected that storeSecretsPendingRemoval has been called before calling this function. If not, this function is a noop.
   */
  syncSecretsPendingRemoval = async () => {
    await Promise.all(
      Object.entries(secretsPendingRemoval).map(([functionName, secretNames]) =>
        this.syncSecretDeltas(secretNamesToSecretDeltas(secretNames, removeSecretCloud), functionName),
      ),
    );
    secretsPendingRemoval = {};
  };

  /**
   * Deletes all secrets under an environment prefix (/amplify/appId/envName/)
   * @param envName The environment to remove
   */
  deleteAllEnvironmentSecrets = async (envName: string) => {
    const secretNames = await this.ssmClientWrapper.getSecretNamesByPath(getEnvSecretPrefix(envName));
    await this.ssmClientWrapper.deleteSecrets(secretNames);
  };

  getEnvCloneDeltas = async (sourceEnv: string, functionName: string) => {
    const destDelta = secretNamesToSecretDeltas(getLocalFunctionSecretNames(functionName), retainSecret);
    const sourceCloudSecretNames = await this.ssmClientWrapper.getSecretNamesByPath(getFunctionSecretPrefix(functionName, sourceEnv));
    const sourceCloudSecrets = await this.ssmClientWrapper.getSecrets(
      sourceCloudSecretNames.map(name => getFullyQualifiedSecretName(name, functionName, sourceEnv)),
    );
    sourceCloudSecrets.reduce((acc, { secretName, secretValue }) => ({ ...acc, [secretName]: setSecret(secretValue) }), destDelta);
    return destDelta;
  };

  private getCloudFunctionSecretNames = async (functionName: string, envName?: string) => {
    const prefix = getFunctionSecretPrefix(functionName, envName);
    const parts = path.parse(prefix);
    const unfilteredSecrets = await this.ssmClientWrapper.getSecretNamesByPath(parts.dir);
    return unfilteredSecrets.filter(secretName => secretName.startsWith(prefix)).map(secretName => secretName.slice(prefix.length));
  };

  private doRemoveSecretsInCloud = (functionName: string): boolean => {
    const isFunctionPushed = stateManager.getCurrentMeta()?.[categoryName]?.[functionName] !== undefined;
    const isCommandPush = this.context.parameters.command === 'push';
    return !isFunctionPushed || isCommandPush;
  };
}

/**
 * It is expected that this function will be called before calling syncSecretsPendingRemoval.
 *
 * When a secret is removed, it must be removed after the corresponding CFN push is complete.
 * This function stores the secrets removed for any function in the project.
 *
 * Furthermore, functions that are removed must have all corresponding secrets removed after the push. However, once the push is complete,
 * the local project state has no way of knowing what functions were just removed or if they had secrets configured.
 * So this function also stores the secret names of all functions marked for removal
 *
 * @param context The Amplify context, used to determine which functions will be deleted
 * @param functionNames A list of all function names in the project
 */
export const storeSecretsPendingRemoval = async (context: $TSContext, functionNames: string[]) => {
  functionNames.forEach(functionName => {
    const { removed } = getSecretDiff(functionName);
    if (removed.length) {
      secretsPendingRemoval[functionName] = removed;
    }
  });

  await storeToBeRemovedFunctionsWithSecrets(context);
};

/**
 * Gets the secret names stored in function-parameters.json for the given function
 */
export const getLocalFunctionSecretNames = (functionName: string, options?: typeof defaultGetFunctionSecretNamesOptions) =>
  getLocalSecretNames(functionName, options) || [];

/**
 * Returns a best guess based on local state of whether the function has secrets in the cloud
 */
export const functionMayHaveSecrets = (functionName: string) => !!getLocalSecretNames(functionName);

// Below are some private helper functions for managing local secret state

type LocalSecretsState = {
  secretNames: string[];
};

const defaultGetFunctionSecretNamesOptions = {
  fromCurrentCloudBackend: false,
};

const getLocalSecretNames = (functionName: string, options = defaultGetFunctionSecretNamesOptions): string[] | undefined => {
  options = { ...defaultGetFunctionSecretNamesOptions, ...options };
  const parametersFilePath = path.join(
    options.fromCurrentCloudBackend ? pathManager.getCurrentCloudBackendDirPath() : pathManager.getBackendDirPath(),
    categoryName,
    functionName,
    functionParametersFileName,
  );
  const funcParameters = JSONUtilities.readJson<Partial<LocalSecretsState>>(parametersFilePath, { throwIfNotExist: false });
  return funcParameters?.secretNames;
};

/**
 * Computes the diff of secrets names between function-parameters.json in #current-cloud-backend and amplify/backend
 * @param functionName the function to compute the diff of
 * @returns Object describing which secrets are newly added and which have been locally removed but are still present in the cloud
 */
const getSecretDiff = (functionName: string): { added: string[]; removed: string[] } => {
  const cloudSecretNames = getLocalFunctionSecretNames(functionName, { fromCurrentCloudBackend: true });
  const localSecretNames = getLocalFunctionSecretNames(functionName);
  return {
    added: localSecretNames.filter(name => !cloudSecretNames.includes(name)),
    removed: cloudSecretNames.filter(name => !localSecretNames.includes(name)),
  };
};

/**
 * Sets the secret state in function-parameters.json.
 *
 * DO NOT EXPORT this method. All exported state management should happen through higher-level interfaces
 */
const setLocalFunctionSecretState = (functionName: string, secretDeltas: SecretDeltas) => {
  const existingSecrets = Object.keys(getExistingSecrets(secretDeltas));
  const secretsParametersContent: LocalSecretsState = {
    secretNames: existingSecrets,
  };
  createParametersFile(secretsParametersContent, functionName, functionParametersFileName);
};

/**
 * Iterates over to-be-deleted lambda functions and stores any secret names for deleted functions in secretsPendingRemoval
 */
const storeToBeRemovedFunctionsWithSecrets = async (context: $TSContext) => {
  const resourcesToBeDeleted = ((await context.amplify.getResourceStatus())?.resourcesToBeDeleted || []) as {
    category: string;
    resourceName: string;
    service: string;
  }[];
  const deletedLambdas = resourcesToBeDeleted
    .filter(resource => resource.category === categoryName && resource.service === ServiceName.LambdaFunction)
    .map(resource => resource.resourceName);
  for (const deletedLambda of deletedLambdas) {
    const cloudSecretNames = await getLocalFunctionSecretNames(deletedLambda, { fromCurrentCloudBackend: true });
    const localSecretNames = await getLocalFunctionSecretNames(deletedLambda);
    // we need the secret names from #current-cloud-backend as well as /amplify/backend because a customer may have added a secret and then
    // deleted the function without pushing in between in which case the secret name would only be present in /amplify/backend
    const secretNames = Array.from(new Set(cloudSecretNames.concat(localSecretNames)));
    if (secretNames.length) {
      secretsPendingRemoval[deletedLambda] = secretNames;
    }
  }
};
