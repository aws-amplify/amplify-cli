import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class VpnTunnelOptionsSpecification {
    PreSharedKey?: Value<string>;
    TunnelInsideCidr?: Value<string>;
    constructor(properties: VpnTunnelOptionsSpecification);
}
export interface VPNConnectionProperties {
    CustomerGatewayId: Value<string>;
    StaticRoutesOnly?: Value<boolean>;
    Tags?: ResourceTag[];
    Type: Value<string>;
    VpnGatewayId: Value<string>;
    VpnTunnelOptionsSpecifications?: List<VpnTunnelOptionsSpecification>;
}
export default class VPNConnection extends ResourceBase {
    static VpnTunnelOptionsSpecification: typeof VpnTunnelOptionsSpecification;
    constructor(properties?: VPNConnectionProperties);
}
