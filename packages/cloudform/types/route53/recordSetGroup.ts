/* Generated from https://d3teyb21fexa9r.cloudfront.net/latest/gzip/CloudFormationResourceSpecification.json, version 2.2.0 */
   
import {ResourceBase} from '../resource'
import {Value, List} from '../dataTypes'

export class RecordSet {
    AliasTarget?: AliasTarget
    Comment?: Value<string>
    Failover?: Value<string>
    GeoLocation?: GeoLocation
    HealthCheckId?: Value<string>
    HostedZoneId?: Value<string>
    HostedZoneName?: Value<string>
    Name: Value<string>
    Region?: Value<string>
    ResourceRecords?: List<Value<string>>
    SetIdentifier?: Value<string>
    TTL?: Value<string>
    Type: Value<string>
    Weight?: Value<number>

    constructor(properties: RecordSet) {
        Object.assign(this, properties)
    }
}

export class GeoLocation {
    ContinentCode?: Value<string>
    CountryCode?: Value<string>
    SubdivisionCode?: Value<string>

    constructor(properties: GeoLocation) {
        Object.assign(this, properties)
    }
}

export class AliasTarget {
    DNSName: Value<string>
    EvaluateTargetHealth?: Value<boolean>
    HostedZoneId: Value<string>

    constructor(properties: AliasTarget) {
        Object.assign(this, properties)
    }
}

export interface RecordSetGroupProperties {
    Comment?: Value<string>
    HostedZoneId?: Value<string>
    HostedZoneName?: Value<string>
    RecordSets?: List<RecordSet>
}

export default class RecordSetGroup extends ResourceBase {
    static RecordSet = RecordSet
    static GeoLocation = GeoLocation
    static AliasTarget = AliasTarget

    constructor(properties?: RecordSetGroupProperties) {
        super('AWS::Route53::RecordSetGroup', properties)
    }
}
