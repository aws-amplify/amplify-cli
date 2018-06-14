import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ParameterProperties {
    Type: Value<string>;
    Description?: Value<string>;
    AllowedPattern?: Value<string>;
    Value: Value<string>;
    Name?: Value<string>;
}
export default class Parameter extends ResourceBase {
    constructor(properties?: ParameterProperties);
}
