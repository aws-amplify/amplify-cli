import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ParameterGroupProperties {
    ParameterNameValues?: any;
    Description?: Value<string>;
    ParameterGroupName?: Value<string>;
}
export default class ParameterGroup extends ResourceBase {
    constructor(properties?: ParameterGroupProperties);
}
