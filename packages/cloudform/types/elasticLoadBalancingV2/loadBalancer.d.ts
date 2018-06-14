import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class LoadBalancerAttribute {
    Key?: Value<string>;
    Value?: Value<string>;
    constructor(properties: LoadBalancerAttribute);
}
export declare class SubnetMapping {
    AllocationId: Value<string>;
    SubnetId: Value<string>;
    constructor(properties: SubnetMapping);
}
export interface LoadBalancerProperties {
    IpAddressType?: Value<string>;
    LoadBalancerAttributes?: List<LoadBalancerAttribute>;
    Name?: Value<string>;
    Scheme?: Value<string>;
    SecurityGroups?: List<Value<string>>;
    SubnetMappings?: List<SubnetMapping>;
    Subnets?: List<Value<string>>;
    Tags?: ResourceTag[];
    Type?: Value<string>;
}
export default class LoadBalancer extends ResourceBase {
    static LoadBalancerAttribute: typeof LoadBalancerAttribute;
    static SubnetMapping: typeof SubnetMapping;
    constructor(properties?: LoadBalancerProperties);
}
