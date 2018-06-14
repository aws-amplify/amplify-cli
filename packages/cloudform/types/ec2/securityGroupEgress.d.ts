import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface SecurityGroupEgressProperties {
    CidrIp?: Value<string>;
    CidrIpv6?: Value<string>;
    Description?: Value<string>;
    DestinationPrefixListId?: Value<string>;
    DestinationSecurityGroupId?: Value<string>;
    FromPort?: Value<number>;
    GroupId: Value<string>;
    IpProtocol: Value<string>;
    ToPort?: Value<number>;
}
export default class SecurityGroupEgress extends ResourceBase {
    constructor(properties?: SecurityGroupEgressProperties);
}
