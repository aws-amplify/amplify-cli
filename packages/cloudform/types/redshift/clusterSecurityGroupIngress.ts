/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface ClusterSecurityGroupIngressProperties {
    CIDRIP?: Value<string>
    ClusterSecurityGroupName: Value<string>
    EC2SecurityGroupName?: Value<string>
    EC2SecurityGroupOwnerId?: Value<string>
}

export default class ClusterSecurityGroupIngress extends ResourceBase {


    constructor(properties?: ClusterSecurityGroupIngressProperties) {
        super('AWS::Redshift::ClusterSecurityGroupIngress', properties)
    }
}
