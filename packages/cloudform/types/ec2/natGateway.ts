/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface NatGatewayProperties {
    AllocationId: Value<string>
    SubnetId: Value<string>
    Tags?: ResourceTag[]
}

export default class NatGateway extends ResourceBase {


    constructor(properties?: NatGatewayProperties) {
        super('AWS::EC2::NatGateway', properties)
    }
}
