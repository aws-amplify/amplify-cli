import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export interface DBClusterProperties {
    AvailabilityZones?: List<Value<string>>;
    BackupRetentionPeriod?: Value<number>;
    DBClusterIdentifier?: Value<string>;
    DBClusterParameterGroupName?: Value<string>;
    DBSubnetGroupName?: Value<string>;
    DatabaseName?: Value<string>;
    Engine: Value<string>;
    EngineVersion?: Value<string>;
    KmsKeyId?: Value<string>;
    MasterUserPassword?: Value<string>;
    MasterUsername?: Value<string>;
    Port?: Value<number>;
    PreferredBackupWindow?: Value<string>;
    PreferredMaintenanceWindow?: Value<string>;
    ReplicationSourceIdentifier?: Value<string>;
    SnapshotIdentifier?: Value<string>;
    StorageEncrypted?: Value<boolean>;
    Tags?: ResourceTag[];
    VpcSecurityGroupIds?: List<Value<string>>;
}
export default class DBCluster extends ResourceBase {
    constructor(properties?: DBClusterProperties);
}
