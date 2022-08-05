import { $TSContext, stateManager } from 'amplify-cli-core';
import { loadConfigurationForEnv } from 'amplify-provider-awscloudformation';
import { AmplifyBackend } from 'aws-sdk';

const envMetaManagerMap: Record<string, IEnvironmentMetadata> = {};

/*
when initializing new env manager, check if initializing currently checked out env. If so, load from amplify-meta.json
if not, get amplify-backend client with other environment's credentials (can look up cred mode in local-aws-info.json)
call amplify-backend.getBackend(appId, envName) to fetch amplifyMeta
(need to store appId in local-aws-info.json for each environment)
*/

/**
 * Get environment metadata
 */
export const getEnvironmentMetadata = async (
  context: $TSContext,
  envName: string = stateManager.getLocalEnvInfo().envName,
): Promise<IEnvironmentMetadata> => {
  // when adding the first manager into the map, need to add a callback to save on exit
  if (Object.keys(envMetaManagerMap).length === 0) {
    process.on('beforeExit', () => {
      const currentEnv = stateManager.getLocalEnvInfo().envName;
      envMetaManagerMap[currentEnv]?.save();
      // save function
    });
  }
  if (envMetaManagerMap[envName]) {
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
  const creds = await loadConfigurationForEnv(context, envName);
  const { AMPLIFY_BACKEND_ENDPOINT, AMPLIFY_BACKEND_REGION } = process.env;

  const amplifyBackendClient = new AmplifyBackend({
    ...creds,
    ...(AMPLIFY_BACKEND_ENDPOINT && { endpoint: AMPLIFY_BACKEND_ENDPOINT }),
    ...(AMPLIFY_BACKEND_REGION && { region: AMPLIFY_BACKEND_REGION }),
  });

  // load appId from local-env-info
  const appId = stateManager.getLocalAWSInfo()?.[envName]?.amplifyAppId;
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
  envMetaManagerMap[envName] = new EnvironmentMetadata(JSON.parse(response.AmplifyMetaConfig)?.providers?.awscloudformation);
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
  readonly AmplifyAppId: string;
  private _PermissionsBoundaryPolicyArn: string | undefined;
  private _dirty = false;

  constructor(amplifyMeta: Record<string, unknown>) {
    const requiredKeys: (keyof IEnvironmentMetadata)[] = [
      'AuthRoleName',
      'AuthRoleArn',
      'UnauthRoleArn',
      'UnauthRoleName',
      'Region',
      'DeploymentBucketName',
      'StackId',
      'StackName',
      'AmplifyAppId',
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
    const permissionBoundaryType = typeof amplifyMeta.PermissionsBoundaryPolicyArn;
    if (permissionBoundaryType !== 'string' || permissionBoundaryType !== undefined) {
      throw new Error(`Tried to initialize EnvironmentMetadata object with PermissionsBoundaryPolicyArn set to a non-string value`);
    }
    const validatedAmplifyMeta = amplifyMeta as IEnvironmentMetadata;
    this.AuthRoleName = validatedAmplifyMeta.AuthRoleName;
    this.AuthRoleArn = validatedAmplifyMeta.AuthRoleArn;
    this.UnauthRoleArn = validatedAmplifyMeta.UnauthRoleArn;
    this.UnauthRoleName = validatedAmplifyMeta.UnauthRoleName;
    this.Region = validatedAmplifyMeta.Region;
    this.DeploymentBucketName = validatedAmplifyMeta.DeploymentBucketName;
    this.StackId = validatedAmplifyMeta.StackId;
    this.StackName = validatedAmplifyMeta.StackName;
    this.AmplifyAppId = validatedAmplifyMeta.AmplifyAppId;
    this._PermissionsBoundaryPolicyArn = validatedAmplifyMeta.PermissionsBoundaryPolicyArn;
  }

  get PermissionsBoundaryPolicyArn(): string | undefined {
    return this._PermissionsBoundaryPolicyArn;
  }

  set PermissionsBoundaryPolicyArn(value: string | undefined) {
    this._PermissionsBoundaryPolicyArn = value;
    this._dirty = true;
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
      AmplifyAppId: this.AmplifyAppId,
    } as Record<string, string>;
    if (this._PermissionsBoundaryPolicyArn) {
      obj.PermissionsBoundaryPolicyArn = this._PermissionsBoundaryPolicyArn;
    }
    return obj;
  }

  save(): void {
    if (!this._dirty) {
      return;
    }
    const amplifyMeta = stateManager.getMeta();
    amplifyMeta.providers.awscloudformation = this.toObject();
    stateManager.setMeta(undefined, amplifyMeta);
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
  readonly AmplifyAppId: string,
  PermissionsBoundaryPolicyArn: string | undefined,
  save: () => void
}
