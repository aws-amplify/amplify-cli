import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface VPNConnectionRouteProperties {
    DestinationCidrBlock: Value<string>;
    VpnConnectionId: Value<string>;
}
export default class VPNConnectionRoute extends ResourceBase {
    constructor(properties?: VPNConnectionRouteProperties);
}
