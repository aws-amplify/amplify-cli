import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface SecurityGroupIngressProperties {
    CacheSecurityGroupName: Value<string>;
    EC2SecurityGroupName: Value<string>;
    EC2SecurityGroupOwnerId?: Value<string>;
}
export default class SecurityGroupIngress extends ResourceBase {
    constructor(properties?: SecurityGroupIngressProperties);
}
