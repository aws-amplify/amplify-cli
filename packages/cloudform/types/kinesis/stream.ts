/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class StreamEncryption {
    EncryptionType: Value<string>
    KeyId: Value<string>

    constructor(properties: StreamEncryption) {
        Object.assign(this, properties)
    }
}

export interface StreamProperties {
    Name?: Value<string>
    RetentionPeriodHours?: Value<number>
    ShardCount: Value<number>
    StreamEncryption?: StreamEncryption
    Tags?: ResourceTag[]
}

export default class Stream extends ResourceBase {
    static StreamEncryption = StreamEncryption

    constructor(properties?: StreamProperties) {
        super('AWS::Kinesis::Stream', properties)
    }
}
