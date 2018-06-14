import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface DBParameterGroupProperties {
    Description: Value<string>;
    Parameters: any;
    Family: Value<string>;
    Tags?: ResourceTag[];
    Name?: Value<string>;
}
export default class DBParameterGroup extends ResourceBase {
    constructor(properties?: DBParameterGroupProperties);
}
