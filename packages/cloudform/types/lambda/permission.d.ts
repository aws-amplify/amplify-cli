import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface PermissionProperties {
    Action: Value<string>;
    EventSourceToken?: Value<string>;
    FunctionName: Value<string>;
    Principal: Value<string>;
    SourceAccount?: Value<string>;
    SourceArn?: Value<string>;
}
export default class Permission extends ResourceBase {
    constructor(properties?: PermissionProperties);
}
