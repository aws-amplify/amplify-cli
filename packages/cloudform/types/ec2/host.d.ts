import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface HostProperties {
    AutoPlacement?: Value<string>;
    AvailabilityZone: Value<string>;
    InstanceType: Value<string>;
}
export default class Host extends ResourceBase {
    constructor(properties?: HostProperties);
}
