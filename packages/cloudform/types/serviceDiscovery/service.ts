/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class DnsConfig {
    DnsRecords: List<DnsRecord>
    NamespaceId: Value<string>

    constructor(properties: DnsConfig) {
        Object.assign(this, properties)
    }
}

export class DnsRecord {
    Type: Value<string>
    TTL: Value<string>

    constructor(properties: DnsRecord) {
        Object.assign(this, properties)
    }
}

export class HealthCheckConfig {
    Type: Value<string>
    ResourcePath?: Value<string>
    FailureThreshold?: Value<number>

    constructor(properties: HealthCheckConfig) {
        Object.assign(this, properties)
    }
}

export interface ServiceProperties {
    Description?: Value<string>
    DnsConfig: DnsConfig
    HealthCheckConfig?: HealthCheckConfig
    Name?: Value<string>
}

export default class Service extends ResourceBase {
    static DnsConfig = DnsConfig
    static DnsRecord = DnsRecord
    static HealthCheckConfig = HealthCheckConfig

    constructor(properties?: ServiceProperties) {
        super('AWS::ServiceDiscovery::Service', properties)
    }
}
