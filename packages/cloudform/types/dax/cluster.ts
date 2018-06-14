/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface ClusterProperties {
    Description?: Value<string>
    ReplicationFactor: Value<number>
    ParameterGroupName?: Value<string>
    AvailabilityZones?: List<Value<string>>
    NodeType: Value<string>
    IAMRoleARN: Value<string>
    SubnetGroupName?: Value<string>
    ClusterName?: Value<string>
    PreferredMaintenanceWindow?: Value<string>
    NotificationTopicARN?: Value<string>
    SecurityGroupIds?: List<Value<string>>
    Tags?: ResourceTag[]
}

export default class Cluster extends ResourceBase {


    constructor(properties?: ClusterProperties) {
        super('AWS::DAX::Cluster', properties)
    }
}
