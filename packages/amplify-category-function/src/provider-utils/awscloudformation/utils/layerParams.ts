import { FunctionRuntime, ProviderContext } from 'amplify-function-plugin-interface';

export type LayerParameters = {
  layerName: string;
  layerPermissions: Permissions[];
  runtimes: FunctionRuntime[];
  providerContext: ProviderContext;
  authorizedAccountIds?: string;
  authorizedOrgId?: string;
  layerVersion: string;
  layerVersionsArray?: number[];
};

export enum Permissions {
  private = 'private',// remove
  public = 'public',
  awsAccounts = 'awsAccounts',
  awsOrg = 'awsOrg',
}
