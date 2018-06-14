/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface ClusterSubnetGroupProperties {
    Description: Value<string>
    SubnetIds: List<Value<string>>
    Tags?: ResourceTag[]
}

export default class ClusterSubnetGroup extends ResourceBase {


    constructor(properties?: ClusterSubnetGroupProperties) {
        super('AWS::Redshift::ClusterSubnetGroup', properties)
    }
}
