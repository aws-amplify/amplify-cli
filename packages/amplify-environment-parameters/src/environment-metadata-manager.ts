import { $TSContext, pathManager, stateManager } from 'amplify-cli-core';
import { AmplifyBackend } from 'aws-sdk';
import type { ServiceConfigurationOptions } from 'aws-sdk/lib/service';

const envMetaManagerMap: Record<string, IEnvironmentMetadata> = {};

/*
when initializing new env manager, check if initializing currently checked out env. If so, load from amplify-meta.json
if not, get amplify-backend client with other environment's credentials (can look up cred mode in local-aws-info.json)
call amplify-backend.getBackend(appId, envName) to fetch amplifyMeta
(need to store appId in local-aws-info.json for each environment)
*/

/**
 * Initializes the EnvironmentMetadata object for the current environment to the given meta object
 *
 * Throws if EnvironmentMetadata is already initialized for the current environment.
 *
 * Intended to be used during init after the root stack deployment succeeds but before `amplify-meta.json` has been created yet
 * @param meta The contents to set in the `amplify-meta.json` providers block
 */
export const initEnvMeta = async (meta: Record<string, string>): Promise<void> => {
  const currentEnv = stateManager.getLocalEnvInfo().envName;
  if (envMetaManagerMap[currentEnv]) {
    throw new Error(`EnvironmentMetadata is already initialized for ${currentEnv} environment.`);
  }
  // don't need to pass in context because specifying meta will early return before context is ever needed
  await ensureEnvMetaInternal(undefined as unknown as $TSContext, currentEnv, meta);
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
    process.on('exit', () => {
      if (!pathManager.findProjectRoot()) {
        return; // in the case of delete, the project root will be gone in which case we don't need to save anything
      }
      const currentEnv = stateManager.getLocalEnvInfo().envName;
      // ensure any updates to the current env meta are written to the `amplify-meta.json` file
      envMetaManagerMap[currentEnv]?.save();
    });
  }
  if (envMetaManagerMap[envName]) {
    return envMetaManagerMap[envName];
  }

  if (typeof initialMeta === 'object' && Object.keys(initialMeta).length > 0) {
    envMetaManagerMap[envName] = new EnvironmentMetadata(initialMeta, true);
    return envMetaManagerMap[envName];
  }

  if (envName === stateManager.getLocalEnvInfo().envName) {
    // if getting metadata for the current environment, initialize it from the amplify-meta.json file
    envMetaManagerMap[envName] = new EnvironmentMetadata(stateManager.getMeta()?.providers?.awscloudformation);
    return envMetaManagerMap[envName];
  }
  // if getting metadata for a different environment,
  // we need to construct an amplify-backend client with that environment's credentials
  // and make a call to getBackend to fetch the metadata
  const creds = (await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'loadConfigurationForEnv', [
    context,
    envName,
  ])) as ServiceConfigurationOptions;
  const { AMPLIFY_BACKEND_ENDPOINT, AMPLIFY_BACKEND_REGION } = process.env;

  const amplifyBackendClient = new AmplifyBackend({
    ...creds,
    ...(AMPLIFY_BACKEND_ENDPOINT && { endpoint: AMPLIFY_BACKEND_ENDPOINT }),
    ...(AMPLIFY_BACKEND_REGION && { region: AMPLIFY_BACKEND_REGION }),
  });

  // load appId from local-env-info
  const appId = stateManager.getLocalAWSInfo()?.[envName]?.appId;
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
  envMetaManagerMap[envName] = new EnvironmentMetadata(JSON.parse(response.AmplifyMetaConfig)?.providers?.awscloudformation, true);
  return envMetaManagerMap[envName];
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
  private _dirty = false;

  /**
   * Create a new EnvironmentMetadata object
   *
   * @param amplifyMeta the provider metadata to init. Can optionally be nested in providers.awscloudformation in the object
   * @param isDirty whether the given amplifyMeta is in sync with what's on the disc
   */
  constructor(amplifyMeta: Record<string, unknown>, isDirty = false) {
    let flattenedMeta = amplifyMeta;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (amplifyMeta as any)?.providers?.awscloudformation === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      flattenedMeta = (amplifyMeta as any).providers.awscloudformation;
    }
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
    const amplifyMetaKeys = Object.keys(flattenedMeta);
    requiredKeys.forEach(requiredKey => {
      if (!amplifyMetaKeys.includes(requiredKey)) {
        throw new Error(`Tried to initialize EnvironmentMetadata object without required key ${requiredKey}`);
      }
      if (typeof flattenedMeta[requiredKey] !== 'string') {
        throw new Error(`Tried to initialize EnvironmentMetadata object with ${requiredKey} set to a non-string value`);
      }
    });

    const optionalKeys: (keyof IEnvironmentMetadata)[] = [
      'PermissionsBoundaryPolicyArn',
      'AmplifyAppId',
    ];

    optionalKeys.forEach(optionalKey => {
      const typeOfValue = typeof flattenedMeta[optionalKey];
      if (typeOfValue !== 'string' && typeOfValue !== 'undefined') {
        throw new Error(`Tried to initialize EnvironmentMetadata object with ${optionalKey} set to a non-string value`);
      }
    });
    const validatedAmplifyMeta = flattenedMeta as IEnvironmentMetadata;
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
    return this._PermissionsBoundaryPolicyArn;
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

  save(): void {
    if (!this._dirty) {
      return;
    }
    const amplifyMeta = stateManager.getMeta(undefined, { throwIfNotExist: false }) || {};
    amplifyMeta.providers = {};
    amplifyMeta.providers.awscloudformation = this.toObject();
    stateManager.setMeta(undefined, amplifyMeta);
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
    if (this._PermissionsBoundaryPolicyArn) {
      obj.PermissionsBoundaryPolicyArn = this._PermissionsBoundaryPolicyArn;
    }
    return obj;
  }
}

/**
 * Env metadata type
 */
export type IEnvironmentMetadata = {
  readonly AuthRoleName: string,
  readonly AuthRoleArn: string,
  readonly UnauthRoleArn: string,
  readonly UnauthRoleName: string,
  readonly Region: string,
  readonly DeploymentBucketName: string,
  readonly StackName: string,
  readonly StackId: string,
  AmplifyAppId: string,
  PermissionsBoundaryPolicyArn: string | undefined,
  save: () => void
}
