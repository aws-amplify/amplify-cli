/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'



export interface VPNConnectionRouteProperties {
    DestinationCidrBlock: Value<string>
    VpnConnectionId: Value<string>
}

export default class VPNConnectionRoute extends ResourceBase {


    constructor(properties?: VPNConnectionRouteProperties) {
        super('AWS::EC2::VPNConnectionRoute', properties)
    }
}
