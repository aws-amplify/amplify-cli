/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface VPNGatewayRoutePropagationProperties {
    RouteTableIds: List<Value<string>>
    VpnGatewayId: Value<string>
}

export default class VPNGatewayRoutePropagation extends ResourceBase {


    constructor(properties?: VPNGatewayRoutePropagationProperties) {
        super('AWS::EC2::VPNGatewayRoutePropagation', properties)
    }
}
