import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export interface MountTargetProperties {
    FileSystemId: Value<string>;
    IpAddress?: Value<string>;
    SecurityGroups: List<Value<string>>;
    SubnetId: Value<string>;
}
export default class MountTarget extends ResourceBase {
    constructor(properties?: MountTargetProperties);
}
