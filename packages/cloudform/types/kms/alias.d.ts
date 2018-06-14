import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface AliasProperties {
    AliasName: Value<string>;
    TargetKeyId: Value<string>;
}
export default class Alias extends ResourceBase {
    constructor(properties?: AliasProperties);
}
