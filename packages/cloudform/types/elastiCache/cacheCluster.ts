/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface CacheClusterProperties {
    AZMode?: Value<string>
    AutoMinorVersionUpgrade?: Value<boolean>
    CacheNodeType: Value<string>
    CacheParameterGroupName?: Value<string>
    CacheSecurityGroupNames?: List<Value<string>>
    CacheSubnetGroupName?: Value<string>
    ClusterName?: Value<string>
    Engine: Value<string>
    EngineVersion?: Value<string>
    NotificationTopicArn?: Value<string>
    NumCacheNodes: Value<number>
    Port?: Value<number>
    PreferredAvailabilityZone?: Value<string>
    PreferredAvailabilityZones?: List<Value<string>>
    PreferredMaintenanceWindow?: Value<string>
    SnapshotArns?: List<Value<string>>
    SnapshotName?: Value<string>
    SnapshotRetentionLimit?: Value<number>
    SnapshotWindow?: Value<string>
    Tags?: ResourceTag[]
    VpcSecurityGroupIds?: List<Value<string>>
}

export default class CacheCluster extends ResourceBase {


    constructor(properties?: CacheClusterProperties) {
        super('AWS::ElastiCache::CacheCluster', properties)
    }
}
