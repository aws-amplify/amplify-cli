import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class InstanceIpv6Address {
    Ipv6Address: Value<string>;
    constructor(properties: InstanceIpv6Address);
}
export declare class PrivateIpAddressSpecification {
    Primary: Value<boolean>;
    PrivateIpAddress: Value<string>;
    constructor(properties: PrivateIpAddressSpecification);
}
export interface NetworkInterfaceProperties {
    Description?: Value<string>;
    GroupSet?: List<Value<string>>;
    InterfaceType?: Value<string>;
    Ipv6AddressCount?: Value<number>;
    Ipv6Addresses?: InstanceIpv6Address;
    PrivateIpAddress?: Value<string>;
    PrivateIpAddresses?: List<PrivateIpAddressSpecification>;
    SecondaryPrivateIpAddressCount?: Value<number>;
    SourceDestCheck?: Value<boolean>;
    SubnetId: Value<string>;
    Tags?: ResourceTag[];
}
export default class NetworkInterface extends ResourceBase {
    static InstanceIpv6Address: typeof InstanceIpv6Address;
    static PrivateIpAddressSpecification: typeof PrivateIpAddressSpecification;
    constructor(properties?: NetworkInterfaceProperties);
}
