import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface DBClusterParameterGroupProperties {
    Description: Value<string>;
    Family: Value<string>;
    Parameters: any;
    Tags?: ResourceTag[];
}
export default class DBClusterParameterGroup extends ResourceBase {
    constructor(properties?: DBClusterParameterGroupProperties);
}
