import { ResourceBase, ResourceTag } from '../resource';
import { Value, List } from '../dataTypes';
export declare class HealthCheck {
    HealthyThreshold: Value<string>;
    Interval: Value<string>;
    Target: Value<string>;
    Timeout: Value<string>;
    UnhealthyThreshold: Value<string>;
    constructor(properties: HealthCheck);
}
export declare class AccessLoggingPolicy {
    EmitInterval?: Value<number>;
    Enabled: Value<boolean>;
    S3BucketName: Value<string>;
    S3BucketPrefix?: Value<string>;
    constructor(properties: AccessLoggingPolicy);
}
export declare class ConnectionSettings {
    IdleTimeout: Value<number>;
    constructor(properties: ConnectionSettings);
}
export declare class LBCookieStickinessPolicy {
    CookieExpirationPeriod?: Value<string>;
    PolicyName?: Value<string>;
    constructor(properties: LBCookieStickinessPolicy);
}
export declare class ConnectionDrainingPolicy {
    Enabled: Value<boolean>;
    Timeout?: Value<number>;
    constructor(properties: ConnectionDrainingPolicy);
}
export declare class Listeners {
    InstancePort: Value<string>;
    InstanceProtocol?: Value<string>;
    LoadBalancerPort: Value<string>;
    PolicyNames?: List<Value<string>>;
    Protocol: Value<string>;
    SSLCertificateId?: Value<string>;
    constructor(properties: Listeners);
}
export declare class Policies {
    Attributes: List<any>;
    InstancePorts?: List<Value<string>>;
    LoadBalancerPorts?: List<Value<string>>;
    PolicyName: Value<string>;
    PolicyType: Value<string>;
    constructor(properties: Policies);
}
export declare class AppCookieStickinessPolicy {
    CookieName: Value<string>;
    PolicyName: Value<string>;
    constructor(properties: AppCookieStickinessPolicy);
}
export interface LoadBalancerProperties {
    AccessLoggingPolicy?: AccessLoggingPolicy;
    AppCookieStickinessPolicy?: List<AppCookieStickinessPolicy>;
    AvailabilityZones?: List<Value<string>>;
    ConnectionDrainingPolicy?: ConnectionDrainingPolicy;
    ConnectionSettings?: ConnectionSettings;
    CrossZone?: Value<boolean>;
    HealthCheck?: HealthCheck;
    Instances?: List<Value<string>>;
    LBCookieStickinessPolicy?: List<LBCookieStickinessPolicy>;
    Listeners: List<Listeners>;
    LoadBalancerName?: Value<string>;
    Policies?: List<Policies>;
    Scheme?: Value<string>;
    SecurityGroups?: List<Value<string>>;
    Subnets?: List<Value<string>>;
    Tags?: ResourceTag[];
}
export default class LoadBalancer extends ResourceBase {
    static HealthCheck: typeof HealthCheck;
    static AccessLoggingPolicy: typeof AccessLoggingPolicy;
    static ConnectionSettings: typeof ConnectionSettings;
    static LBCookieStickinessPolicy: typeof LBCookieStickinessPolicy;
    static ConnectionDrainingPolicy: typeof ConnectionDrainingPolicy;
    static Listeners: typeof Listeners;
    static Policies: typeof Policies;
    static AppCookieStickinessPolicy: typeof AppCookieStickinessPolicy;
    constructor(properties?: LoadBalancerProperties);
}
