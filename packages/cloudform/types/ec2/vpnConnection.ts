/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class VpnTunnelOptionsSpecification {
    PreSharedKey?: Value<string>
    TunnelInsideCidr?: Value<string>

    constructor(properties: VpnTunnelOptionsSpecification) {
        Object.assign(this, properties)
    }
}

export interface VPNConnectionProperties {
    CustomerGatewayId: Value<string>
    StaticRoutesOnly?: Value<boolean>
    Tags?: ResourceTag[]
    Type: Value<string>
    VpnGatewayId: Value<string>
    VpnTunnelOptionsSpecifications?: List<VpnTunnelOptionsSpecification>
}

export default class VPNConnection extends ResourceBase {
    static VpnTunnelOptionsSpecification = VpnTunnelOptionsSpecification

    constructor(properties?: VPNConnectionProperties) {
        super('AWS::EC2::VPNConnection', properties)
    }
}
