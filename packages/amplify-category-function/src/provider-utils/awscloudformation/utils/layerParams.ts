import { FunctionRuntime, ProviderContext } from 'amplify-function-plugin-interface';

export type LayerRuntime = Pick<FunctionRuntime, 'name' | 'value' | 'layerExecutablePath'> & {
  cloudTemplateValues?: string[];
  layerDefaultFiles?: { path: string; filename: string; content: string }[];
};

export type LayerParameters = {
  layerName: string;
  runtimes: LayerRuntime[];
  permissions: LayerPermission[];
  providerContext: ProviderContext;
  selectedVersion?: LayerVersionCfnMetadata;
  build: boolean;
};

export enum PermissionEnum {
  Private = 'Private',
  Public = 'Public',
  AwsAccounts = 'AwsAccounts',
  AwsOrg = 'AwsOrg',
}

export type LayerPermission = PrivateLayer | PublicLayer | AccountsLayer | OrgsLayer;
export interface PrivateLayer {
  type: PermissionEnum.Private;
}
export interface PublicLayer {
  type: PermissionEnum.Public;
}
export interface AccountsLayer {
  type: PermissionEnum.AwsAccounts;
  accounts: string[];
}
export interface OrgsLayer {
  type: PermissionEnum.AwsOrg;
  orgs: string[];
}
export interface LayerVersionCfnMetadata {
  CompatibleRuntimes?: string[];
  CreatedDate?: string;
  Description?: string;
  LayerVersionArn?: string;
  LogicalName: string;
  Version?: number;
  Content?: {
    S3Key: string;
    S3Bucket: string;
  };
  permissions?: LayerPermission[];
}
