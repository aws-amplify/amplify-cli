import { $TSContext, JSONUtilities, pathManager, ResourceName, stateManager } from 'amplify-cli-core';
import { removeSecret, retainSecret, SecretDeltas, SecretName, setSecret } from 'amplify-function-plugin-interface';
import * as path from 'path';
import * as fs from 'fs-extra';
import { categoryName } from '../../../constants';
import { prePushMissingSecretsWalkthrough } from '../service-walkthroughs/secretValuesWalkthrough';
import { getFunctionCloudFormationTemplate, setFunctionCloudFormationTemplate } from '../utils/cloudformationHelpers';
import { functionParametersFileName, ServiceName } from '../utils/constants';
import { isFunctionPushed } from '../utils/funcionStateUtils';
import { createParametersFile } from '../utils/storeResources';
import { tryPrependSecretsUsageExample } from '../utils/updateTopLevelComment';
import { getExistingSecrets, hasExistingSecrets, secretNamesToSecretDeltas } from './secretDeltaUtilities';
import {
  getAppId,
  getEnvSecretPrefix,
  getFullyQualifiedSecretName,
  getFunctionSecretPrefix,
  secretsPathAmplifyAppIdKey,
} from './secretName';
import { updateSecretsInCfnTemplate } from './secretsCfnModifier';
import { SSMClientWrapper } from './ssmClientWrapper';
import _ from 'lodash';

let secretsPendingRemoval: Record<ResourceName, SecretName[]> = {};

/**
 * Manages the state of function secrets in AWS ParameterStore as well as local state in the CFN template and function-parameters.json
 *
 * Note: Local and cloud removal are separate operations because a secret cannot be removed in the cloud before the push.
 * The expected way to handle this is:
 * 1. During CLI workflows, call syncSecretDeltas
 * 2. Before pushing, call storeSecretsPendingRemoval
 * 3. After the push completes, call syncSecretsPendingRemoval
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
    await Promise.all(
      Object.entries(secretDeltas).map(async ([secretName, secretDelta]) => {
        const fullyQualifiedSecretName = getFullyQualifiedSecretName(secretName, functionName, envName);
        switch (secretDelta.operation) {
          case 'remove':
            if (this.doRemoveSecretsInCloud(functionName)) {
              await this.ssmClientWrapper.deleteSecret(fullyQualifiedSecretName);
            }
            break;
          case 'set':
            await this.ssmClientWrapper.setSecret(fullyQualifiedSecretName, secretDelta.value);
        }
      }),
    );

    try {
      const origTemplate = await getFunctionCloudFormationTemplate(functionName);
      const newTemplate = await updateSecretsInCfnTemplate(origTemplate, secretDeltas, functionName);
      await setFunctionCloudFormationTemplate(functionName, newTemplate);
    } catch (err) {
      if (hasExistingSecrets(secretDeltas)) {
        throw err;
      }
    }
    await tryPrependSecretsUsageExample(functionName, Object.keys(getExistingSecrets(secretDeltas)));
    await setLocalFunctionSecretState(functionName, secretDeltas);
  };

  /**
   * Checks that all locally defined secrets for the function are present in the cloud. If any are missing, it prompts for values
   */
  ensureNewLocalSecretsSyncedToCloud = async (functionName: string) => {
    const localSecretNames = getLocalFunctionSecretNames(functionName);
    if (!localSecretNames.length) {
      return;
    }
    const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
    const addedSecrets = localSecretNames.filter(name => !cloudSecretNames.includes(name));
    if (!addedSecrets.length) {
      return;
    }
    if (!this.isInteractive()) {
      throw new Error(
        `The following secrets in ${functionName} do not have values: [${addedSecrets}]\nRun 'amplify push' interactively to specify values.`,
      );
    }
    const delta = await prePushMissingSecretsWalkthrough(functionName, addedSecrets);
    await this.syncSecretDeltas(delta, functionName);
  };

  /**
   * Deletes all secrets in the cloud for the specified function
   */
  deleteAllFunctionSecrets = async (functionName: string) => {
    const cloudSecretNames = await this.getCloudFunctionSecretNames(functionName);
    await this.syncSecretDeltas(secretNamesToSecretDeltas(cloudSecretNames, removeSecret), functionName);
  };

  /**
   * Syncs secretsPendingRemoval to the cloud.
   *
   * It is expected that storeSecretsPendingRemoval has been called before calling this function. If not, this function is a noop.
   */
  syncSecretsPendingRemoval = async () => {
    await Promise.all(
      Object.entries(secretsPendingRemoval).map(([functionName, secretNames]) =>
        this.syncSecretDeltas(
          {
            ...secretNamesToSecretDeltas(getLocalFunctionSecretNames(functionName)),
            ...secretNamesToSecretDeltas(secretNames, removeSecret),
          },
          functionName,
        ),
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

  /**
   * Returns a SecretDeltas object that can be used to clone the secrets from one environment to another
   * @param sourceEnv The environment from which to get secrets
   * @param functionName The function from which to get secrets
   * @returns SecretDeltas for the function in the environment
   */
  getEnvCloneDeltas = async (sourceEnv: string, functionName: string) => {
    const destDelta = secretNamesToSecretDeltas(getLocalFunctionSecretNames(functionName), retainSecret);
    const sourceCloudSecretNames = await this.getCloudFunctionSecretNames(functionName, sourceEnv);
    const sourceCloudSecrets = await this.ssmClientWrapper.getSecrets(
      sourceCloudSecretNames.map(name => getFullyQualifiedSecretName(name, functionName, sourceEnv)),
    );
    sourceCloudSecrets.reduce((acc, { secretName, secretValue }) => {
      const shortName = secretName.slice(getFunctionSecretPrefix(functionName, sourceEnv).length);
      acc[shortName] = setSecret(secretValue);
      return acc;
    }, destDelta);
    return destDelta;
  };

  /**
   * Gets all secrets in SSM for the given function
   * @param functionName The function
   * @param envName Optional environment. If not specified, the current env is assumed
   * @returns string[] of all secret names for the function
   */
  private getCloudFunctionSecretNames = async (functionName: string, envName?: string) => {
    const prefix = getFunctionSecretPrefix(functionName, envName);
    const parts = path.parse(prefix);
    const unfilteredSecrets = await this.ssmClientWrapper.getSecretNamesByPath(parts.dir);
    return unfilteredSecrets.filter(secretName => secretName.startsWith(prefix)).map(secretName => secretName.slice(prefix.length));
  };

  /**
   * Secrets should only be removed in the cloud if the function is not yet pushed, or if the CLI operation is 'push'.
   * This function performs this check.
   */
  private doRemoveSecretsInCloud = (functionName: string): boolean => {
    const isCommandPush = this.context.parameters.command === 'push';
    return !isFunctionPushed(functionName) || isCommandPush;
  };

  private isInteractive = (): boolean => !this.context?.input?.options?.yes;
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
    const cloudSecretNames = getLocalFunctionSecretNames(functionName, { fromCurrentCloudBackend: true });
    const localSecretNames = getLocalFunctionSecretNames(functionName);
    const removed = cloudSecretNames.filter(name => !localSecretNames.includes(name));
    if (removed.length) {
      secretsPendingRemoval[functionName] = removed;
    }
  });

  await storeToBeRemovedFunctionsWithSecrets(context);
};

type LocalSecretsState = {
  secretNames: string[];
};

const defaultGetFunctionSecretNamesOptions = {
  fromCurrentCloudBackend: false,
};

/**
 * Gets the secret names stored in function-parameters.json for the given function.
 *
 * Optionally, {fromCurrentCloudBackend: true} can be specified to get the secret names stored in #current-cloud-backend
 */
export const getLocalFunctionSecretNames = (
  functionName: string,
  options: Partial<typeof defaultGetFunctionSecretNamesOptions> = defaultGetFunctionSecretNamesOptions,
): string[] => {
  options = { ...defaultGetFunctionSecretNamesOptions, ...options };
  const parametersFilePath = path.join(
    options.fromCurrentCloudBackend ? pathManager.getCurrentCloudBackendDirPath() : pathManager.getBackendDirPath(),
    categoryName,
    functionName,
    functionParametersFileName,
  );
  const funcParameters = JSONUtilities.readJson<Partial<LocalSecretsState>>(parametersFilePath, { throwIfNotExist: false });
  return funcParameters?.secretNames || [];
};

// Below are some private helper functions for managing local secret state

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
  const parametersFilePath = path.join(pathManager.getBackendDirPath(), categoryName, functionName, functionParametersFileName);

  // checking for existance of the file because in the case of function deletion we don't want to create the file again
  if (fs.existsSync(parametersFilePath)) {
    createParametersFile(secretsParametersContent, functionName, functionParametersFileName);
  }

  if (hasExistingSecrets(secretDeltas)) {
    setAppIdForFunctionInTeamProvider(functionName);
  } else {
    removeAppIdForFunctionInTeamProvider(functionName);
  }
};

const setAppIdForFunctionInTeamProvider = (functionName: string) => {
  const tpi = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
  const env = stateManager.getLocalEnvInfo()?.envName as string;
  let funcTpi = tpi?.[env]?.categories?.[categoryName]?.[functionName];
  if (!funcTpi) {
    _.set(tpi, [env, 'categories', categoryName, functionName], {});
    funcTpi = tpi[env].categories[categoryName][functionName];
  }
  _.assign(funcTpi, { [secretsPathAmplifyAppIdKey]: getAppId() });
  stateManager.setTeamProviderInfo(undefined, tpi);
};

const removeAppIdForFunctionInTeamProvider = (functionName: string) => {
  const tpi = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
  const env = stateManager.getLocalEnvInfo()?.envName as string;
  _.unset(tpi, [env, 'categories', categoryName, functionName, secretsPathAmplifyAppIdKey]);
  stateManager.setTeamProviderInfo(undefined, tpi);
};

/**
 * Iterates over to-be-deleted lambda functions and stores any secret names for deleted functions in secretsPendingRemoval
 */
const storeToBeRemovedFunctionsWithSecrets = async (context: $TSContext) => {
  const resourceStatus = await context.amplify.getResourceStatus(categoryName);
  const resourcesToBeDeleted = (resourceStatus?.resourcesToBeDeleted || []) as {
    category: string;
    resourceName: string;
    service: string;
  }[];
  const deletedLambdas = resourcesToBeDeleted
    .filter(resource => resource.service === ServiceName.LambdaFunction)
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
