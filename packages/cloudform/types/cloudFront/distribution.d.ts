import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class Cookies {
    WhitelistedNames?: List<Value<string>>;
    Forward: Value<string>;
    constructor(properties: Cookies);
}
export declare class LambdaFunctionAssociation {
    EventType?: Value<string>;
    LambdaFunctionARN?: Value<string>;
    constructor(properties: LambdaFunctionAssociation);
}
export declare class CustomOriginConfig {
    OriginReadTimeout?: Value<number>;
    HTTPSPort?: Value<number>;
    OriginKeepaliveTimeout?: Value<number>;
    OriginSSLProtocols?: List<Value<string>>;
    HTTPPort?: Value<number>;
    OriginProtocolPolicy: Value<string>;
    constructor(properties: CustomOriginConfig);
}
export declare class ForwardedValues {
    Cookies?: Cookies;
    Headers?: List<Value<string>>;
    QueryString: Value<boolean>;
    QueryStringCacheKeys?: List<Value<string>>;
    constructor(properties: ForwardedValues);
}
export declare class CacheBehavior {
    Compress?: Value<boolean>;
    LambdaFunctionAssociations?: List<LambdaFunctionAssociation>;
    TargetOriginId: Value<string>;
    ViewerProtocolPolicy: Value<string>;
    TrustedSigners?: List<Value<string>>;
    DefaultTTL?: Value<number>;
    AllowedMethods?: List<Value<string>>;
    PathPattern: Value<string>;
    CachedMethods?: List<Value<string>>;
    SmoothStreaming?: Value<boolean>;
    ForwardedValues: ForwardedValues;
    MinTTL?: Value<number>;
    MaxTTL?: Value<number>;
    constructor(properties: CacheBehavior);
}
export declare class DefaultCacheBehavior {
    Compress?: Value<boolean>;
    AllowedMethods?: List<Value<string>>;
    CachedMethods?: List<Value<string>>;
    LambdaFunctionAssociations?: List<LambdaFunctionAssociation>;
    SmoothStreaming?: Value<boolean>;
    TargetOriginId: Value<string>;
    ViewerProtocolPolicy: Value<string>;
    ForwardedValues: ForwardedValues;
    MinTTL?: Value<number>;
    MaxTTL?: Value<number>;
    TrustedSigners?: List<Value<string>>;
    DefaultTTL?: Value<number>;
    constructor(properties: DefaultCacheBehavior);
}
export declare class Restrictions {
    GeoRestriction: GeoRestriction;
    constructor(properties: Restrictions);
}
export declare class Origin {
    OriginCustomHeaders?: List<OriginCustomHeader>;
    DomainName: Value<string>;
    S3OriginConfig?: S3OriginConfig;
    OriginPath?: Value<string>;
    Id: Value<string>;
    CustomOriginConfig?: CustomOriginConfig;
    constructor(properties: Origin);
}
export declare class GeoRestriction {
    Locations?: List<Value<string>>;
    RestrictionType: Value<string>;
    constructor(properties: GeoRestriction);
}
export declare class ViewerCertificate {
    IamCertificateId?: Value<string>;
    SslSupportMethod?: Value<string>;
    MinimumProtocolVersion?: Value<string>;
    CloudFrontDefaultCertificate?: Value<boolean>;
    AcmCertificateArn?: Value<string>;
    constructor(properties: ViewerCertificate);
}
export declare class S3OriginConfig {
    OriginAccessIdentity?: Value<string>;
    constructor(properties: S3OriginConfig);
}
export declare class CustomErrorResponse {
    ResponseCode?: Value<number>;
    ErrorCachingMinTTL?: Value<number>;
    ErrorCode: Value<number>;
    ResponsePagePath?: Value<string>;
    constructor(properties: CustomErrorResponse);
}
export declare class Logging {
    IncludeCookies?: Value<boolean>;
    Bucket: Value<string>;
    Prefix?: Value<string>;
    constructor(properties: Logging);
}
export declare class DistributionConfig {
    Logging?: Logging;
    Comment?: Value<string>;
    DefaultRootObject?: Value<string>;
    Origins?: List<Origin>;
    ViewerCertificate?: ViewerCertificate;
    PriceClass?: Value<string>;
    DefaultCacheBehavior?: DefaultCacheBehavior;
    CustomErrorResponses?: List<CustomErrorResponse>;
    Enabled: Value<boolean>;
    Aliases?: List<Value<string>>;
    IPV6Enabled?: Value<boolean>;
    WebACLId?: Value<string>;
    HttpVersion?: Value<string>;
    Restrictions?: Restrictions;
    CacheBehaviors?: List<CacheBehavior>;
    constructor(properties: DistributionConfig);
}
export declare class OriginCustomHeader {
    HeaderValue: Value<string>;
    HeaderName: Value<string>;
    constructor(properties: OriginCustomHeader);
}
export interface DistributionProperties {
    DistributionConfig: DistributionConfig;
    Tags?: ResourceTag[];
}
export default class Distribution extends ResourceBase {
    static Cookies: typeof Cookies;
    static LambdaFunctionAssociation: typeof LambdaFunctionAssociation;
    static CustomOriginConfig: typeof CustomOriginConfig;
    static ForwardedValues: typeof ForwardedValues;
    static CacheBehavior: typeof CacheBehavior;
    static DefaultCacheBehavior: typeof DefaultCacheBehavior;
    static Restrictions: typeof Restrictions;
    static Origin: typeof Origin;
    static GeoRestriction: typeof GeoRestriction;
    static ViewerCertificate: typeof ViewerCertificate;
    static S3OriginConfig: typeof S3OriginConfig;
    static CustomErrorResponse: typeof CustomErrorResponse;
    static Logging: typeof Logging;
    static DistributionConfig: typeof DistributionConfig;
    static OriginCustomHeader: typeof OriginCustomHeader;
    constructor(properties?: DistributionProperties);
}
