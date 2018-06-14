/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class NodeGroupConfiguration {
    PrimaryAvailabilityZone?: Value<string>
    ReplicaAvailabilityZones?: List<Value<string>>
    ReplicaCount?: Value<number>
    Slots?: Value<string>

    constructor(properties: NodeGroupConfiguration) {
        Object.assign(this, properties)
    }
}

export interface ReplicationGroupProperties {
    AtRestEncryptionEnabled?: Value<boolean>
    AuthToken?: Value<string>
    AutoMinorVersionUpgrade?: Value<boolean>
    AutomaticFailoverEnabled?: Value<boolean>
    CacheNodeType?: Value<string>
    CacheParameterGroupName?: Value<string>
    CacheSecurityGroupNames?: List<Value<string>>
    CacheSubnetGroupName?: Value<string>
    Engine?: Value<string>
    EngineVersion?: Value<string>
    NodeGroupConfiguration?: List<NodeGroupConfiguration>
    NotificationTopicArn?: Value<string>
    NumCacheClusters?: Value<number>
    NumNodeGroups?: Value<number>
    Port?: Value<number>
    PreferredCacheClusterAZs?: List<Value<string>>
    PreferredMaintenanceWindow?: Value<string>
    PrimaryClusterId?: Value<string>
    ReplicasPerNodeGroup?: Value<number>
    ReplicationGroupDescription: Value<string>
    ReplicationGroupId?: Value<string>
    SecurityGroupIds?: List<Value<string>>
    SnapshotArns?: List<Value<string>>
    SnapshotName?: Value<string>
    SnapshotRetentionLimit?: Value<number>
    SnapshotWindow?: Value<string>
    SnapshottingClusterId?: Value<string>
    Tags?: ResourceTag[]
    TransitEncryptionEnabled?: Value<boolean>
}

export default class ReplicationGroup extends ResourceBase {
    static NodeGroupConfiguration = NodeGroupConfiguration

    constructor(properties?: ReplicationGroupProperties) {
        super('AWS::ElastiCache::ReplicationGroup', properties)
    }
}
