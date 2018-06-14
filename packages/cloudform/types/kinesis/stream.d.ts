import { ResourceBase, ResourceTag } from '../resource';
import { Value } from '../dataTypes';
export declare class StreamEncryption {
    EncryptionType: Value<string>;
    KeyId: Value<string>;
    constructor(properties: StreamEncryption);
}
export interface StreamProperties {
    Name?: Value<string>;
    RetentionPeriodHours?: Value<number>;
    ShardCount: Value<number>;
    StreamEncryption?: StreamEncryption;
    Tags?: ResourceTag[];
}
export default class Stream extends ResourceBase {
    static StreamEncryption: typeof StreamEncryption;
    constructor(properties?: StreamProperties);
}
