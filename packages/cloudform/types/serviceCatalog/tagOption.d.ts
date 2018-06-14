import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface TagOptionProperties {
    Active?: Value<boolean>;
    Value: Value<string>;
    Key: Value<string>;
}
export default class TagOption extends ResourceBase {
    constructor(properties?: TagOptionProperties);
}
