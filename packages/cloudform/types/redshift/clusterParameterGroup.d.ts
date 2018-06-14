import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Parameter {
    ParameterName: Value<string>;
    ParameterValue: Value<string>;
    constructor(properties: Parameter);
}
export interface ClusterParameterGroupProperties {
    Description: Value<string>;
    ParameterGroupFamily: Value<string>;
    Parameters?: List<Parameter>;
    Tags?: ResourceTag[];
}
export default class ClusterParameterGroup extends ResourceBase {
    static Parameter: typeof Parameter;
    constructor(properties?: ClusterParameterGroupProperties);
}
