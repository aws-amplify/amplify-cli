import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface VPCCidrBlockProperties {
    AmazonProvidedIpv6CidrBlock?: Value<boolean>;
    CidrBlock?: Value<string>;
    VpcId: Value<string>;
}
export default class VPCCidrBlock extends ResourceBase {
    constructor(properties?: VPCCidrBlockProperties);
}
