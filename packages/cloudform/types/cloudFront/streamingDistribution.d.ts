import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class TrustedSigners {
    Enabled: Value<boolean>;
    AwsAccountNumbers?: List<Value<string>>;
    constructor(properties: TrustedSigners);
}
export declare class S3Origin {
    DomainName: Value<string>;
    OriginAccessIdentity: Value<string>;
    constructor(properties: S3Origin);
}
export declare class Logging {
    Bucket: Value<string>;
    Enabled: Value<boolean>;
    Prefix: Value<string>;
    constructor(properties: Logging);
}
export declare class StreamingDistributionConfig {
    Logging?: Logging;
    Comment: Value<string>;
    PriceClass?: Value<string>;
    S3Origin: S3Origin;
    Enabled: Value<boolean>;
    Aliases?: List<Value<string>>;
    TrustedSigners: TrustedSigners;
    constructor(properties: StreamingDistributionConfig);
}
export interface StreamingDistributionProperties {
    StreamingDistributionConfig: StreamingDistributionConfig;
    Tags?: ResourceTag[];
}
export default class StreamingDistribution extends ResourceBase {
    static TrustedSigners: typeof TrustedSigners;
    static S3Origin: typeof S3Origin;
    static Logging: typeof Logging;
    static StreamingDistributionConfig: typeof StreamingDistributionConfig;
    constructor(properties?: StreamingDistributionProperties);
}
