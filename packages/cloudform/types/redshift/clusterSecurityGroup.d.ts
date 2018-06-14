import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface ClusterSecurityGroupProperties {
    Description: Value<string>;
    Tags?: ResourceTag[];
}
export default class ClusterSecurityGroup extends ResourceBase {
    constructor(properties?: ClusterSecurityGroupProperties);
}
