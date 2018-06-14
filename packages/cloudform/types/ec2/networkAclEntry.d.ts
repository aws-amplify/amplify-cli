import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class Icmp {
    Code?: Value<number>;
    Type?: Value<number>;
    constructor(properties: Icmp);
}
export declare class PortRange {
    From?: Value<number>;
    To?: Value<number>;
    constructor(properties: PortRange);
}
export interface NetworkAclEntryProperties {
    CidrBlock: Value<string>;
    Egress?: Value<boolean>;
    Icmp?: Icmp;
    Ipv6CidrBlock?: Value<string>;
    NetworkAclId: Value<string>;
    PortRange?: PortRange;
    Protocol: Value<number>;
    RuleAction: Value<string>;
    RuleNumber: Value<number>;
}
export default class NetworkAclEntry extends ResourceBase {
    static Icmp: typeof Icmp;
    static PortRange: typeof PortRange;
    constructor(properties?: NetworkAclEntryProperties);
}
