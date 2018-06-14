import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export interface DBClusterProperties {
    StorageEncrypted?: Value<boolean>;
    KmsKeyId?: Value<string>;
    AvailabilityZones?: List<Value<string>>;
    SnapshotIdentifier?: Value<string>;
    Port?: Value<number>;
    DBClusterIdentifier?: Value<string>;
    PreferredMaintenanceWindow?: Value<string>;
    IamAuthEnabled?: Value<boolean>;
    DBSubnetGroupName?: Value<string>;
    PreferredBackupWindow?: Value<string>;
    VpcSecurityGroupIds?: List<Value<string>>;
    DBClusterParameterGroupName?: Value<string>;
    BackupRetentionPeriod?: Value<number>;
    Tags?: ResourceTag[];
}
export default class DBCluster extends ResourceBase {
    constructor(properties?: DBClusterProperties);
}
