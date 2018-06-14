import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface ResourceProperties {
    ParentId: Value<string>;
    PathPart: Value<string>;
    RestApiId: Value<string>;
}
export default class Resource extends ResourceBase {
    constructor(properties?: ResourceProperties);
}
