import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface SubnetCidrBlockProperties {
    Ipv6CidrBlock: Value<string>;
    SubnetId: Value<string>;
}
export default class SubnetCidrBlock extends ResourceBase {
    constructor(properties?: SubnetCidrBlockProperties);
}
