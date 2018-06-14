/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface RouteProperties {
    DestinationCidrBlock?: Value<string>
    DestinationIpv6CidrBlock?: Value<string>
    EgressOnlyInternetGatewayId?: Value<string>
    GatewayId?: Value<string>
    InstanceId?: Value<string>
    NatGatewayId?: Value<string>
    NetworkInterfaceId?: Value<string>
    RouteTableId: Value<string>
    VpcPeeringConnectionId?: Value<string>
}

export default class Route extends ResourceBase {


    constructor(properties?: RouteProperties) {
        super('AWS::EC2::Route', properties)
    }
}
