import { ResourceBase } from '../resource';
import { Value } from '../dataTypes';
export declare class ConfigSnapshotDeliveryProperties {
    DeliveryFrequency?: Value<string>;
    constructor(properties: ConfigSnapshotDeliveryProperties);
}
export interface DeliveryChannelProperties {
    ConfigSnapshotDeliveryProperties?: ConfigSnapshotDeliveryProperties;
    Name?: Value<string>;
    S3BucketName: Value<string>;
    S3KeyPrefix?: Value<string>;
    SnsTopicARN?: Value<string>;
}
export default class DeliveryChannel extends ResourceBase {
    static ConfigSnapshotDeliveryProperties: typeof ConfigSnapshotDeliveryProperties;
    constructor(properties?: DeliveryChannelProperties);
}
