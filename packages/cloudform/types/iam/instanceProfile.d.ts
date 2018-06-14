import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface InstanceProfileProperties {
    InstanceProfileName?: Value<string>;
    Path?: Value<string>;
    Roles: List<Value<string>>;
}
export default class InstanceProfile extends ResourceBase {
    constructor(properties?: InstanceProfileProperties);
}
