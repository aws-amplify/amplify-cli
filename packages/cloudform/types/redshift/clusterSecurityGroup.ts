/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface ClusterSecurityGroupProperties {
    Description: Value<string>
    Tags?: ResourceTag[]
}

export default class ClusterSecurityGroup extends ResourceBase {


    constructor(properties?: ClusterSecurityGroupProperties) {
        super('AWS::Redshift::ClusterSecurityGroup', properties)
    }
}
