import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface SubnetGroupProperties {
    CacheSubnetGroupName?: Value<string>;
    Description: Value<string>;
    SubnetIds: List<Value<string>>;
}
export default class SubnetGroup extends ResourceBase {
    constructor(properties?: SubnetGroupProperties);
}
