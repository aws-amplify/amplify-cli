import { simplifyName } from './util';

export class SyncResourceIDs {
  public static syncDataSourceID: string = 'DataStore';
  public static syncTableName: string = 'AmplifyDataStore';
  public static syncPrimaryKey: string = 'ds_pk';
  public static syncRangeKey: string = 'ds_sk';
  public static syncIAMRoleID: string = 'DataStoreIAMRole'
  public static syncIAMRoleName: string = 'AmplifyDataStoreIAMRole';
  public static syncFunctionRoleName: string = 'DataStoreLambdaRole';
  public static syncFunctionID(name: string, region?: string): string {
    return `${simplifyName(name)}${simplifyName(region || '')}Role`;
  }
}
