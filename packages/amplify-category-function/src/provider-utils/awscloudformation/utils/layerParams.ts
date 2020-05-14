import { FunctionRuntime, ProviderContext } from 'amplify-function-plugin-interface';

export type LayerParameters = {
  layerName: string;
  layerPermissions: Permissions;
  runtimes: FunctionRuntime[];
  providerContext: ProviderContext;
  authorizedAccountIds?: string;
  authorizedOrgId?: string;
};

export enum Permissions {
  private = 'private',
  public = 'public',
  awsAccs = 'aws-accs',
  awsOrg = 'aws-org',
}
