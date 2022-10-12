import {
  $TSContext, pathManager, stateManager, getPermissionsBoundaryArn,
} from 'amplify-cli-core';
import { AmplifyBackend } from 'aws-sdk';
import type { ServiceConfigurationOptions } from 'aws-sdk/lib/service';
import { IEnvironmentMetadata, WriteTarget } from './types';

/**
 * This module maintains a map of environment name to metadata for that environment
 */
const envMetaManagerMap: Record<string, IEnvironmentMetadata> = {};

/**
 * Initializes the EnvironmentMetadata object for the current environment to the values stored in context.exeInfo.amplifyMeta
 *
 * Throws if EnvironmentMetadata is already initialized for the current environment.
 *
 * Intended to be used during init after the root stack deployment succeeds but before `amplify-meta.json` has been created yet
 * @param context The Amplify context object
 */
export const initEnvMeta = async (context: $TSContext): Promise<void> => {
  const currentEnv = stateManager.getLocalEnvInfo().envName;
  if (envMetaManagerMap[currentEnv]) {
    throw new Error(`EnvironmentMetadata is already initialized for ${currentEnv} environment.`);
  }
  await ensureEnvMetaInternal(context, currentEnv, context?.exeInfo?.amplifyMeta?.providers?.awscloudformation);
};

/**
 * Get the environment metadata object for the specified environment. Throw if it is not initialized
 */
export const getEnvMeta = (envName: string = stateManager.getLocalEnvInfo().envName): IEnvironmentMetadata => {
  if (envMetaManagerMap[envName]) {
    return envMetaManagerMap[envName];
  }
  throw new Error(`Environment metadata not initialized for ${envName} environment. Call ensureEnvMeta() to initialize.`);
};

/**
 * Get the environment metadata object for the specified environment,
 * or initialize the metadata object from local files or the cloud if it doesn't exist
 */
export const ensureEnvMeta = async (
  context: $TSContext,
  envName: string = stateManager.getLocalEnvInfo().envName,
): Promise<IEnvironmentMetadata> => ensureEnvMetaInternal(context, envName);

const ensureEnvMetaInternal = async (
  context: $TSContext,
  envName: string = stateManager.getLocalEnvInfo().envName,
  initialMeta?: Record<string, string>,
): Promise<IEnvironmentMetadata> => {
  // when adding the first manager into the map, need to add a callback to save on exit
  if (Object.keys(envMetaManagerMap).length === 0) {
    process.on('exit', saveOnExit(context));
  }
  if (envMetaManagerMap[envName]) {
    return envMetaManagerMap[envName];
  }

  if (typeof initialMeta === 'object' && Object.keys(initialMeta).length > 0) {
    envMetaManagerMap[envName] = new EnvironmentMetadata(initialMeta, true);
  } else if (envName === stateManager.getLocalEnvInfo().envName) {
    envMetaManagerMap[envName] = initEnvMetaFromFile();
  } else {
    envMetaManagerMap[envName] = await initEnvMetaFromService(context, envName);
  }
  return envMetaManagerMap[envName];
};

const initEnvMetaFromFile = (): IEnvironmentMetadata => {
  // if getting metadata for the current environment, initialize it from the amplify-meta.json file or fallback to current backend meta
  const awsProviderMeta = stateManager.getMeta(undefined, { throwIfNotExist: false, default: {} })?.providers?.awscloudformation;
  const currentBackendAwsProviderMeta = stateManager.getCurrentMeta(undefined, { throwIfNotExist: false })?.providers?.awscloudformation;
  // set isDirty to true if amplify-meta doesn't exist (indicating that it should be written on exit)
  return new EnvironmentMetadata(awsProviderMeta ?? currentBackendAwsProviderMeta, !awsProviderMeta);
};

// if getting metadata for a different environment,
// we need to construct an amplify-backend client with that environment's credentials
// and make a call to getBackend to fetch the metadata
const initEnvMetaFromService = async (
  context: $TSContext,
  envName: string = stateManager.getLocalEnvInfo().envName,
): Promise<IEnvironmentMetadata> => {
  const credentials = (await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'loadConfigurationForEnv', [
    context,
    envName,
  ])) as ServiceConfigurationOptions;
  const { AMPLIFY_BACKEND_ENDPOINT, AMPLIFY_BACKEND_REGION } = process.env;

  const amplifyBackendClient = new AmplifyBackend({
    ...credentials,
    ...(AMPLIFY_BACKEND_ENDPOINT && { endpoint: AMPLIFY_BACKEND_ENDPOINT }),
    ...(AMPLIFY_BACKEND_REGION && { region: AMPLIFY_BACKEND_REGION }),
  });

  // load appId from local-env-info
  const appId = stateManager.getLocalAWSInfo()?.[envName]?.AmplifyAppId;
  if (!appId) {
    throw new Error(`Could not find Amplify App ID for environment ${envName} in 'local-aws-info.json'. Make sure the environment has been pulled.`);
  }

  const response = await amplifyBackendClient.getBackend({
    AppId: appId,
    BackendEnvironmentName: envName,
  }).promise();
  if (response.Error) {
    throw new Error(`Error fetching backend metadata for environment ${envName}: ${response.Error}`);
  }
  if (!response.AmplifyMetaConfig) {
    throw new Error(`AmplifyBackend.getBackend did not return AmplifyMetaConfig for environment ${envName}`);
  }
  return new EnvironmentMetadata(JSON.parse(response.AmplifyMetaConfig)?.providers?.awscloudformation, true);
};

class EnvironmentMetadata implements IEnvironmentMetadata {
  readonly AuthRoleName: string;
  readonly AuthRoleArn: string;
  readonly UnauthRoleArn: string;
  readonly UnauthRoleName: string;
  readonly Region: string;
  readonly DeploymentBucketName: string;
  readonly StackName: string;
  readonly StackId: string;
  /**
   * This value should only be undefined in some e2e tests where Amplify app creation is disabled
   */
  private _AmplifyAppId: string | undefined;
  private _PermissionsBoundaryPolicyArn: string | undefined;
  /**
   * flag that keeps track of whether this object needs to be written to disk on save or not
   */
  private _dirty = false;

  /**
   * Create a new EnvironmentMetadata object
   *
   * @param amplifyMeta the provider metadata to init. Can optionally be nested in providers.awscloudformation in the object
   * @param isDirty whether the given amplifyMeta is in sync with what's on the disc
   */
  constructor(amplifyMeta: Record<string, unknown>, isDirty = false) {
    // validate input has correct shape
    const requiredKeys: (keyof IEnvironmentMetadata)[] = [
      'AuthRoleName',
      'AuthRoleArn',
      'UnauthRoleArn',
      'UnauthRoleName',
      'Region',
      'DeploymentBucketName',
      'StackId',
      'StackName',
    ];
    const amplifyMetaKeys = Object.keys(amplifyMeta);
    requiredKeys.forEach(requiredKey => {
      if (!amplifyMetaKeys.includes(requiredKey)) {
        throw new Error(`Tried to initialize EnvironmentMetadata object without required key ${requiredKey}`);
      }
      if (typeof amplifyMeta[requiredKey] !== 'string') {
        throw new Error(`Tried to initialize EnvironmentMetadata object with ${requiredKey} set to a non-string value`);
      }
    });

    const optionalKeys: (keyof IEnvironmentMetadata)[] = [
      'PermissionsBoundaryPolicyArn',
      'AmplifyAppId',
    ];

    optionalKeys.forEach(optionalKey => {
      const typeOfValue = typeof amplifyMeta[optionalKey];
      if (typeOfValue !== 'string' && typeOfValue !== 'undefined') {
        throw new Error(`Tried to initialize EnvironmentMetadata object with ${optionalKey} set to a non-string value`);
      }
    });
    const validatedAmplifyMeta = amplifyMeta as IEnvironmentMetadata;
    this.AuthRoleName = validatedAmplifyMeta.AuthRoleName;
    this.AuthRoleArn = validatedAmplifyMeta.AuthRoleArn;
    this.UnauthRoleArn = validatedAmplifyMeta.UnauthRoleArn;
    this.UnauthRoleName = validatedAmplifyMeta.UnauthRoleName;
    this.Region = validatedAmplifyMeta.Region;
    this.DeploymentBucketName = validatedAmplifyMeta.DeploymentBucketName;
    this.StackId = validatedAmplifyMeta.StackId;
    this.StackName = validatedAmplifyMeta.StackName;
    this._AmplifyAppId = validatedAmplifyMeta.AmplifyAppId;
    this._PermissionsBoundaryPolicyArn = validatedAmplifyMeta.PermissionsBoundaryPolicyArn;
    this._dirty = isDirty;
  }

  get PermissionsBoundaryPolicyArn(): string | undefined {
    return this._PermissionsBoundaryPolicyArn || getPermissionsBoundaryArn();
  }

  set PermissionsBoundaryPolicyArn(value: string | undefined) {
    this._PermissionsBoundaryPolicyArn = value;
    this._dirty = true;
  }

  get AmplifyAppId(): string {
    return this._AmplifyAppId!;
  }

  set AmplifyAppId(value: string) {
    this._AmplifyAppId = value;
    this._dirty = true;
  }

  /**
   * Persist the metadata stored in the manager object
   *
   * currently this writes the values out to the `amplify-meta.json` file and `team-provider-info.json` but eventually we will git rid of
   * `team-provider-info.json`. And beyond that the values stored in `amplify-meta.json` should eventually be stored in a metadata service
   */
  write(respectIsDirty = true, writeTarget: WriteTarget = localFilesWriteTarget): void {
    if (respectIsDirty && !this._dirty) {
      return;
    }
    writeTarget(this.toObject());
  }

  private toObject(): Record<string, string> {
    const obj = {
      AuthRoleName: this.AuthRoleName,
      AuthRoleArn: this.AuthRoleArn,
      UnauthRoleArn: this.UnauthRoleArn,
      UnauthRoleName: this.UnauthRoleName,
      Region: this.Region,
      DeploymentBucketName: this.DeploymentBucketName,
      StackName: this.StackName,
      StackId: this.StackId,
      AmplifyAppId: this._AmplifyAppId,
    } as Record<string, string>;
    if (this.PermissionsBoundaryPolicyArn) {
      obj.PermissionsBoundaryPolicyArn = this.PermissionsBoundaryPolicyArn;
    }
    return obj;
  }
}

const localFilesWriteTarget: WriteTarget = serializableObject => {
  // set values in `amplify-meta.json`
  const amplifyMeta = stateManager.getMeta(undefined, { throwIfNotExist: false, default: {} });
  amplifyMeta.providers = {
    awscloudformation: serializableObject,
  };
  stateManager.setMeta(undefined, amplifyMeta);

  // set values in `team-provider-info.json
  const tpi = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
  const currentEnv = stateManager.getLocalEnvInfo().envName;
  if (typeof tpi[currentEnv] !== 'object') {
    tpi[currentEnv] = {};
  }
  tpi[currentEnv].awscloudformation = serializableObject;
  stateManager.setTeamProviderInfo(undefined, tpi);
};

const saveOnExit = (context: $TSContext) => () => {
  if (!pathManager.findProjectRoot()) {
    return; // in the case of delete, the project root will be gone in which case we don't need to save anything
  }
  const currentEnv = stateManager.getLocalEnvInfo().envName;
  // ensure any updates to the current env meta are written to the `amplify-meta.json` file
  envMetaManagerMap[currentEnv]?.write();

  // remove any environments from tpi that were deleted
  const currentEnvs = context.amplify.getAllEnvs();
  const tpi = stateManager.getTeamProviderInfo(undefined, { throwIfNotExist: false, default: {} });
  const tpiEnvs = Object.keys(tpi);
  const removedEnvs = tpiEnvs.filter(env => !currentEnvs.includes(env));
  if (removedEnvs.length > 0) {
    removedEnvs.forEach(env => {
      delete tpi[env];
    });
    stateManager.setTeamProviderInfo(undefined, tpi);
  }
};
