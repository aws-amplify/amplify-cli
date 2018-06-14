import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface VolumeAttachmentProperties {
    Device: Value<string>;
    InstanceId: Value<string>;
    VolumeId: Value<string>;
}
export default class VolumeAttachment extends ResourceBase {
    constructor(properties?: VolumeAttachmentProperties);
}
