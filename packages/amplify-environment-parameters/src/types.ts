import { ResourceParameterManager } from './resource-parameter-manager';

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
  write: (respectIsDirty?: boolean, writeTarget?: WriteTarget) => void
}

/**
 * Interface for environment parameter managers
 */
export type IEnvironmentParameterManager = {
  init: () => Promise<void>;
  removeResourceParamManager: (category: string, resource: string) => void;
  hasResourceParamManager: (category: string, resource: string) => boolean;
  getResourceParamManager: (category: string, resource: string) => ResourceParameterManager;
  removeSaveListener: () => void;
  write: (target: WriteTarget) => void;
}

/**
 * A function that can write an object to a destination
 */
export type WriteTarget = (serializableObject: Record<string, unknown>) => void;
