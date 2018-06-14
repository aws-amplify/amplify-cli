import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface VPNGatewayProperties {
    AmazonSideAsn?: Value<number>;
    Tags?: ResourceTag[];
    Type: Value<string>;
}
export default class VPNGateway extends ResourceBase {
    constructor(properties?: VPNGatewayProperties);
}
