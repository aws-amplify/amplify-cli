import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface InstanceProperties {
    InstanceAttributes: any;
    InstanceId?: Value<string>;
    ServiceId: Value<string>;
}
export default class Instance extends ResourceBase {
    constructor(properties?: InstanceProperties);
}
