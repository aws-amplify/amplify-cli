import { simplifyName } from './util';

export class SyncResourceIDs {
  public static syncDataSourceID: string = 'DynamoDBDeltaSyncTable';
  public static syncTableName: string = 'DeltaSyncTable';
  public static syncPrimaryKey: string = 'ds_pk';
  public static syncRangeKey: string = 'ds_sk';
  public static syncIAMRoleID: string = 'DynamoDBDeltaSyncIAMRole'
  public static syncIAMRoleName: string = 'DeltaSyncIAMRole';
  public static syncFunctionRoleName: string = 'DeltaSyncLambdaRole';
  public static syncFunctionID(name: string, region?: string): string {
    return `${simplifyName(name)}${simplifyName(region || '')}Role`;
  }
}