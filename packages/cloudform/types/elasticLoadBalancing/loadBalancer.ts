/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.4.0 */
   
import {ResourceBase, ResourceTag} from '../resource'
import {Value, List} from '../dataTypes'

export class HealthCheck {
    HealthyThreshold: Value<string>
    Interval: Value<string>
    Target: Value<string>
    Timeout: Value<string>
    UnhealthyThreshold: Value<string>

    constructor(properties: HealthCheck) {
        Object.assign(this, properties)
    }
}

export class AccessLoggingPolicy {
    EmitInterval?: Value<number>
    Enabled: Value<boolean>
    S3BucketName: Value<string>
    S3BucketPrefix?: Value<string>

    constructor(properties: AccessLoggingPolicy) {
        Object.assign(this, properties)
    }
}

export class ConnectionSettings {
    IdleTimeout: Value<number>

    constructor(properties: ConnectionSettings) {
        Object.assign(this, properties)
    }
}

export class LBCookieStickinessPolicy {
    CookieExpirationPeriod?: Value<string>
    PolicyName?: Value<string>

    constructor(properties: LBCookieStickinessPolicy) {
        Object.assign(this, properties)
    }
}

export class ConnectionDrainingPolicy {
    Enabled: Value<boolean>
    Timeout?: Value<number>

    constructor(properties: ConnectionDrainingPolicy) {
        Object.assign(this, properties)
    }
}

export class Listeners {
    InstancePort: Value<string>
    InstanceProtocol?: Value<string>
    LoadBalancerPort: Value<string>
    PolicyNames?: List<Value<string>>
    Protocol: Value<string>
    SSLCertificateId?: Value<string>

    constructor(properties: Listeners) {
        Object.assign(this, properties)
    }
}

export class Policies {
    Attributes: List<any>
    InstancePorts?: List<Value<string>>
    LoadBalancerPorts?: List<Value<string>>
    PolicyName: Value<string>
    PolicyType: Value<string>

    constructor(properties: Policies) {
        Object.assign(this, properties)
    }
}

export class AppCookieStickinessPolicy {
    CookieName: Value<string>
    PolicyName: Value<string>

    constructor(properties: AppCookieStickinessPolicy) {
        Object.assign(this, properties)
    }
}

export interface LoadBalancerProperties {
    AccessLoggingPolicy?: AccessLoggingPolicy
    AppCookieStickinessPolicy?: List<AppCookieStickinessPolicy>
    AvailabilityZones?: List<Value<string>>
    ConnectionDrainingPolicy?: ConnectionDrainingPolicy
    ConnectionSettings?: ConnectionSettings
    CrossZone?: Value<boolean>
    HealthCheck?: HealthCheck
    Instances?: List<Value<string>>
    LBCookieStickinessPolicy?: List<LBCookieStickinessPolicy>
    Listeners: List<Listeners>
    LoadBalancerName?: Value<string>
    Policies?: List<Policies>
    Scheme?: Value<string>
    SecurityGroups?: List<Value<string>>
    Subnets?: List<Value<string>>
    Tags?: ResourceTag[]
}

export default class LoadBalancer extends ResourceBase {
    static HealthCheck = HealthCheck
    static AccessLoggingPolicy = AccessLoggingPolicy
    static ConnectionSettings = ConnectionSettings
    static LBCookieStickinessPolicy = LBCookieStickinessPolicy
    static ConnectionDrainingPolicy = ConnectionDrainingPolicy
    static Listeners = Listeners
    static Policies = Policies
    static AppCookieStickinessPolicy = AppCookieStickinessPolicy

    constructor(properties?: LoadBalancerProperties) {
        super('AWS::ElasticLoadBalancing::LoadBalancer', properties)
    }
}
