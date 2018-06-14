/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class Icmp {
    Code?: Value<number>
    Type?: Value<number>

    constructor(properties: Icmp) {
        Object.assign(this, properties)
    }
}

export class PortRange {
    From?: Value<number>
    To?: Value<number>

    constructor(properties: PortRange) {
        Object.assign(this, properties)
    }
}

export interface NetworkAclEntryProperties {
    CidrBlock: Value<string>
    Egress?: Value<boolean>
    Icmp?: Icmp
    Ipv6CidrBlock?: Value<string>
    NetworkAclId: Value<string>
    PortRange?: PortRange
    Protocol: Value<number>
    RuleAction: Value<string>
    RuleNumber: Value<number>
}

export default class NetworkAclEntry extends ResourceBase {
    static Icmp = Icmp
    static PortRange = PortRange

    constructor(properties?: NetworkAclEntryProperties) {
        super('AWS::EC2::NetworkAclEntry', properties)
    }
}
