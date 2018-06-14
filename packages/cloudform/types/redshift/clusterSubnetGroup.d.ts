import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export interface ClusterSubnetGroupProperties {
    Description: Value<string>;
    SubnetIds: List<Value<string>>;
    Tags?: ResourceTag[];
}
export default class ClusterSubnetGroup extends ResourceBase {
    constructor(properties?: ClusterSubnetGroupProperties);
}
