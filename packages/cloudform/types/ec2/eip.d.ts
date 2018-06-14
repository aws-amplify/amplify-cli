import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface EIPProperties {
    Domain?: Value<string>;
    InstanceId?: Value<string>;
}
export default class EIP extends ResourceBase {
    constructor(properties?: EIPProperties);
}
