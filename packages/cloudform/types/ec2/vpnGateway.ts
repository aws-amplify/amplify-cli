/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'



export interface VPNGatewayProperties {
    AmazonSideAsn?: Value<number>
    Tags?: ResourceTag[]
    Type: Value<string>
}

export default class VPNGateway extends ResourceBase {


    constructor(properties?: VPNGatewayProperties) {
        super('AWS::EC2::VPNGateway', properties)
    }
}
