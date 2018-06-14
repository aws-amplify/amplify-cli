import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface DBParameterGroupProperties {
    Description: Value<string>;
    Family: Value<string>;
    Parameters?: {
        [key: string]: Value<string>;
    };
    Tags?: ResourceTag[];
}
export default class DBParameterGroup extends ResourceBase {
    constructor(properties?: DBParameterGroupProperties);
}
