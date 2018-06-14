/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class Cookies {
    WhitelistedNames?: List<Value<string>>
    Forward: Value<string>

    constructor(properties: Cookies) {
        Object.assign(this, properties)
    }
}

export class LambdaFunctionAssociation {
    EventType?: Value<string>
    LambdaFunctionARN?: Value<string>

    constructor(properties: LambdaFunctionAssociation) {
        Object.assign(this, properties)
    }
}

export class CustomOriginConfig {
    OriginReadTimeout?: Value<number>
    HTTPSPort?: Value<number>
    OriginKeepaliveTimeout?: Value<number>
    OriginSSLProtocols?: List<Value<string>>
    HTTPPort?: Value<number>
    OriginProtocolPolicy: Value<string>

    constructor(properties: CustomOriginConfig) {
        Object.assign(this, properties)
    }
}

export class ForwardedValues {
    Cookies?: Cookies
    Headers?: List<Value<string>>
    QueryString: Value<boolean>
    QueryStringCacheKeys?: List<Value<string>>

    constructor(properties: ForwardedValues) {
        Object.assign(this, properties)
    }
}

export class CacheBehavior {
    Compress?: Value<boolean>
    LambdaFunctionAssociations?: List<LambdaFunctionAssociation>
    TargetOriginId: Value<string>
    ViewerProtocolPolicy: Value<string>
    TrustedSigners?: List<Value<string>>
    DefaultTTL?: Value<number>
    AllowedMethods?: List<Value<string>>
    PathPattern: Value<string>
    CachedMethods?: List<Value<string>>
    SmoothStreaming?: Value<boolean>
    ForwardedValues: ForwardedValues
    MinTTL?: Value<number>
    MaxTTL?: Value<number>

    constructor(properties: CacheBehavior) {
        Object.assign(this, properties)
    }
}

export class DefaultCacheBehavior {
    Compress?: Value<boolean>
    AllowedMethods?: List<Value<string>>
    CachedMethods?: List<Value<string>>
    LambdaFunctionAssociations?: List<LambdaFunctionAssociation>
    SmoothStreaming?: Value<boolean>
    TargetOriginId: Value<string>
    ViewerProtocolPolicy: Value<string>
    ForwardedValues: ForwardedValues
    MinTTL?: Value<number>
    MaxTTL?: Value<number>
    TrustedSigners?: List<Value<string>>
    DefaultTTL?: Value<number>

    constructor(properties: DefaultCacheBehavior) {
        Object.assign(this, properties)
    }
}

export class Restrictions {
    GeoRestriction: GeoRestriction

    constructor(properties: Restrictions) {
        Object.assign(this, properties)
    }
}

export class Origin {
    OriginCustomHeaders?: List<OriginCustomHeader>
    DomainName: Value<string>
    S3OriginConfig?: S3OriginConfig
    OriginPath?: Value<string>
    Id: Value<string>
    CustomOriginConfig?: CustomOriginConfig

    constructor(properties: Origin) {
        Object.assign(this, properties)
    }
}

export class GeoRestriction {
    Locations?: List<Value<string>>
    RestrictionType: Value<string>

    constructor(properties: GeoRestriction) {
        Object.assign(this, properties)
    }
}

export class ViewerCertificate {
    IamCertificateId?: Value<string>
    SslSupportMethod?: Value<string>
    MinimumProtocolVersion?: Value<string>
    CloudFrontDefaultCertificate?: Value<boolean>
    AcmCertificateArn?: Value<string>

    constructor(properties: ViewerCertificate) {
        Object.assign(this, properties)
    }
}

export class S3OriginConfig {
    OriginAccessIdentity?: Value<string>

    constructor(properties: S3OriginConfig) {
        Object.assign(this, properties)
    }
}

export class CustomErrorResponse {
    ResponseCode?: Value<number>
    ErrorCachingMinTTL?: Value<number>
    ErrorCode: Value<number>
    ResponsePagePath?: Value<string>

    constructor(properties: CustomErrorResponse) {
        Object.assign(this, properties)
    }
}

export class Logging {
    IncludeCookies?: Value<boolean>
    Bucket: Value<string>
    Prefix?: Value<string>

    constructor(properties: Logging) {
        Object.assign(this, properties)
    }
}

export class DistributionConfig {
    Logging?: Logging
    Comment?: Value<string>
    DefaultRootObject?: Value<string>
    Origins?: List<Origin>
    ViewerCertificate?: ViewerCertificate
    PriceClass?: Value<string>
    DefaultCacheBehavior?: DefaultCacheBehavior
    CustomErrorResponses?: List<CustomErrorResponse>
    Enabled: Value<boolean>
    Aliases?: List<Value<string>>
    IPV6Enabled?: Value<boolean>
    WebACLId?: Value<string>
    HttpVersion?: Value<string>
    Restrictions?: Restrictions
    CacheBehaviors?: List<CacheBehavior>

    constructor(properties: DistributionConfig) {
        Object.assign(this, properties)
    }
}

export class OriginCustomHeader {
    HeaderValue: Value<string>
    HeaderName: Value<string>

    constructor(properties: OriginCustomHeader) {
        Object.assign(this, properties)
    }
}

export interface DistributionProperties {
    DistributionConfig: DistributionConfig
    Tags?: ResourceTag[]
}

export default class Distribution extends ResourceBase {
    static Cookies = Cookies
    static LambdaFunctionAssociation = LambdaFunctionAssociation
    static CustomOriginConfig = CustomOriginConfig
    static ForwardedValues = ForwardedValues
    static CacheBehavior = CacheBehavior
    static DefaultCacheBehavior = DefaultCacheBehavior
    static Restrictions = Restrictions
    static Origin = Origin
    static GeoRestriction = GeoRestriction
    static ViewerCertificate = ViewerCertificate
    static S3OriginConfig = S3OriginConfig
    static CustomErrorResponse = CustomErrorResponse
    static Logging = Logging
    static DistributionConfig = DistributionConfig
    static OriginCustomHeader = OriginCustomHeader

    constructor(properties?: DistributionProperties) {
        super('AWS::CloudFront::Distribution', properties)
    }
}
