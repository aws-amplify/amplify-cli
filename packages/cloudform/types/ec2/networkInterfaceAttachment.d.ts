import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export interface NetworkInterfaceAttachmentProperties {
    DeleteOnTermination?: Value<boolean>;
    DeviceIndex: Value<string>;
    InstanceId: Value<string>;
    NetworkInterfaceId: Value<string>;
}
export default class NetworkInterfaceAttachment extends ResourceBase {
    constructor(properties?: NetworkInterfaceAttachmentProperties);
}
