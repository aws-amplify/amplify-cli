import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface BasePathMappingProperties {
    BasePath?: Value<string>;
    DomainName: Value<string>;
    RestApiId?: Value<string>;
    Stage?: Value<string>;
}
export default class BasePathMapping extends ResourceBase {
    constructor(properties?: BasePathMappingProperties);
}
