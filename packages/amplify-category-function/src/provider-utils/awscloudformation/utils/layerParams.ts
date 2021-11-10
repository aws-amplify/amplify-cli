import { FunctionRuntime, ProviderContext } from 'amplify-function-plugin-interface';

export type LayerRuntime = Pick<FunctionRuntime, 'name' | 'value' | 'layerExecutablePath' | 'runtimePluginId'> & {
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
  description?: string;
  versionHash?: string;
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

export const defaultLayerPermission: LayerPermission = { type: PermissionEnum.Private };

export interface LayerVersionMetadata {
  LayerVersionArn: string;
  Version: number;
  Description: string;
  CreatedDate: string;
  CompatibleRuntimes: string[];
  LicenseInfo: string;
  LogicalName: string;
  permissions: LayerPermission[];
  legacyLayer: boolean;
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
  legacyLayer: boolean;
}
