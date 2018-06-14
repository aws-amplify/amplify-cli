import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export interface ReplicationSubnetGroupProperties {
    ReplicationSubnetGroupDescription: Value<string>;
    ReplicationSubnetGroupIdentifier?: Value<string>;
    SubnetIds: List<Value<string>>;
    Tags?: ResourceTag[];
}
export default class ReplicationSubnetGroup extends ResourceBase {
    constructor(properties?: ReplicationSubnetGroupProperties);
}
