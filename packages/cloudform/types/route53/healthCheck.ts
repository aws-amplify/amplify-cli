/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class HealthCheckConfig {
    AlarmIdentifier?: AlarmIdentifier
    ChildHealthChecks?: List<Value<string>>
    EnableSNI?: Value<boolean>
    FailureThreshold?: Value<number>
    FullyQualifiedDomainName?: Value<string>
    HealthThreshold?: Value<number>
    IPAddress?: Value<string>
    InsufficientDataHealthStatus?: Value<string>
    Inverted?: Value<boolean>
    MeasureLatency?: Value<boolean>
    Port?: Value<number>
    Regions?: List<Value<string>>
    RequestInterval?: Value<number>
    ResourcePath?: Value<string>
    SearchString?: Value<string>
    Type: Value<string>

    constructor(properties: HealthCheckConfig) {
        Object.assign(this, properties)
    }
}

export class HealthCheckTag {
    Key: Value<string>
    Value: Value<string>

    constructor(properties: HealthCheckTag) {
        Object.assign(this, properties)
    }
}

export class AlarmIdentifier {
    Name: Value<string>
    Region: Value<string>

    constructor(properties: AlarmIdentifier) {
        Object.assign(this, properties)
    }
}

export interface HealthCheckProperties {
    HealthCheckConfig: HealthCheckConfig
    HealthCheckTags?: List<HealthCheckTag>
}

export default class HealthCheck extends ResourceBase {
    static HealthCheckConfig = HealthCheckConfig
    static HealthCheckTag = HealthCheckTag
    static AlarmIdentifier = AlarmIdentifier

    constructor(properties?: HealthCheckProperties) {
        super('AWS::Route53::HealthCheck', properties)
    }
}
