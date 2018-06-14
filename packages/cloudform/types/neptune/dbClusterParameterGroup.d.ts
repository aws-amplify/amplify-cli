import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export interface DBClusterParameterGroupProperties {
    Description: Value<string>;
    Parameters: any;
    Family: Value<string>;
    Tags?: ResourceTag[];
    Name?: Value<string>;
}
export default class DBClusterParameterGroup extends ResourceBase {
    constructor(properties?: DBClusterParameterGroupProperties);
}
