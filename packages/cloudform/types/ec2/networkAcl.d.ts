import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface NetworkAclProperties {
    Tags?: ResourceTag[];
    VpcId: Value<string>;
}
export default class NetworkAcl extends ResourceBase {
    constructor(properties?: NetworkAclProperties);
}
