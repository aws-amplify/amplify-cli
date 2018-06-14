/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface VPCEndpointProperties {
    PolicyDocument?: any
    RouteTableIds?: List<Value<string>>
    ServiceName: Value<string>
    VpcId: Value<string>
}

export default class VPCEndpoint extends ResourceBase {


    constructor(properties?: VPCEndpointProperties) {
        super('AWS::EC2::VPCEndpoint', properties)
    }
}
