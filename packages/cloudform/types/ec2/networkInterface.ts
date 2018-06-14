/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class InstanceIpv6Address {
    Ipv6Address: Value<string>

    constructor(properties: InstanceIpv6Address) {
        Object.assign(this, properties)
    }
}

export class PrivateIpAddressSpecification {
    Primary: Value<boolean>
    PrivateIpAddress: Value<string>

    constructor(properties: PrivateIpAddressSpecification) {
        Object.assign(this, properties)
    }
}

export interface NetworkInterfaceProperties {
    Description?: Value<string>
    GroupSet?: List<Value<string>>
    InterfaceType?: Value<string>
    Ipv6AddressCount?: Value<number>
    Ipv6Addresses?: InstanceIpv6Address
    PrivateIpAddress?: Value<string>
    PrivateIpAddresses?: List<PrivateIpAddressSpecification>
    SecondaryPrivateIpAddressCount?: Value<number>
    SourceDestCheck?: Value<boolean>
    SubnetId: Value<string>
    Tags?: ResourceTag[]
}

export default class NetworkInterface extends ResourceBase {
    static InstanceIpv6Address = InstanceIpv6Address
    static PrivateIpAddressSpecification = PrivateIpAddressSpecification

    constructor(properties?: NetworkInterfaceProperties) {
        super('AWS::EC2::NetworkInterface', properties)
    }
}
