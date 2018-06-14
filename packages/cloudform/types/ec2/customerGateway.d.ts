import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface CustomerGatewayProperties {
    BgpAsn: Value<number>;
    IpAddress: Value<string>;
    Tags?: ResourceTag[];
    Type: Value<string>;
}
export default class CustomerGateway extends ResourceBase {
    constructor(properties?: CustomerGatewayProperties);
}
