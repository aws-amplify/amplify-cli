import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface VPCGatewayAttachmentProperties {
    InternetGatewayId?: Value<string>;
    VpcId: Value<string>;
    VpnGatewayId?: Value<string>;
}
export default class VPCGatewayAttachment extends ResourceBase {
    constructor(properties?: VPCGatewayAttachmentProperties);
}
