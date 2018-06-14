import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface NatGatewayProperties {
    AllocationId: Value<string>;
    SubnetId: Value<string>;
    Tags?: ResourceTag[];
}
export default class NatGateway extends ResourceBase {
    constructor(properties?: NatGatewayProperties);
}
