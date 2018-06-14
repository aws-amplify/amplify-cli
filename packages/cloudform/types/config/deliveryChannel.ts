/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class ConfigSnapshotDeliveryProperties {
    DeliveryFrequency?: Value<string>

    constructor(properties: ConfigSnapshotDeliveryProperties) {
        Object.assign(this, properties)
    }
}

export interface DeliveryChannelProperties {
    ConfigSnapshotDeliveryProperties?: ConfigSnapshotDeliveryProperties
    Name?: Value<string>
    S3BucketName: Value<string>
    S3KeyPrefix?: Value<string>
    SnsTopicARN?: Value<string>
}

export default class DeliveryChannel extends ResourceBase {
    static ConfigSnapshotDeliveryProperties = ConfigSnapshotDeliveryProperties

    constructor(properties?: DeliveryChannelProperties) {
        super('AWS::Config::DeliveryChannel', properties)
    }
}
