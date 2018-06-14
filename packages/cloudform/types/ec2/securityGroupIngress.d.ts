import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface SecurityGroupIngressProperties {
    CidrIp?: Value<string>;
    CidrIpv6?: Value<string>;
    Description?: Value<string>;
    FromPort?: Value<number>;
    GroupId?: Value<string>;
    GroupName?: Value<string>;
    IpProtocol: Value<string>;
    SourceSecurityGroupId?: Value<string>;
    SourceSecurityGroupName?: Value<string>;
    SourceSecurityGroupOwnerId?: Value<string>;
    ToPort?: Value<number>;
}
export default class SecurityGroupIngress extends ResourceBase {
    constructor(properties?: SecurityGroupIngressProperties);
}
