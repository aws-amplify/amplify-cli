/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface DBInstanceProperties {
    AllocatedStorage?: Value<string>
    AllowMajorVersionUpgrade?: Value<boolean>
    AutoMinorVersionUpgrade?: Value<boolean>
    AvailabilityZone?: Value<string>
    BackupRetentionPeriod?: Value<string>
    CharacterSetName?: Value<string>
    CopyTagsToSnapshot?: Value<boolean>
    DBClusterIdentifier?: Value<string>
    DBInstanceClass: Value<string>
    DBInstanceIdentifier?: Value<string>
    DBName?: Value<string>
    DBParameterGroupName?: Value<string>
    DBSecurityGroups?: List<Value<string>>
    DBSnapshotIdentifier?: Value<string>
    DBSubnetGroupName?: Value<string>
    Domain?: Value<string>
    DomainIAMRoleName?: Value<string>
    Engine?: Value<string>
    EngineVersion?: Value<string>
    Iops?: Value<number>
    KmsKeyId?: Value<string>
    LicenseModel?: Value<string>
    MasterUserPassword?: Value<string>
    MasterUsername?: Value<string>
    MonitoringInterval?: Value<number>
    MonitoringRoleArn?: Value<string>
    MultiAZ?: Value<boolean>
    OptionGroupName?: Value<string>
    Port?: Value<string>
    PreferredBackupWindow?: Value<string>
    PreferredMaintenanceWindow?: Value<string>
    PubliclyAccessible?: Value<boolean>
    SourceDBInstanceIdentifier?: Value<string>
    SourceRegion?: Value<string>
    StorageEncrypted?: Value<boolean>
    StorageType?: Value<string>
    Tags?: ResourceTag[]
    Timezone?: Value<string>
    VPCSecurityGroups?: List<Value<string>>
}

export default class DBInstance extends ResourceBase {


    constructor(properties?: DBInstanceProperties) {
        super('AWS::RDS::DBInstance', properties)
    }
}
