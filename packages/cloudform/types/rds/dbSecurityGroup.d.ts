import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Ingress {
    CIDRIP?: Value<string>;
    EC2SecurityGroupId?: Value<string>;
    EC2SecurityGroupName?: Value<string>;
    EC2SecurityGroupOwnerId?: Value<string>;
    constructor(properties: Ingress);
}
export interface DBSecurityGroupProperties {
    DBSecurityGroupIngress: List<Ingress>;
    EC2VpcId?: Value<string>;
    GroupDescription: Value<string>;
    Tags?: ResourceTag[];
}
export default class DBSecurityGroup extends ResourceBase {
    static Ingress: typeof Ingress;
    constructor(properties?: DBSecurityGroupProperties);
}
