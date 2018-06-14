/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class MethodSetting {
    CacheDataEncrypted?: Value<boolean>
    CacheTtlInSeconds?: Value<number>
    CachingEnabled?: Value<boolean>
    DataTraceEnabled?: Value<boolean>
    HttpMethod?: Value<string>
    LoggingLevel?: Value<string>
    MetricsEnabled?: Value<boolean>
    ResourcePath?: Value<string>
    ThrottlingBurstLimit?: Value<number>
    ThrottlingRateLimit?: Value<number>

    constructor(properties: MethodSetting) {
        Object.assign(this, properties)
    }
}

export class StageDescription {
    CacheClusterEnabled?: Value<boolean>
    CacheClusterSize?: Value<string>
    CacheDataEncrypted?: Value<boolean>
    CacheTtlInSeconds?: Value<number>
    CachingEnabled?: Value<boolean>
    ClientCertificateId?: Value<string>
    DataTraceEnabled?: Value<boolean>
    Description?: Value<string>
    DocumentationVersion?: Value<string>
    LoggingLevel?: Value<string>
    MethodSettings?: List<MethodSetting>
    MetricsEnabled?: Value<boolean>
    ThrottlingBurstLimit?: Value<number>
    ThrottlingRateLimit?: Value<number>
    Variables?: {[key: string]: Value<string>}

    constructor(properties: StageDescription) {
        Object.assign(this, properties)
    }
}

export interface DeploymentProperties {
    Description?: Value<string>
    RestApiId: Value<string>
    StageDescription?: StageDescription
    StageName?: Value<string>
}

export default class Deployment extends ResourceBase {
    static MethodSetting = MethodSetting
    static StageDescription = StageDescription

    constructor(properties?: DeploymentProperties) {
        super('AWS::ApiGateway::Deployment', properties)
    }
}
