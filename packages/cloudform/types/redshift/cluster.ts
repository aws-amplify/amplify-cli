/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class LoggingProperties {
    BucketName: Value<string>
    S3KeyPrefix?: Value<string>

    constructor(properties: LoggingProperties) {
        Object.assign(this, properties)
    }
}

export interface ClusterProperties {
    AllowVersionUpgrade?: Value<boolean>
    AutomatedSnapshotRetentionPeriod?: Value<number>
    AvailabilityZone?: Value<string>
    ClusterIdentifier?: Value<string>
    ClusterParameterGroupName?: Value<string>
    ClusterSecurityGroups?: List<Value<string>>
    ClusterSubnetGroupName?: Value<string>
    ClusterType: Value<string>
    ClusterVersion?: Value<string>
    DBName: Value<string>
    ElasticIp?: Value<string>
    Encrypted?: Value<boolean>
    HsmClientCertificateIdentifier?: Value<string>
    HsmConfigurationIdentifier?: Value<string>
    IamRoles?: List<Value<string>>
    KmsKeyId?: Value<string>
    LoggingProperties?: LoggingProperties
    MasterUserPassword: Value<string>
    MasterUsername: Value<string>
    NodeType: Value<string>
    NumberOfNodes?: Value<number>
    OwnerAccount?: Value<string>
    Port?: Value<number>
    PreferredMaintenanceWindow?: Value<string>
    PubliclyAccessible?: Value<boolean>
    SnapshotClusterIdentifier?: Value<string>
    SnapshotIdentifier?: Value<string>
    Tags?: ResourceTag[]
    VpcSecurityGroupIds?: List<Value<string>>
}

export default class Cluster extends ResourceBase {
    static LoggingProperties = LoggingProperties

    constructor(properties?: ClusterProperties) {
        super('AWS::Redshift::Cluster', properties)
    }
}
