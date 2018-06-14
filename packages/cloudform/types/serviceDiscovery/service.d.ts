import { ResourceBase } from '../resource';
import { Value, List } from '../dataTypes';
export declare class DnsConfig {
    DnsRecords: List<DnsRecord>;
    NamespaceId: Value<string>;
    constructor(properties: DnsConfig);
}
export declare class DnsRecord {
    Type: Value<string>;
    TTL: Value<string>;
    constructor(properties: DnsRecord);
}
export declare class HealthCheckConfig {
    Type: Value<string>;
    ResourcePath?: Value<string>;
    FailureThreshold?: Value<number>;
    constructor(properties: HealthCheckConfig);
}
export interface ServiceProperties {
    Description?: Value<string>;
    DnsConfig: DnsConfig;
    HealthCheckConfig?: HealthCheckConfig;
    Name?: Value<string>;
}
export default class Service extends ResourceBase {
    static DnsConfig: typeof DnsConfig;
    static DnsRecord: typeof DnsRecord;
    static HealthCheckConfig: typeof HealthCheckConfig;
    constructor(properties?: ServiceProperties);
}
