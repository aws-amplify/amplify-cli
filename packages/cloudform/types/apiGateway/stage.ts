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

export interface StageProperties {
    CacheClusterEnabled?: Value<boolean>
    CacheClusterSize?: Value<string>
    ClientCertificateId?: Value<string>
    DeploymentId?: Value<string>
    Description?: Value<string>
    DocumentationVersion?: Value<string>
    MethodSettings?: List<MethodSetting>
    RestApiId: Value<string>
    StageName?: Value<string>
    Variables?: {[key: string]: Value<string>}
}

export default class Stage extends ResourceBase {
    static MethodSetting = MethodSetting

    constructor(properties?: StageProperties) {
        super('AWS::ApiGateway::Stage', properties)
    }
}
