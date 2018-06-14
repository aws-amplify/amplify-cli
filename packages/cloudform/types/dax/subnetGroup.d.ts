import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface SubnetGroupProperties {
    Description?: Value<string>;
    SubnetGroupName?: Value<string>;
    SubnetIds: List<Value<string>>;
}
export default class SubnetGroup extends ResourceBase {
    constructor(properties?: SubnetGroupProperties);
}
