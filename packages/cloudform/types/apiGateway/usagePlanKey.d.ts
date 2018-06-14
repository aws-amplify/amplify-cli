import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface UsagePlanKeyProperties {
    KeyId: Value<string>;
    KeyType: Value<string>;
    UsagePlanId: Value<string>;
}
export default class UsagePlanKey extends ResourceBase {
    constructor(properties?: UsagePlanKeyProperties);
}
