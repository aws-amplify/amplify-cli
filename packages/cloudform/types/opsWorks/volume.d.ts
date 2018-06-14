import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface VolumeProperties {
    Ec2VolumeId: Value<string>;
    MountPoint?: Value<string>;
    Name?: Value<string>;
    StackId: Value<string>;
}
export default class Volume extends ResourceBase {
    constructor(properties?: VolumeProperties);
}
